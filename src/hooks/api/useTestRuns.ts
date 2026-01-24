import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TestRun = {
  id?: string;
  suite: 'sanity' | 'pentest' | 'performance';
  status: 'passed' | 'failed' | 'running' | 'cancelled';
  started_at: string;
  finished_at?: string | null;
  duration_ms?: number | null;
  commit_sha?: string | null;
  branch?: string | null;
  run_id?: string | null;
  artifacts_url?: string | null;
  summary_json?: Record<string, unknown> | null;
};

async function fetchLatest() {
  const { data, error } = await supabase.functions.invoke<TestRun[]>('test-runs?latest=1', {
    method: 'GET',
    headers: {},
  });
  if (error) throw error;
  return data ?? [];
}

async function fetchHistory(limit = 50) {
  const { data, error } = await supabase.functions.invoke<TestRun[]>(`test-runs?limit=${limit}`, {
    method: 'GET',
    headers: {},
  });
  if (error) throw error;
  return data ?? [];
}

export function useLatestTestRuns() {
  return useQuery({ queryKey: ['test-runs', 'latest'], queryFn: fetchLatest, staleTime: 30_000 });
}

export function useTestRunHistory(limit = 50) {
  return useQuery({ queryKey: ['test-runs', 'history', limit], queryFn: () => fetchHistory(limit), staleTime: 30_000 });
}
