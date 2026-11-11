-- Hosted projects grant every privilege on new public tables to anon and authenticated. RLS still
-- hid the rows, but the grants should say the same thing as the policies, locally and hosted.

revoke all on public.profiles, public.task_types, public.tasks from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.task_types to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
