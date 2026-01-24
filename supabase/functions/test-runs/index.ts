// Supabase Edge Function: Admin test run logging and retrieval
// Routes:
// - GET /?latest=1 or ?limit=100&suite=&status= : admin-only (session) returns test run history
// - POST / : CI reporting with X-CI-TOKEN header matching CI_TEST_REPORT_TOKEN

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CI_TEST_REPORT_TOKEN = Deno.env.get('CI_TEST_REPORT_TOKEN')!;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const reportSchema = z.object({
  suite: z.enum(['sanity', 'pentest', 'performance']),
  status: z.enum(['passed', 'failed', 'running', 'cancelled']),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
  duration_ms: z.number().int().nonnegative().optional(),
  commit_sha: z.string().optional(),
  branch: z.string().optional(),
  run_id: z.string().optional(),
  artifacts_url: z.string().url().optional(),
  summary_json: z.record(z.any()).optional(),
});

async function ensureAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userRes } = await anonClient.auth.getUser();
  const user = userRes?.user;
  if (!user) return null;

  const { data, error } = await service.rpc('is_admin', { user_id: user.id });
  if (error || data !== true) return null;
  return user;
}

serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    const adminUser = await ensureAdmin(req);
    if (!adminUser) return new Response('Forbidden', { status: 403 });

    const suite = url.searchParams.get('suite');
    const status = url.searchParams.get('status');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
    const latest = url.searchParams.get('latest') === '1';

    let query = service
      .from('test_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (suite) query = query.eq('suite', suite);
    if (status) query = query.eq('status', status);

    if (latest) {
      // Return latest per suite
      const { data, error } = await service.rpc('latest_test_runs');
      if (error) return new Response('Error fetching latest', { status: 500 });
      return new Response(JSON.stringify(data ?? []), { headers: { 'Content-Type': 'application/json' } });
    }

    const { data, error } = await query;
    if (error) return new Response('Error fetching runs', { status: 500 });
    return new Response(JSON.stringify(data ?? []), { headers: { 'Content-Type': 'application/json' } });
  }

  if (method === 'POST') {
    const token = req.headers.get('X-CI-TOKEN');
    if (!token || token !== CI_TEST_REPORT_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    const parsed = reportSchema.safeParse(payload);
    if (!parsed.success) {
      return new Response('Invalid payload', { status: 400 });
    }

    const body = parsed.data;
    const { data, error } = await service
      .from('test_runs')
      .upsert(
        {
          suite: body.suite,
          status: body.status,
          started_at: body.started_at ?? new Date().toISOString(),
          finished_at: body.finished_at ?? new Date().toISOString(),
          duration_ms: body.duration_ms,
          commit_sha: body.commit_sha,
          branch: body.branch,
          run_id: body.run_id,
          artifacts_url: body.artifacts_url,
          summary_json: body.summary_json,
        },
        { onConflict: 'run_id,suite' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Failed to upsert test run', error);
      return new Response('Failed to record', { status: 500 });
    }

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Method not allowed', { status: 405 });
});
