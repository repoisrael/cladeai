-- Create test_runs table for logging CI and automated test suite results
create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  suite text not null check (suite in ('sanity','pentest','performance')),
  status text not null check (status in ('passed','failed','running','cancelled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  commit_sha text,
  branch text,
  run_id text,
  artifacts_url text,
  summary_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_runs_suite_started_idx on public.test_runs (suite, started_at desc);
create index if not exists test_runs_status_started_idx on public.test_runs (status, started_at desc);
create index if not exists test_runs_run_id_suite_idx on public.test_runs (run_id, suite);

-- Trigger to maintain updated_at
create or replace function public.set_test_runs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_test_runs_updated_at
before update on public.test_runs
for each row execute procedure public.set_test_runs_updated_at();

-- Ensure admin role for seeded admin user
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where u.email = 'repoisrael@gmail.com'
  and not exists (
    select 1 from public.user_roles ur where ur.user_id = u.id and ur.role = 'admin'
  );

-- RPC to return latest test run per suite
create or replace function public.latest_test_runs()
returns table (
  suite text,
  status text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  commit_sha text,
  branch text,
  run_id text,
  artifacts_url text,
  summary_json jsonb
) language sql stable as $$
  select distinct on (suite)
    suite,
    status,
    started_at,
    finished_at,
    duration_ms,
    commit_sha,
    branch,
    run_id,
    artifacts_url,
    summary_json
  from public.test_runs
  order by suite, started_at desc;
$$;
