import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from storage (fixes repeated login prompts)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Store last auth timestamp to detect stale sessions
      if (session) {
        localStorage.setItem('lastAuthTime', Date.now().toString());
      }
    });

    // Set up auth state listener for session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle different auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          localStorage.setItem('lastAuthTime', Date.now().toString());
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('lastAuthTime');
        }
        
        // Auto-refresh token 5 minutes before expiration
        if (event === 'SIGNED_IN' && session) {
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresInMs = (expiresAt * 1000) - Date.now();
            const refreshTime = expiresInMs - (5 * 60 * 1000); // 5 min before expiry
            
            if (refreshTime > 0) {
              setTimeout(async () => {
                const { error } = await supabase.auth.refreshSession();
                if (error) {
                  console.error('Token refresh failed:', error);
                }
              }, refreshTime);
            }
          }
        }
      }
    );

    // Check for stale sessions on mount (older than 1 hour = refresh)
    const lastAuthTime = localStorage.getItem('lastAuthTime');
    if (lastAuthTime) {
      const timeSinceAuth = Date.now() - parseInt(lastAuthTime);
      const oneHour = 60 * 60 * 1000;
      
      if (timeSinceAuth > oneHour) {
        supabase.auth.refreshSession().catch(console.error);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
