-- FR-9.8: fixed task categories, readable by any signed-in user and never written from the client.

create table public.task_types (
  id int generated always as identity primary key,
  type_name text not null unique check (char_length(type_name) between 1 and 40)
);

insert into public.task_types (type_name)
values ('Work'), ('Health'), ('Study'), ('Errand'), ('Chore'), ('Personal'), ('Routine');

alter table public.task_types enable row level security;

create policy task_types_select_authenticated on public.task_types
for select to authenticated
using (true);

grant select on public.task_types to authenticated;
grant select, insert, update, delete on public.task_types to service_role;
