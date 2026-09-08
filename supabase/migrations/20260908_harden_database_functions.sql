-- Security hardening applied to production.

create or replace function public.studio_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Automatic-RLS helper is administrative only; browser roles must not execute it.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
