-- Task-sized context helpers for ChatGPT now and Studio MCP later.

create or replace function public.studio_get_company_context(p_limit int default 20)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'company_brain', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.updated_at desc)
      from (
        select brain_type, title, body, evidence, status, created_by, approved_by, updated_at
        from public.company_brain
        where status = 'active'
        order by updated_at desc
        limit greatest(1, least(coalesce(p_limit,20),50))
      ) x
    ), '[]'::jsonb),
    'active_memories', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.importance desc, x.updated_at desc)
      from (
        select memory_type, entity_type, entity_ref, title, summary, details, importance, source_type, source_ref, approved_by, updated_at
        from public.memory_items
        where status = 'active'
        order by importance desc, updated_at desc
        limit greatest(1, least(coalesce(p_limit,20),50))
      ) x
    ), '[]'::jsonb),
    'decisions', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select topic, context, decision, rationale, status, proposed_by, approved_by, created_at, approved_at
        from public.decisions
        where status in ('active','proposed')
        order by created_at desc
        limit greatest(1, least(coalesce(p_limit,20),50))
      ) x
    ), '[]'::jsonb)
  );
$$;

create or replace function public.studio_get_content_context(p_limit int default 20)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'content', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'platform', c.platform,
          'pillar', c.pillar,
          'hook', c.hook,
          'body', c.body,
          'status', c.status,
          'source_type', c.source_type,
          'source_label', c.source_label,
          'published_at', c.published_at,
          'updated_at', c.updated_at,
          'latest_metrics', (
            select to_jsonb(m)
            from (
              select views, likes, comments, saves, followers_gained, leads, captured_at
              from public.content_metrics
              where content_id = c.id
              order by captured_at desc
              limit 1
            ) m
          )
        ) order by c.updated_at desc
      )
      from (
        select * from public.content_items
        order by updated_at desc
        limit greatest(1, least(coalesce(p_limit,20),50))
      ) c
    ), '[]'::jsonb)
  );
$$;

create or replace function public.studio_get_weekly_snapshot(p_days int default 7)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'window_days', greatest(1, least(coalesce(p_days,7),90)),
    'active_students', (select count(*) from public.students where status = 'active'),
    'lessons_in_window', (
      select count(*) from public.lessons
      where lesson_date >= current_date - greatest(1, least(coalesce(p_days,7),90))
    ),
    'new_inbox_items', (
      select count(*) from public.inbox_items
      where status = 'new' and created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days,7),90)))
    ),
    'content_pipeline', (
      select jsonb_object_agg(status, cnt)
      from (
        select status, count(*)::int as cnt
        from public.content_items
        group by status
      ) x
    ),
    'recent_lessons', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.lesson_date desc)
      from (
        select l.lesson_date, l.lesson_number, l.title, l.achievement, l.difficulty, l.next_step,
               s.slug as student_slug, s.name as student_name
        from public.lessons l
        join public.students s on s.id = l.student_id
        where l.lesson_date >= current_date - greatest(1, least(coalesce(p_days,7),90))
        order by l.lesson_date desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'recent_decisions', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select topic, decision, rationale, status, created_at
        from public.decisions
        where created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days,7),90)))
        order by created_at desc
        limit 20
      ) x
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.studio_get_company_context(int) from public, anon, authenticated;
revoke all on function public.studio_get_content_context(int) from public, anon, authenticated;
revoke all on function public.studio_get_weekly_snapshot(int) from public, anon, authenticated;
grant execute on function public.studio_get_company_context(int) to service_role;
grant execute on function public.studio_get_content_context(int) to service_role;
grant execute on function public.studio_get_weekly_snapshot(int) to service_role;
