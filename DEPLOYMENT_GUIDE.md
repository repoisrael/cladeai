# Deployment Guide - Forum System & Fake Users

## Prerequisites

- Supabase project with admin access
- Node.js 18+ or Bun runtime
- Environment variables configured

## Step 1: Deploy Database Migration

### Option A: Supabase Dashboard
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Create new query
4. Copy contents of `supabase/migrations/20260122_reddit_forum.sql`
5. Execute query
6. Verify tables created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'forum%';
```

### Option B: Supabase CLI
```bash
supabase db push
```

## Step 2: Regenerate TypeScript Types

```bash
# Using Supabase CLI
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Or manually in dashboard
# Settings > API > Generate Types > Copy to types.ts
```

## Step 3: Generate Fake Users

### Setup Environment Variables
Add to `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # From Supabase Settings > API
```

### Run Generation Script

**Full 1M users (takes ~16 hours):**
```bash
bun run scripts/generate-fake-users.ts
```

**Test with 10K users (takes ~10 minutes):**
```bash
# Modify TOTAL_USERS constant in script to 10000
bun run scripts/generate-fake-users.ts
```

**Progress monitoring:**
```bash
# In another terminal, watch progress
watch -n 5 'psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"'
```

### Script Output
```
🚀 Starting generation of 1,000,000 users...
📍 Israeli users: 150,000 (15%)
🌍 International users: 850,000 (85%)

✅ Batch 1/1000 - 1,000 users (0.10%)
✅ Batch 2/1000 - 2,000 users (0.20%)
...
✅ Batch 1000/1000 - 1,000,000 users (100.00%)

🎉 User generation complete!
📊 Final stats:
   Israeli users: 150,243
   International users: 849,757
   Total: 1,000,000

🎭 Generating forum activity...
Creating forum memberships...
Progress: 100/10000 users
...
Creating posts...
Progress: 100/10000 users
...
✅ Forum activity generated!
🎊 All done!
```

## Step 4: Verify Data

### Check User Distribution
```sql
-- Count by country
SELECT country, COUNT(*) 
FROM profiles 
GROUP BY country 
ORDER BY COUNT(*) DESC;

-- Count by personality type
SELECT personality_type, COUNT(*) 
FROM profiles 
GROUP BY personality_type 
ORDER BY COUNT(*) DESC;

-- Israeli users specifically
SELECT COUNT(*) FROM profiles WHERE country = 'IL';
```

### Check Forum Activity
```sql
-- Forum membership counts
SELECT f.name, f.display_name, f.member_count 
FROM forums f 
ORDER BY member_count DESC;

-- Post counts by forum
SELECT f.name, COUNT(p.id) as posts 
FROM forums f 
LEFT JOIN forum_posts p ON p.forum_id = f.id 
GROUP BY f.id, f.name 
ORDER BY posts DESC;

-- Top posts by votes
SELECT title, vote_count, comment_count 
FROM forum_posts 
ORDER BY vote_count DESC 
LIMIT 10;
```

## Step 5: Configure Rate Limiting

### Supabase Edge Functions (Optional)
Create rate limiter for post creation:

```typescript
// supabase/functions/rate-limiter/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { userId, action } = await req.json()
  
  // Check Redis/KV for rate limit
  const key = `rate:${userId}:${action}`
  // Implement rate limiting logic
  
  return new Response(JSON.stringify({ allowed: true }))
})
```

### Database-level Rate Limiting
```sql
-- Create rate limit table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action)
);

-- Create rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_count INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND action = p_action;
  
  -- Reset if window expired
  IF v_window_start IS NULL OR v_window_start < NOW() - INTERVAL '1 minute' * p_window_minutes THEN
    INSERT INTO rate_limits (user_id, action, count, window_start)
    VALUES (p_user_id, p_action, 1, NOW())
    ON CONFLICT (user_id, action) DO UPDATE
    SET count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  IF v_count < p_max_count THEN
    UPDATE rate_limits SET count = count + 1 WHERE user_id = p_user_id AND action = p_action;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

## Step 6: Monitor Performance

### Database Indexes
Verify indexes created:
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'forum%';
```

### Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM forum_posts 
WHERE forum_id = 'some-uuid' 
ORDER BY vote_count DESC 
LIMIT 50;
```

### Connection Pooling
Recommended settings in Supabase:
- Pool size: 15-20
- Max connections: 100
- Statement timeout: 10s

## Step 7: Enable Real-time

### Supabase Dashboard
1. Database > Replication
2. Enable for tables:
   - `forum_posts`
   - `forum_comments`
   - `forum_votes`
3. Set RLS policies to allow real-time subscriptions

### Test Real-time
```typescript
const subscription = supabase
  .channel('forum-posts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'forum_posts' },
    (payload) => console.log('New post:', payload)
  )
  .subscribe();
```

## Step 8: CDN Configuration (Optional)

### For Avatar Images
Use Supabase Storage or Cloudflare:

```typescript
// Update avatar_url generation in script
const avatar_url = `https://cdn.yoursite.com/avatars/${username}.svg`;
```

### DiceBear API (Current)
Free tier: 1000 requests/day
Upgrade for more: https://www.dicebear.com/pricing

## Troubleshooting

### Issue: Script fails with "Too many requests"
**Solution:** Increase delay between batches:
```typescript
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms instead of 100ms
```

### Issue: TypeScript errors after migration
**Solution:** Regenerate types and restart TS server:
```bash
supabase gen types typescript > src/integrations/supabase/types.ts
# In VSCode: Cmd+Shift+P > TypeScript: Restart TS Server
```

### Issue: Forum posts not loading
**Solution:** Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'forum_posts';
```

### Issue: Duplicate users
**Solution:** Clear and re-run:
```sql
-- DANGER: This deletes all users
TRUNCATE profiles CASCADE;
-- Then re-run script
```

## Performance Optimization

### Database Tuning
```sql
-- Vacuum analyze tables
VACUUM ANALYZE profiles;
VACUUM ANALYZE forum_posts;
VACUUM ANALYZE forum_comments;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Tuning
```typescript
// Implement pagination
const POSTS_PER_PAGE = 25;

// Use cursor-based pagination
const { data } = await supabase
  .from('forum_posts')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, POSTS_PER_PAGE - 1);
```

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key not exposed in client
- [ ] Rate limiting configured
- [ ] Input sanitization implemented
- [ ] CORS configured properly
- [ ] API keys rotated regularly
- [ ] Backup strategy in place
- [ ] Monitoring/alerts configured

## Post-Deployment

### Monitor Error Rates
```bash
# Supabase logs
supabase logs --project-ref YOUR_REF

# Check error rates
SELECT 
  date_trunc('hour', created_at) as hour,
  COUNT(*) 
FROM logs 
WHERE level = 'error' 
GROUP BY hour 
ORDER BY hour DESC;
```

### User Engagement Metrics
```sql
-- Daily active users
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM forum_posts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most active forums
SELECT 
  f.name,
  COUNT(p.id) as posts_last_24h
FROM forums f
JOIN forum_posts p ON p.forum_id = f.id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
GROUP BY f.id, f.name
ORDER BY posts_last_24h DESC;
```

## Support

For issues:
1. Check [QA_REPORT.md](./QA_REPORT.md)
2. Review Supabase logs
3. Check TypeScript errors
4. Verify RLS policies

---

**Estimated deployment time:** 2-3 hours (excluding user generation)  
**User generation time:** 16-20 hours for 1M users  
**Recommended:** Start with 10K users for testing
