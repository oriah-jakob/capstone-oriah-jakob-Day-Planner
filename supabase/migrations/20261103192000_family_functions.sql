-- FR-16 to FR-18. Each function checks who is calling before it writes; the tables accept no
-- direct writes from the API.

create function public.create_family(p_family_name text) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_family uuid;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  if exists (select 1 from public.family_members where user_id = v_user) then
    raise exception 'You already belong to a family.' using errcode = 'P0001';
  end if;

  insert into public.families (family_name, owner_user_id)
  values (btrim(p_family_name), v_user)
  returning id into v_family;

  insert into public.family_members (family_id, user_id, role) values (v_family, v_user, 'owner');
  return v_family;
end;
$$;

-- One message for "no such account" and "already in a family", so the form cannot be used to
-- find out which email addresses are registered (NFR-8.1).
create function public.add_family_member(p_email text) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid;
  v_member uuid;
begin
  select id into v_family from public.families where owner_user_id = auth.uid();
  if v_family is null then
    raise exception 'Only the family owner can add members.' using errcode = '42501';
  end if;

  select p.id into v_member
    from public.profiles p
   where p.email = lower(btrim(p_email))
     and not exists (select 1 from public.family_members m where m.user_id = p.id);

  if v_member is null then
    raise exception 'We could not add that person. Check the email address; they need a Remmi account and cannot already be in a family.'
      using errcode = 'P0001';
  end if;

  insert into public.family_members (family_id, user_id, role) values (v_family, v_member, 'member');
end;
$$;

-- The owner can remove members but not themselves.
create function public.remove_family_member(p_user_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid;
begin
  select id into v_family from public.families where owner_user_id = auth.uid();
  if v_family is null then
    raise exception 'Only the family owner can remove members.' using errcode = '42501';
  end if;

  delete from public.family_members
   where family_id = v_family and user_id = p_user_id and role = 'member';

  if not found then
    raise exception 'That person is not a member of your family.' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.create_family(text) from public, anon;
revoke execute on function public.add_family_member(text) from public, anon;
revoke execute on function public.remove_family_member(uuid) from public, anon;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.add_family_member(text) to authenticated;
grant execute on function public.remove_family_member(uuid) to authenticated;
