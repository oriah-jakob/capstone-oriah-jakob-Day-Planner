-- FR-9: tasks on a personal timeline. Checks mirror the client schema so they hold for direct API calls too.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  task_type_id int not null references public.task_types (id),
  title text not null check (title = btrim(title) and char_length(title) between 1 and 120),
  note text check (char_length(note) between 1 and 1000),
  task_date date not null,
  start_time time not null,
  end_time time not null,
  completion_status text not null default 'not_completed'
    check (completion_status in ('completed', 'not_completed')),

  -- Mockup-only fields; the columns exist now so their UI weeks need no migration.
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  hidden_from_family boolean not null default false,
  notification_override_minutes int check (notification_override_minutes between 0 and 1440),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_end_after_start check (end_time > start_time)
);

-- NFR-13: serves the day timeline query directly.
create index tasks_owner_day_idx on public.tasks (owner_user_id, task_date, start_time);

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy tasks_select_own on public.tasks
for select to authenticated
using ((select auth.uid()) = owner_user_id);

create policy tasks_insert_own on public.tasks
for insert to authenticated
with check ((select auth.uid()) = owner_user_id);

create policy tasks_update_own on public.tasks
for update to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

create policy tasks_delete_own on public.tasks
for delete to authenticated
using ((select auth.uid()) = owner_user_id);

grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.tasks to service_role;
