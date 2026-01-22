import { useState } from 'react';
import { useNavigate } from 'router';
import { motion } from 'framer-motion';
import { Music, Headphones, Heart, TrendingUp, Mic2, Guitar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MUSIC_GENRES = [
  { id: 'hip-hop', label: 'Hip Hop', icon: Mic2, color: 'text-orange-500' },
  { id: 'rock', label: 'Rock', icon: Guitar, color: 'text-red-500' },
  { id: 'pop', label: 'Pop', icon: Sparkles, color: 'text-pink-500' },
  { id: 'jazz', label: 'Jazz', icon: Music, color: 'text-blue-500' },
  { id: 'electronic', label: 'Electronic', icon: TrendingUp, color: 'text-purple-500' },
  { id: 'rb-soul', label: 'R&B/Soul', icon: Heart, color: 'text-rose-500' },
  { id: 'classical', label: 'Classical', icon: Music, color: 'text-amber-500' },
  { id: 'country', label: 'Country', icon: Guitar, color: 'text-yellow-600' },
  { id: 'reggae', label: 'Reggae', icon: Music, color: 'text-green-500' },
  { id: 'metal', label: 'Metal', icon: Guitar, color: 'text-gray-500' },
  { id: 'indie', label: 'Indie', icon: Sparkles, color: 'text-teal-500' },
  { id: 'folk', label: 'Folk', icon: Guitar, color: 'text-emerald-600' },
];

const LISTENING_HABITS = [
  { id: 'discovery', label: 'Always discovering new music', icon: Sparkles },
  { id: 'mood-based', label: 'Listen based on my mood', icon: Heart },
  { id: 'albums', label: 'Prefer full albums over singles', icon: Music },
  { id: 'playlists', label: 'Create & follow playlists', icon: TrendingUp },
  { id: 'live', label: 'Love live performances', icon: Mic2 },
  { id: 'background', label: 'Music as background', icon: Headphones },
];

export function MusicTasteSurvey() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev =>
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) {
      toast({
        title: 'Select at least one genre',
        description: 'Help us understand your music taste',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in first',
          variant: 'destructive',
        });
        return;
      }

      // Save preferences to profile
      const { error } = await supabase
        .from('profiles')
        .update({
          music_genres: selectedGenres,
          listening_habits: selectedHabits,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Preferences saved!',
        description: 'Your music taste has been recorded',
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl mb-4"
          >
            🎵
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">What music moves you?</h1>
          <p className="text-muted-foreground">
            Help us personalize your experience by sharing your music taste
          </p>
        </div>

        {/* Genres */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Music className="h-6 w-6" />
            Favorite Genres
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select all that apply (choose at least one)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MUSIC_GENRES.map((genre) => {
              const Icon = genre.icon;
              const isSelected = selectedGenres.includes(genre.id);

              return (
                <motion.button
                  key={genre.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleGenre(genre.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg'
                      : 'border-border hover:border-purple-300'
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-purple-500' : genre.color}`} />
                  <span className={`text-sm font-semibold ${isSelected ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                    {genre.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* Listening Habits */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            How do you listen?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tell us about your listening habits (optional)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LISTENING_HABITS.map((habit) => {
              const Icon = habit.icon;
              const isSelected = selectedHabits.includes(habit.id);

              return (
                <motion.button
                  key={habit.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleHabit(habit.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-border hover:border-pink-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-pink-500' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-pink-600 dark:text-pink-400' : ''}`}>
                    {habit.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={loading || selectedGenres.length === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
