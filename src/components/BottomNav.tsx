import { Home, Search, Music2, User, Users, ListMusic, MessageSquare } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/forum', icon: MessageSquare, label: 'Forums' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/playlists', icon: ListMusic, label: 'Lists' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group flex flex-col items-center gap-1 px-3 py-2 rounded-xl relative transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
