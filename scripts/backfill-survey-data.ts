/**
 * Backfill Survey Data for Historical Users
 * 
 * Generates realistic survey responses for 1 million users spread across 2 years.
 * Creates a gradual userbase growth pattern matching typical startup metrics.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Music genres from survey
const GENRES = [
  'Hip Hop',
  'Rock',
  'Pop',
  'Jazz',
  'Electronic',
  'R&B/Soul',
  'Classical',
  'Country',
  'Reggae',
  'Metal',
  'Indie',
  'Folk',
] as const;

// Listening habits from survey
const HABITS = [
  'Discovery Mode',
  'Mood-based',
  'Full Albums',
  'Curated Playlists',
  'Live Performances',
  'Background Listening',
] as const;

// Personality types for comment automation
const PERSONALITIES = [
  'music_nerd',
  'hype_beast',
  'troll',
  'wholesome',
  'critic',
  'casual',
  'meme_lord',
  'old_head',
] as const;

/**
 * Generate a realistic timestamp between 2 years ago and now
 * Following a growth curve: exponential growth pattern
 */
function generateRegistrationTimestamp(userIndex: number, totalUsers: number): Date {
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  const twoYearsMs = now.getTime() - twoYearsAgo.getTime();
  
  // Exponential growth curve: more users in recent months
  // Using power function to create realistic startup growth
  const growthFactor = Math.pow(userIndex / totalUsers, 0.5); // Square root for moderate growth
  const timestamp = new Date(twoYearsAgo.getTime() + (twoYearsMs * growthFactor));
  
  return timestamp;
}

/**
 * Generate random genre preferences (1-5 genres)
 */
function generateGenrePreferences(): string[] {
  const numGenres = Math.floor(Math.random() * 4) + 1; // 1-5 genres
  const shuffled = [...GENRES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numGenres);
}

/**
 * Generate random listening habits (1-3 habits)
 */
function generateListeningHabits(): string[] {
  const numHabits = Math.floor(Math.random() * 3) + 1; // 1-3 habits
  const shuffled = [...HABITS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numHabits);
}

/**
 * Select personality type based on genre preferences
 */
function selectPersonalityType(genres: string[]): string {
  // Genre-based personality mapping
  if (genres.includes('Classical') || genres.includes('Jazz')) {
    return Math.random() < 0.5 ? 'music_nerd' : 'critic';
  }
  if (genres.includes('Hip Hop') || genres.includes('Electronic')) {
    return Math.random() < 0.5 ? 'hype_beast' : 'meme_lord';
  }
  if (genres.includes('Metal') || genres.includes('Rock')) {
    return Math.random() < 0.3 ? 'old_head' : 'casual';
  }
  if (genres.includes('Pop')) {
    return Math.random() < 0.4 ? 'wholesome' : 'casual';
  }
  
  // Default random selection
  return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
}

/**
 * Backfill survey data in batches
 */
async function backfillSurveyData() {
  console.log('🚀 Starting survey data backfill...\n');
  
  // Fetch users without survey data
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .is('music_genres', null)
    .order('created_at', { ascending: true })
    .limit(1000000);
  
  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('✅ No users need survey data backfill');
    return;
  }
  
  console.log(`📊 Found ${users.length.toLocaleString()} users to backfill\n`);
  
  const BATCH_SIZE = 1000;
  const totalBatches = Math.ceil(users.length / BATCH_SIZE);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, users.length);
    const batch = users.slice(batchStart, batchEnd);
    
    // Generate updates for this batch
    const updates = batch.map((user, index) => {
      const globalIndex = batchStart + index;
      const registrationDate = generateRegistrationTimestamp(globalIndex, users.length);
      const genres = generateGenrePreferences();
      const habits = generateListeningHabits();
      const personality = selectPersonalityType(genres);
      
      return {
        id: user.id,
        music_genres: genres,
        listening_habits: habits,
        personality_type: personality,
        onboarding_completed: true,
        // Update created_at to match gradual growth
        created_at: registrationDate.toISOString(),
      };
    });
    
    // Execute batch update
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' });
    
    if (updateError) {
      console.error(`❌ Batch ${i + 1}/${totalBatches} failed:`, updateError);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      const progress = ((i + 1) / totalBatches * 100).toFixed(1);
      console.log(`✅ Batch ${i + 1}/${totalBatches} complete (${progress}%) - ${successCount.toLocaleString()} users updated`);
    }
    
    // Rate limiting: small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📈 Backfill Summary:');
  console.log(`   ✅ Success: ${successCount.toLocaleString()} users`);
  console.log(`   ❌ Errors: ${errorCount.toLocaleString()} users`);
  console.log(`   📊 Total processed: ${(successCount + errorCount).toLocaleString()} users`);
}

/**
 * Generate growth analytics report
 */
async function generateGrowthReport() {
  console.log('\n📊 Generating Growth Analytics Report...\n');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('created_at, music_genres')
    .not('music_genres', 'is', null)
    .order('created_at', { ascending: true });
  
  if (error || !profiles) {
    console.error('❌ Error generating report:', error);
    return;
  }
  
  // Group by month
  const monthlyGrowth = new Map<string, number>();
  profiles.forEach(profile => {
    const date = new Date(profile.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyGrowth.set(monthKey, (monthlyGrowth.get(monthKey) || 0) + 1);
  });
  
  // Calculate cumulative growth
  let cumulative = 0;
  const growthData: Array<{ month: string; new_users: number; total_users: number }> = [];
  
  Array.from(monthlyGrowth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, count]) => {
      cumulative += count;
      growthData.push({
        month,
        new_users: count,
        total_users: cumulative,
      });
    });
  
  console.log('📈 User Growth by Month:\n');
  console.log('Month       | New Users | Total Users | Growth Rate');
  console.log('------------|-----------|-------------|------------');
  
  growthData.forEach((row, index) => {
    const growthRate = index > 0 
      ? ((row.new_users / growthData[index - 1].new_users - 1) * 100).toFixed(1) + '%'
      : 'N/A';
    
    console.log(
      `${row.month} | ${String(row.new_users).padStart(9)} | ${String(row.total_users).padStart(11)} | ${growthRate.padStart(10)}`
    );
  });
  
  // Genre popularity over time
  const genrePopularity = new Map<string, number>();
  profiles.forEach(profile => {
    profile.music_genres?.forEach((genre: string) => {
      genrePopularity.set(genre, (genrePopularity.get(genre) || 0) + 1);
    });
  });
  
  console.log('\n🎵 Most Popular Genres:\n');
  Array.from(genrePopularity.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([genre, count], index) => {
      const percentage = ((count / profiles.length) * 100).toFixed(1);
      console.log(`${index + 1}. ${genre.padEnd(15)} - ${count.toLocaleString()} users (${percentage}%)`);
    });
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   CladeAI Survey Data Backfill Tool                    ║');
  console.log('║   Backfilling 1M users across 2 years                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  try {
    await backfillSurveyData();
    await generateGrowthReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Backfill completed in ${duration}s`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { backfillSurveyData, generateGrowthReport };
