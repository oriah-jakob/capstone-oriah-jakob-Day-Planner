-- FR-10: a family is one owner plus the personal accounts linked to it. Rows are only ever
-- written by the functions in the next migration, so the tables expose reads alone.

create table public.families (
  id uuid primary key default gen_random_uuid(),
  family_name text not null
    check (family_name = btrim(family_name) and char_length(family_name) between 1 and 60),
  owner_user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  -- One family per person.
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create index family_members_family_idx on public.family_members (family_id);

-- A policy on family_members that queried family_members would recurse; this reads it as the owner.
create function public.current_family_id() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select family_id from public.family_members where user_id = (select auth.uid())
$$;

-- FR-8.6: the account type always matches the membership.
create function public.sync_account_type() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.profiles set account_type = 'personal' where id = old.user_id;
    return old;
  end if;

  update public.profiles
     set account_type = case new.role when 'owner' then 'family_owner' else 'family_member' end
   where id = new.user_id;
  return new;
end;
$$;

create trigger family_members_sync_account_type
after insert or delete on public.family_members
for each row
execute function public.sync_account_type();

alter table public.families enable row level security;
alter table public.family_members enable row level security;

create policy families_select_own on public.families
for select to authenticated
using (id = (select public.current_family_id()));

create policy family_members_select_same_family on public.family_members
for select to authenticated
using (family_id = (select public.current_family_id()));

revoke all on public.families, public.family_members from anon, authenticated;
grant select on public.families, public.family_members to authenticated;
grant select, insert, update, delete on public.families, public.family_members to service_role;

revoke execute on function public.current_family_id() from public, anon;
grant execute on function public.current_family_id() to authenticated;
revoke execute on function public.sync_account_type() from public, anon, authenticated;
