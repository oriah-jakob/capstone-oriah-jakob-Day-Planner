-- Audit log for NFR-9: system errors and security-relevant events are recorded
-- for troubleshooting and auditing.
--
-- NFR-9.1 requires timestamp, event type, user identifier where applicable, and
-- a non-sensitive error description. Writes come from the serverless auth
-- endpoints using the service role; nothing in the browser can read or write
-- this table, so the log cannot be suppressed or mined by a logged-in user.

create table public.audit_logs (
  id bigint generated always as identity primary key,

  occurred_at timestamptz not null default now(),

  -- e.g. login_success, login_failure, register_success, password_reset_request
  event_type text not null check (char_length(event_type) between 1 and 64),

  -- Null for pre-authentication events such as a failed login against an
  -- address that does not exist. Survives account deletion so the trail is not
  -- erased by removing the user.
  user_id uuid references auth.users (id) on delete set null,

  severity text not null default 'info' check (severity in ('info', 'warn', 'error')),

  -- Never put credentials, tokens, or raw request bodies here. Descriptions are
  -- fixed strings chosen by the caller, not interpolated user input.
  description text not null check (char_length(description) between 1 and 500)
);

comment on table public.audit_logs is
  'Append-only security and error audit trail. Service role access only.';

create index audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);
create index audit_logs_event_type_idx on public.audit_logs (event_type, occurred_at desc);
create index audit_logs_user_id_idx on public.audit_logs (user_id, occurred_at desc)
where user_id is not null;

alter table public.audit_logs enable row level security;

-- Deliberately no policies. RLS with zero policies denies everything to anon
-- and authenticated; the service role bypasses RLS entirely. The explicit
-- revoke removes the default grants so the table is unreachable even if a
-- policy is added by mistake later.
revoke all on public.audit_logs from anon, authenticated;

-- Row level security bypass is not a table privilege, so the writer still needs
-- this grant. The identity column's sequence is owned by the column and needs
-- no separate grant.
grant select, insert on public.audit_logs to service_role;
