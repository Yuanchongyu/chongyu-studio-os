-- Chongyu Studio OS - immediate Supabase lockdown
-- Run this in Supabase Dashboard > SQL Editor before connecting real student/company data.
--
-- V1 security posture:
--   1) Every Studio table has Row Level Security enabled.
--   2) Browser roles (anon/authenticated) have no direct table privileges yet.
--   3) The server-side service_role can still access these tables.
--
-- When Supabase Auth is wired into the app, add explicit least-privilege grants
-- and founder-only RLS policies in a later migration.

alter table public.students enable row level security;
alter table public.lessons enable row level security;
alter table public.student_skills enable row level security;
alter table public.projects enable row level security;
alter table public.artifacts enable row level security;
alter table public.parent_updates enable row level security;
alter table public.content_items enable row level security;
alter table public.content_metrics enable row level security;
alter table public.decisions enable row level security;
alter table public.company_brain enable row level security;
alter table public.inbox_items enable row level security;
alter table public.ai_runs enable row level security;

-- Defense in depth for the current server-only V1 database access model.
revoke all on table public.students from anon, authenticated;
revoke all on table public.lessons from anon, authenticated;
revoke all on table public.student_skills from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.artifacts from anon, authenticated;
revoke all on table public.parent_updates from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;
revoke all on table public.content_metrics from anon, authenticated;
revoke all on table public.decisions from anon, authenticated;
revoke all on table public.company_brain from anon, authenticated;
revoke all on table public.inbox_items from anon, authenticated;
revoke all on table public.ai_runs from anon, authenticated;

-- Verification: every row below should show rls_enabled = true.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'students','lessons','student_skills','projects','artifacts','parent_updates',
    'content_items','content_metrics','decisions','company_brain','inbox_items','ai_runs'
  )
order by c.relname;
