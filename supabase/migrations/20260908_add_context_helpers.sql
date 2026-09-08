-- Compact, task-specific context helpers for AI tools and future Studio MCP.

create or replace function public.studio_get_student_context(
  p_slug text,
  p_lesson_limit int default 5
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'student', jsonb_build_object(
      'id', s.id,
      'slug', s.slug,
      'name', s.name,
      'age', s.age,
      'current_level', s.current_level,
      'current_project', s.current_project,
      'status', s.status,
      'progress', s.progress,
      'parent_notes', s.parent_notes
    ),
    'recent_lessons', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.lesson_date desc, x.lesson_number desc)
      from (
        select id, lesson_number, lesson_date, title, summary, achievement, difficulty, next_step
        from public.lessons
        where student_id = s.id
        order by lesson_date desc nulls last, lesson_number desc nulls last
        limit greatest(1, least(coalesce(p_lesson_limit, 5), 20))
      ) x
    ), '[]'::jsonb),
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
        'skill', skill_name,
        'score', score,
        'confidence', confidence,
        'evidence', evidence,
        'updated_at', updated_at
      ) order by skill_name)
      from public.student_skills
      where student_id = s.id
    ), '[]'::jsonb),
    'parent_updates', coalesce((
      select jsonb_agg(to_jsonb(pu) order by pu.created_at desc)
      from (
        select update_type, draft, status, created_at
        from public.parent_updates
        where student_id = s.id
        order by created_at desc
        limit 5
      ) pu
    ), '[]'::jsonb),
    'student_memory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'memory_type', memory_type,
        'title', title,
        'summary', summary,
        'importance', importance,
        'updated_at', updated_at
      ) order by importance desc, updated_at desc)
      from public.memory_items
      where status = 'active'
        and entity_type = 'student'
        and entity_ref in (s.slug, s.id::text)
    ), '[]'::jsonb),
    'company_rules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'memory_type', memory_type,
        'title', title,
        'summary', summary,
        'importance', importance
      ) order by importance desc, updated_at desc)
      from (
        select * from public.memory_items
        where status = 'active' and entity_type = 'company'
        order by importance desc, updated_at desc
        limit 10
      ) cm
    ), '[]'::jsonb)
  )
  from public.students s
  where s.slug = p_slug
  limit 1;
$$;

create or replace function public.studio_search_memory(
  p_query text,
  p_limit int default 8
)
returns table (
  id uuid,
  memory_type text,
  entity_type text,
  entity_ref text,
  title text,
  summary text,
  importance int,
  status text,
  updated_at timestamptz
)
language sql
stable
set search_path = public
as $$
  select m.id, m.memory_type, m.entity_type, m.entity_ref, m.title, m.summary,
         m.importance, m.status, m.updated_at
  from public.memory_items m
  where m.status = 'active'
    and (
      coalesce(p_query, '') = ''
      or m.title ilike '%' || p_query || '%'
      or m.summary ilike '%' || p_query || '%'
      or m.details::text ilike '%' || p_query || '%'
    )
  order by m.importance desc, m.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 8), 30));
$$;

revoke all on function public.studio_get_student_context(text,int) from public, anon, authenticated;
revoke all on function public.studio_search_memory(text,int) from public, anon, authenticated;
grant execute on function public.studio_get_student_context(text,int) to service_role;
grant execute on function public.studio_search_memory(text,int) to service_role;
