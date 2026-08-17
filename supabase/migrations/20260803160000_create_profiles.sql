-- Profiles: one row per registered user, 1:1 with auth.users.
--
-- Credentials are NOT stored here. Supabase Auth owns them in auth.users and
-- hashes with bcrypt, which satisfies FR-8.5 ("password stored in a protected
-- form") and NFR-4 ("modern, adaptive hashing algorithm"). The proposal ERD
-- shows users.password_hash; that column is deliberately absent because
-- duplicating credential storage would be strictly worse than delegating it.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- FR-8.2 / FR-8.3
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),

  -- FR-8.4. Stored lowercase so uniqueness is case-insensitive without
  -- pulling in the citext extension. auth.users already lowercases emails.
  email text not null unique check (email = lower(email)),

  -- FR-8.6. Derived from family membership from week 9 onward; every account
  -- starts standalone.
  account_type text not null default 'personal'
    check (account_type in ('personal', 'family_owner', 'family_member')),

  -- FR-8.8. Lead time in minutes for the reminder email (FR-20.1).
  notification_timer_minutes int not null default 15
    check (notification_timer_minutes between 0 and 1440),

  -- Not in the proposal ERD, but required: tasks store wall-clock date + time,
  -- so the notification queue cannot compute an absolute send instant without
  -- knowing the user's zone. Without this, reminders fire at the wrong moment
  -- for anyone outside the server's timezone.
  timezone text not null default 'America/Toronto',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile for each auth.users row. Credentials live in auth.users.';

-- Keep updated_at honest rather than trusting clients to send it.
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Create the profile as a side effect of signup so a user can never exist in
-- auth.users without a matching profile. SECURITY DEFINER because the signing
-- up user has no rights on public.profiles yet.
--
-- Missing names raise here rather than inserting placeholder data. The only
-- signup path is /api/auth/register, which validates names before calling
-- Supabase, so a legitimate registration never trips this.
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    lower(new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Block privilege escalation and identity rewriting through the ordinary
-- profile update path. A user may change their name, timer, and timezone;
-- everything else is off limits.
--
-- current_user is 'authenticated' for a logged-in PostgREST request. SECURITY
-- DEFINER functions (week 9 family membership) and the service role run as a
-- different role, so they pass through.
create or replace function public.profiles_guard_protected_columns() returns trigger
language plpgsql
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.account_type is distinct from old.account_type
    or new.created_at is distinct from old.created_at
  then
    raise exception 'profile column is not user editable'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_protected_columns
before update on public.profiles
for each row
execute function public.profiles_guard_protected_columns();

-- Row level security -------------------------------------------------------
-- Week 3 scope: a user sees and edits only their own row. Family read access
-- (FR-19) is added in week 9.

alter table public.profiles enable row level security;

-- auth.uid() is wrapped in a subselect so Postgres evaluates it once per
-- statement instead of once per row.
create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- No insert policy: rows arrive only via handle_new_user().
-- No delete policy: profiles disappear with their auth.users row.

-- Table privileges are separate from row level security, and Supabase's default
-- privileges do not cover tables created by a migration. Without these grants
-- the policies above never get a chance to run: every statement is refused at
-- the privilege check first.
--
-- authenticated gets no insert (the signup trigger owns that) and no delete
-- (profiles go with their auth.users row).
grant select, update on public.profiles to authenticated;

-- service_role bypasses row level security but still needs the privilege.
grant select, insert, update, delete on public.profiles to service_role;
