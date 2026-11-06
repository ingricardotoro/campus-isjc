-- Admissions module: hard deletion of a prospect for admins, and a guard that
-- keeps prospects from being assigned to anyone but active staff who can edit.
--
-- Additive: no existing table, policy, or function changes, and grants stay per
-- object. The tables keep having no DELETE grant, so the function below remains
-- the only way for the application to delete a prospect or a guardian.

-- ---------------------------------------------------------------------------
-- Prospect deletion
-- ---------------------------------------------------------------------------

-- Removes a prospect with its follow-up, and its guardian when no other prospect
-- uses it. SECURITY DEFINER because no application role holds DELETE on these
-- tables, and no trigger or rule on them acts on DELETE.
--
-- Callable by authenticated only, so that admissions_current_role() decides with
-- the caller's own identity. service_role has no user behind it and stays out.
-- The role check comes first so a refused caller cannot probe which ids exist.
--
-- Concurrency: admissions_register_public_interest matches a guardian by phone or
-- email under one advisory lock per normalized key, so taking the same locks for
-- the guardian's current keys serializes this function with every registration
-- that could match it. A registration either finishes first, and the check below
-- sees its prospect, or starts after, and no longer finds the guardian. Without
-- them it could find the guardian and then hit a foreign key error on insert.
--
-- Lock order is advisory keys, prospect row, guardian row: the same order as a
-- registration, whose foreign key check locks the guardian after writing the
-- prospect, so the two cannot deadlock. FOR UPDATE on the guardian conflicts with
-- the FOR KEY SHARE of that check, which also covers staff writes that skip the
-- advisory locks: the check below runs after any such write has committed.
--
-- The keys are read before they can be locked, so a staff edit can change them
-- meanwhile. Deleting under stale locks would reopen the race, so that case
-- raises 40001 and rolls back, and the caller can retry.
--
-- This relies on READ COMMITTED, where each statement here sees what the previous
-- lock holder committed. Other isolation levels raise 40001 on these conflicts.
create function public.admissions_delete_prospect(p_prospect_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guardian_id uuid;
  v_phone text;
  v_email text;
  v_locked_guardian_id uuid;
  v_locked_phone text;
  v_locked_email text;
begin
  if public.admissions_current_role() is distinct from 'admin' then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select p.guardian_id, g.phone_normalized, g.email_normalized
  into v_guardian_id, v_phone, v_email
  from public.admissions_prospects p
  join public.admissions_guardians g on g.id = p.guardian_id
  where p.id = p_prospect_id;

  if not found then
    raise exception 'prospect not found' using errcode = 'P0002';
  end if;

  -- Same keys and same sorted order as the registration function.
  perform pg_advisory_xact_lock(hashtextextended(k.key, 0))
  from (
    select 'admissions:phone:' || v_phone as key where v_phone is not null
    union all
    select 'admissions:email:' || v_email where v_email is not null
    order by 1
  ) k;

  select p.guardian_id into v_locked_guardian_id
  from public.admissions_prospects p
  where p.id = p_prospect_id
  for update;

  -- A previous lock holder may have deleted it while this call waited.
  if not found then
    raise exception 'prospect not found' using errcode = 'P0002';
  end if;
  if v_locked_guardian_id <> v_guardian_id then
    raise exception 'prospect changed during deletion, retry' using errcode = '40001';
  end if;

  delete from public.admissions_activities a where a.prospect_id = p_prospect_id;
  delete from public.admissions_status_history h where h.prospect_id = p_prospect_id;
  delete from public.admissions_tasks t where t.prospect_id = p_prospect_id;
  delete from public.admissions_visits v where v.prospect_id = p_prospect_id;
  delete from public.admissions_prospects p where p.id = p_prospect_id;

  select g.phone_normalized, g.email_normalized into v_locked_phone, v_locked_email
  from public.admissions_guardians g
  where g.id = v_guardian_id
  for update;

  if exists (select 1 from public.admissions_prospects p where p.guardian_id = v_guardian_id) then
    return;
  end if;

  if v_locked_phone is distinct from v_phone or v_locked_email is distinct from v_email then
    raise exception 'guardian changed during deletion, retry' using errcode = '40001';
  end if;

  delete from public.admissions_guardians g where g.id = v_guardian_id;
end;
$$;

revoke all on function public.admissions_delete_prospect(uuid) from public, anon, authenticated, service_role;
grant execute on function public.admissions_delete_prospect(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Assignee guard
-- ---------------------------------------------------------------------------

-- Validates only a change of assignee, so a prospect whose assignee was
-- deactivated later stays editable until someone reassigns it.
--
-- SECURITY DEFINER so the answer does not depend on what the caller's RLS shows
-- of admissions_profiles. An unknown id fails here too, before the foreign key.
--
-- The profile row is not locked: an assignment racing a deactivation is the same
-- as assigning first and deactivating after, which this guard already allows.
create function public.admissions_guard_prospect_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  if not exists (
    select 1 from public.admissions_profiles p
    where p.id = new.assigned_to
      and p.is_active
      and p.role in ('admin', 'admissions_manager', 'admissions_agent')
  ) then
    raise exception 'assignee must be active staff who can edit' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.admissions_guard_prospect_assignee() from public, anon, authenticated, service_role;

create trigger admissions_prospects_guard_assignee
  before insert or update of assigned_to on public.admissions_prospects
  for each row execute function public.admissions_guard_prospect_assignee();
