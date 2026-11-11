-- FR-19: everyone in a family can read each other's profiles and timelines. The write policies
-- on tasks still match only the owner, so nobody can change a timeline that is not theirs.

create function public.shares_family_with(p_user_id uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.family_members
     where user_id = p_user_id
       and family_id = (select public.current_family_id())
  )
$$;

revoke execute on function public.shares_family_with(uuid) from public, anon;
grant execute on function public.shares_family_with(uuid) to authenticated;

create policy profiles_select_family on public.profiles
for select to authenticated
using (public.shares_family_with(id));

create policy tasks_select_family on public.tasks
for select to authenticated
using (not hidden_from_family and public.shares_family_with(owner_user_id));
