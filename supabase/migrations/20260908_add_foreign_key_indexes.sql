-- Cover foreign keys used by Studio context and relationship queries.

create index if not exists artifacts_student_id_idx on public.artifacts(student_id);
create index if not exists artifacts_lesson_id_idx on public.artifacts(lesson_id);
create index if not exists artifacts_project_id_idx on public.artifacts(project_id);
create index if not exists parent_updates_student_id_idx on public.parent_updates(student_id);
create index if not exists parent_updates_lesson_id_idx on public.parent_updates(lesson_id);
create index if not exists projects_student_id_idx on public.projects(student_id);
create index if not exists student_skills_source_lesson_id_idx on public.student_skills(source_lesson_id);
