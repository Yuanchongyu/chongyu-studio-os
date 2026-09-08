-- Ensure the trusted Vercel backend role can access Studio tables through Supabase Data API.
-- The project intentionally revokes anon/authenticated browser privileges in V1.

grant usage on schema public to service_role;

grant select, insert, update, delete on table
  public.students,
  public.lessons,
  public.student_skills,
  public.projects,
  public.artifacts,
  public.parent_updates,
  public.content_items,
  public.content_metrics,
  public.decisions,
  public.company_brain,
  public.inbox_items,
  public.ai_runs,
  public.memory_items
  to service_role;

grant usage, select, update on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select, update on sequences to service_role;

grant execute on function public.studio_get_student_context(text, integer) to service_role;
grant execute on function public.studio_search_memory(text, integer) to service_role;
grant execute on function public.studio_get_company_context(integer) to service_role;
grant execute on function public.studio_get_content_context(integer) to service_role;
grant execute on function public.studio_get_weekly_snapshot(integer) to service_role;
