-- Admissions module: privileges, RLS, role helper, triggers, and the public
-- registration function.
--
-- Grants are per object. Nothing here touches schema-wide privileges or default
-- privileges, so existing tables in public are unaffected.

-- ---------------------------------------------------------------------------
-- Baseline: close every module table, then open only what each role needs
-- ---------------------------------------------------------------------------

-- Supabase default privileges grant ALL on new public tables to anon,
-- authenticated, and service_role, so each table starts by revoking them.
do $$
declare
  module_table text;
begin
  foreach module_table in array array[
    'admissions_profiles', 'admissions_guardians', 'admissions_academic_years',
    'admissions_grades', 'admissions_modalities', 'admissions_grade_modalities',
    'admissions_statuses', 'admissions_sources', 'admissions_campaigns',
    'admissions_prospects', 'admissions_activities', 'admissions_tasks',
    'admissions_visits', 'admissions_status_history'
  ] loop
    execute format('alter table public.%I enable row level security', module_table);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', module_table);
  end loop;
end $$;

-- Same reason as above: default privileges also grant EXECUTE on new functions,
-- so revoking from PUBLIC alone would leave anon able to call them.
--
-- The normalizers back generated columns, and PostgreSQL checks EXECUTE on them
-- for whoever writes the row. They are pure text functions.
revoke all on function public.admissions_normalize_phone(text) from public, anon, authenticated, service_role;
revoke all on function public.admissions_normalize_email(text) from public, anon, authenticated, service_role;
revoke all on function public.admissions_normalize_name(text) from public, anon, authenticated, service_role;
grant execute on function public.admissions_normalize_phone(text) to authenticated, service_role;
grant execute on function public.admissions_normalize_email(text) to authenticated, service_role;
grant execute on function public.admissions_normalize_name(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Role helper
-- ---------------------------------------------------------------------------

-- Returns the caller's role, or NULL when the caller has no active profile, so
-- every policy denies inactive and profile-less users by default.
--
-- SECURITY DEFINER runs as the table owner, which skips RLS on
-- admissions_profiles. That is what stops the profiles policies from recursing.
create function public.admissions_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.admissions_profiles p
  where p.id = auth.uid()
    and p.is_active
$$;

revoke all on function public.admissions_current_role() from public, anon, authenticated, service_role;
grant execute on function public.admissions_current_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.admissions_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.admissions_set_updated_at() from public, anon, authenticated, service_role;

create trigger admissions_profiles_set_updated_at before update on public.admissions_profiles
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_academic_years_set_updated_at before update on public.admissions_academic_years
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_grades_set_updated_at before update on public.admissions_grades
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_modalities_set_updated_at before update on public.admissions_modalities
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_statuses_set_updated_at before update on public.admissions_statuses
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_sources_set_updated_at before update on public.admissions_sources
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_campaigns_set_updated_at before update on public.admissions_campaigns
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_guardians_set_updated_at before update on public.admissions_guardians
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_prospects_set_updated_at before update on public.admissions_prospects
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_tasks_set_updated_at before update on public.admissions_tasks
  for each row execute function public.admissions_set_updated_at();
create trigger admissions_visits_set_updated_at before update on public.admissions_visits
  for each row execute function public.admissions_set_updated_at();

-- Keeps closed_at in step with whether the status is terminal.
create function public.admissions_sync_prospect_closed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  status_is_terminal boolean;
begin
  select s.is_terminal into status_is_terminal
  from public.admissions_statuses s
  where s.id = new.status_id;

  if status_is_terminal then
    if tg_op = 'INSERT' or new.status_id is distinct from old.status_id then
      new.closed_at := now();
    end if;
  else
    new.closed_at := null;
  end if;

  return new;
end;
$$;

revoke all on function public.admissions_sync_prospect_closed_at() from public, anon, authenticated, service_role;

create trigger admissions_prospects_sync_closed_at
  before insert or update of status_id on public.admissions_prospects
  for each row execute function public.admissions_sync_prospect_closed_at();

-- Sole writer of the status history. SECURITY DEFINER because no application
-- role holds INSERT on the table. changed_by stays NULL without a matching
-- profile, as with service_role and public registration.
create function public.admissions_record_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admissions_status_history (prospect_id, previous_status_id, new_status_id, changed_by)
  select new.id,
         case when tg_op = 'UPDATE' then old.status_id end,
         new.status_id,
         (select p.id from public.admissions_profiles p where p.id = auth.uid());

  return null;
end;
$$;

revoke all on function public.admissions_record_status_change() from public, anon, authenticated, service_role;

create trigger admissions_prospects_record_initial_status
  after insert on public.admissions_prospects
  for each row execute function public.admissions_record_status_change();

create trigger admissions_prospects_record_status_change
  after update of status_id on public.admissions_prospects
  for each row
  when (old.status_id is distinct from new.status_id)
  execute function public.admissions_record_status_change();

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------

-- These grants are the ceiling; the policies below decide per role, because all
-- staff connect as the single authenticated database role. Tables with no anon
-- grant are unreachable anonymously regardless of policy.
--
-- Column lists keep identity, authorship, trigger-managed columns, and consent
-- evidence out of client updates.

grant select on public.admissions_profiles to authenticated;
grant insert (id, full_name, role, is_active) on public.admissions_profiles to authenticated;
grant update (full_name, role, is_active) on public.admissions_profiles to authenticated;

grant select, insert, update, delete on public.admissions_academic_years to authenticated;
grant select, insert, update, delete on public.admissions_grades to authenticated;
grant select, insert, update, delete on public.admissions_modalities to authenticated;
grant select, insert, update, delete on public.admissions_grade_modalities to authenticated;
grant select, insert, update, delete on public.admissions_statuses to authenticated;
grant select, insert, update, delete on public.admissions_sources to authenticated;
grant select, insert, update, delete on public.admissions_campaigns to authenticated;

grant select on public.admissions_guardians to authenticated;
grant insert (id, full_name, phone, email, preferred_contact_method) on public.admissions_guardians to authenticated;
grant update (full_name, phone, email, preferred_contact_method) on public.admissions_guardians to authenticated;

grant select on public.admissions_prospects to authenticated;
grant insert (
  id, guardian_id, student_name, academic_year_id, grade_id, modality_id, status_id, source_id,
  campaign_id, assigned_to, consent_to_contact, consent_at, privacy_notice_version, wants_visit,
  utm_source, utm_medium, utm_campaign, landing_page, internal_notes, last_contact_at
) on public.admissions_prospects to authenticated;
grant update (
  guardian_id, student_name, academic_year_id, grade_id, modality_id, status_id, source_id,
  campaign_id, assigned_to, wants_visit, internal_notes, last_contact_at
) on public.admissions_prospects to authenticated;

-- Activities are an append-only log.
grant select on public.admissions_activities to authenticated;
grant insert (id, prospect_id, performed_by, activity_type, description, outcome, occurred_at)
  on public.admissions_activities to authenticated;

grant select on public.admissions_tasks to authenticated;
grant insert (id, prospect_id, assigned_to, created_by, title, description, due_at, status, completed_at)
  on public.admissions_tasks to authenticated;
grant update (assigned_to, title, description, due_at, status, completed_at)
  on public.admissions_tasks to authenticated;

grant select on public.admissions_visits to authenticated;
grant insert (id, prospect_id, scheduled_at, status, notes, created_by) on public.admissions_visits to authenticated;
grant update (scheduled_at, status, notes) on public.admissions_visits to authenticated;

-- Read-only: only the trigger above writes history.
grant select on public.admissions_status_history to authenticated;

-- service_role bypasses RLS, so these grants are its whole boundary. It needs
-- reads and writes for server operations, but gets no DELETE on people or their
-- follow-up, and no writes on history.
grant select, insert, update on public.admissions_profiles to service_role;
grant select, insert, update, delete on public.admissions_academic_years to service_role;
grant select, insert, update, delete on public.admissions_grades to service_role;
grant select, insert, update, delete on public.admissions_modalities to service_role;
grant select, insert, update, delete on public.admissions_grade_modalities to service_role;
grant select, insert, update, delete on public.admissions_statuses to service_role;
grant select, insert, update, delete on public.admissions_sources to service_role;
grant select, insert, update, delete on public.admissions_campaigns to service_role;
grant select, insert, update on public.admissions_guardians to service_role;
grant select, insert, update on public.admissions_prospects to service_role;
grant select, insert on public.admissions_activities to service_role;
grant select, insert, update on public.admissions_tasks to service_role;
grant select, insert, update on public.admissions_visits to service_role;
grant select on public.admissions_status_history to service_role;

-- ---------------------------------------------------------------------------
-- Policies (spec section 8)
-- ---------------------------------------------------------------------------

-- The helper is wrapped in a scalar subquery so it runs once per statement, not
-- once per row. "is not null" means any active staff member.

-- Profiles: staff can read names for assignment; only admins change them. No
-- DELETE policy or grant exists, because staff are deactivated instead.
create policy admissions_profiles_select on public.admissions_profiles
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_profiles_insert on public.admissions_profiles
  for insert to authenticated
  with check ((select public.admissions_current_role()) = 'admin');
create policy admissions_profiles_update on public.admissions_profiles
  for update to authenticated
  using ((select public.admissions_current_role()) = 'admin')
  with check ((select public.admissions_current_role()) = 'admin');

-- Catalogs: admin and manager.
create policy admissions_academic_years_select on public.admissions_academic_years
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_academic_years_manage on public.admissions_academic_years
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

create policy admissions_grades_select on public.admissions_grades
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_grades_manage on public.admissions_grades
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

create policy admissions_modalities_select on public.admissions_modalities
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_modalities_manage on public.admissions_modalities
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

create policy admissions_grade_modalities_select on public.admissions_grade_modalities
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_grade_modalities_manage on public.admissions_grade_modalities
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

create policy admissions_statuses_select on public.admissions_statuses
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_statuses_manage on public.admissions_statuses
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

create policy admissions_sources_select on public.admissions_sources
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_sources_manage on public.admissions_sources
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

create policy admissions_campaigns_select on public.admissions_campaigns
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_campaigns_manage on public.admissions_campaigns
  for all to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager'));

-- Guardians and prospects: staff read; viewers do not write. No DELETE policy or
-- grant exists: spec 8 leaves prospect deletion to a policy not yet defined.
create policy admissions_guardians_select on public.admissions_guardians
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_guardians_insert on public.admissions_guardians
  for insert to authenticated
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'));
create policy admissions_guardians_update on public.admissions_guardians
  for update to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'));

create policy admissions_prospects_select on public.admissions_prospects
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_prospects_insert on public.admissions_prospects
  for insert to authenticated
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'));
create policy admissions_prospects_update on public.admissions_prospects
  for update to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'));

-- Follow-up: authorship must be the caller, and 'system' entries come only from
-- the registration function.
create policy admissions_activities_select on public.admissions_activities
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_activities_insert on public.admissions_activities
  for insert to authenticated
  with check (
    (select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent')
    and performed_by = (select auth.uid())
    and activity_type <> 'system'
  );

create policy admissions_tasks_select on public.admissions_tasks
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_tasks_insert on public.admissions_tasks
  for insert to authenticated
  with check (
    (select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent')
    and created_by = (select auth.uid())
  );
create policy admissions_tasks_update on public.admissions_tasks
  for update to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'));

create policy admissions_visits_select on public.admissions_visits
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);
create policy admissions_visits_insert on public.admissions_visits
  for insert to authenticated
  with check (
    (select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent')
    and created_by = (select auth.uid())
  );
create policy admissions_visits_update on public.admissions_visits
  for update to authenticated
  using ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'))
  with check ((select public.admissions_current_role()) in ('admin', 'admissions_manager', 'admissions_agent'));

create policy admissions_status_history_select on public.admissions_status_history
  for select to authenticated
  using ((select public.admissions_current_role()) is not null);

-- ---------------------------------------------------------------------------
-- Public registration
-- ---------------------------------------------------------------------------

-- Atomically resolves or creates a guardian and creates the prospect.
--
-- Callable only by service_role: spec 8 routes public submissions through a
-- Route Handler that validates, checks consent, and applies anti-spam first, and
-- granting anon would let anyone skip those controls by calling the RPC with the
-- public key. SECURITY INVOKER is enough because service_role already holds the
-- needed grants, so this runs with no more privilege than its caller.
--
-- Guardian rule: phone and email are imperfect identifiers, so they are matched
-- but not unique. Exact normalized matches rank both keys, then phone, then
-- email, then oldest. Public input never overwrites a guardian: anyone can type
-- someone else's phone. Differences go to a 'system' activity for staff instead.
--
-- Concurrency: an advisory transaction lock per normalized key serializes
-- registrations sharing a phone or email. Keys lock in sorted order, so sessions
-- with overlapping keys cannot deadlock. The unique opportunity index settles
-- the prospect itself. This function is VOLATILE, so under READ COMMITTED the
-- lookup after the lock sees what the previous holder committed.
--
-- is_new_prospect is for server logic only. The public response must stay the
-- same either way so it does not reveal whether a contact already exists.
create function public.admissions_register_public_interest(
  p_guardian_name text,
  p_phone text,
  p_email text,
  p_preferred_contact_method text,
  p_student_name text,
  p_academic_year_id uuid,
  p_grade_id uuid,
  p_modality_id uuid,
  p_consent_to_contact boolean,
  p_privacy_notice_version text,
  p_wants_visit boolean default false,
  p_source_code text default 'WEB_FORM',
  p_campaign_code text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_landing_page text default null
)
returns table (prospect_id uuid, guardian_id uuid, is_new_prospect boolean)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_phone text := public.admissions_normalize_phone(p_phone);
  v_email text := public.admissions_normalize_email(p_email);
  v_status_id uuid;
  v_source_id uuid;
  v_campaign_id uuid;
  v_guardian public.admissions_guardians%rowtype;
  v_matching_guardians integer;
  v_prospect_id uuid;
  v_is_new_prospect boolean := true;
  v_differences text[] := '{}';
  v_note text;
  v_existing_wants_visit boolean;
  v_existing_closed_at timestamptz;
begin
  -- Every public input is validated before matching, so the same malformed
  -- value fails the same way whether or not it matches an existing guardian.
  -- The rules mirror the admissions_guardians CHECK constraints.
  if public.admissions_normalize_name(p_guardian_name) is null then
    raise exception 'guardian name is required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is not null
     and (v_phone is null or v_phone !~ '^[0-9]{8,15}$') then
    raise exception 'phone is not valid' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email is not valid' using errcode = '22023';
  end if;
  if p_preferred_contact_method is not null
     and p_preferred_contact_method not in ('phone', 'whatsapp', 'email') then
    raise exception 'preferred contact method is not valid' using errcode = '22023';
  end if;
  if p_consent_to_contact is not true then
    raise exception 'consent to contact is required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_privacy_notice_version, '')), '') is null then
    raise exception 'privacy notice version is required' using errcode = '22023';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'a phone or email is required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.admissions_academic_years y
    where y.id = p_academic_year_id and y.is_active and y.is_open_for_intake
  ) then
    raise exception 'academic year is not open for intake' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.admissions_grades g
    where g.id = p_grade_id and g.is_active
  ) then
    raise exception 'grade is not available' using errcode = '22023';
  end if;
  if p_modality_id is not null and not exists (
    select 1
    from public.admissions_grade_modalities gm
    join public.admissions_modalities m on m.id = gm.modality_id
    where gm.grade_id = p_grade_id
      and gm.modality_id = p_modality_id
      and gm.is_active
      and m.is_active
  ) then
    raise exception 'modality is not offered for this grade' using errcode = '22023';
  end if;

  select s.id into v_status_id from public.admissions_statuses s where s.code = 'NEW';
  if v_status_id is null then
    raise exception 'initial status NEW is missing' using errcode = 'P0002';
  end if;

  select s.id into v_source_id from public.admissions_sources s where s.code = p_source_code and s.is_active;
  if v_source_id is null then
    raise exception 'source is not available' using errcode = '22023';
  end if;

  -- An unknown campaign code comes from a URL and must not lose the family's
  -- request. The raw values remain in the UTM columns.
  select c.id into v_campaign_id from public.admissions_campaigns c where c.code = p_campaign_code and c.is_active;

  perform pg_advisory_xact_lock(hashtextextended(k.key, 0))
  from (
    select 'admissions:phone:' || v_phone as key where v_phone is not null
    union all
    select 'admissions:email:' || v_email where v_email is not null
    order by 1
  ) k;

  select count(*) into v_matching_guardians
  from public.admissions_guardians g
  where g.phone_normalized = v_phone or g.email_normalized = v_email;

  select g.* into v_guardian
  from public.admissions_guardians g
  where g.phone_normalized = v_phone or g.email_normalized = v_email
  order by
    (g.phone_normalized is not distinct from v_phone and g.email_normalized is not distinct from v_email) desc,
    (g.phone_normalized is not distinct from v_phone) desc,
    g.created_at,
    g.id
  limit 1;

  if v_guardian.id is null then
    insert into public.admissions_guardians (full_name, phone, email, preferred_contact_method)
    values (
      btrim(p_guardian_name),
      case when v_phone is not null then p_phone end,
      case when v_email is not null then p_email end,
      p_preferred_contact_method
    )
    returning * into v_guardian;
  else
    if public.admissions_normalize_name(p_guardian_name) is distinct from public.admissions_normalize_name(v_guardian.full_name) then
      v_differences := v_differences || format('nombre "%s"', btrim(p_guardian_name));
    end if;
    if v_phone is not null and v_phone is distinct from v_guardian.phone_normalized then
      v_differences := v_differences || format('teléfono "%s"', btrim(p_phone));
    end if;
    if v_email is not null and v_email is distinct from v_guardian.email_normalized then
      v_differences := v_differences || format('correo "%s"', btrim(p_email));
    end if;
    if v_matching_guardians > 1 then
      v_differences := v_differences || 'el teléfono o el correo coincide con otro encargado'::text;
    end if;
  end if;

  insert into public.admissions_prospects (
    guardian_id, student_name, academic_year_id, grade_id, modality_id, status_id, source_id,
    campaign_id, consent_to_contact, consent_at, privacy_notice_version, wants_visit,
    utm_source, utm_medium, utm_campaign, landing_page
  )
  values (
    v_guardian.id, nullif(btrim(coalesce(p_student_name, '')), ''), p_academic_year_id, p_grade_id,
    p_modality_id, v_status_id, v_source_id, v_campaign_id, true, now(), p_privacy_notice_version,
    coalesce(p_wants_visit, false), p_utm_source, p_utm_medium, p_utm_campaign, p_landing_page
  )
  on conflict (guardian_id, academic_year_id, grade_id, (coalesce(student_name_normalized, '')))
  do nothing
  returning id into v_prospect_id;

  if v_prospect_id is null then
    v_is_new_prospect := false;

    -- The row lock serializes repeats that reach the same prospect through
    -- different keys, which the advisory locks above do not cover.
    select p.id, p.wants_visit, p.closed_at
    into v_prospect_id, v_existing_wants_visit, v_existing_closed_at
    from public.admissions_prospects p
    where p.guardian_id = v_guardian.id
      and p.academic_year_id = p_academic_year_id
      and p.grade_id = p_grade_id
      and coalesce(p.student_name_normalized, '') = coalesce(public.admissions_normalize_name(p_student_name), '')
    for update;

    -- A repeat changes no guardian data. A new visit request is stored, since
    -- it only adds information, and staff are told about it and about a closed
    -- prospect showing interest again.
    if p_wants_visit and not v_existing_wants_visit then
      update public.admissions_prospects p set wants_visit = true where p.id = v_prospect_id;
      v_differences := v_differences || 'solicita una visita'::text;
    end if;
    if v_existing_closed_at is not null then
      v_differences := v_differences || 'el prospecto ya estaba cerrado'::text;
    end if;
  end if;

  -- Activities are append-only, so a retried or double submission must not
  -- repeat a note: a system note identical to one already on the prospect is
  -- skipped. Any new difference changes the text and is still recorded.
  if cardinality(v_differences) > 0 then
    v_note := 'Registro público repetido o con diferencias, revisar: '
      || array_to_string(v_differences, '; ') || '.';
    if not exists (
      select 1 from public.admissions_activities a
      where a.prospect_id = v_prospect_id
        and a.activity_type = 'system'
        and a.description = v_note
    ) then
      insert into public.admissions_activities (prospect_id, activity_type, description)
      values (v_prospect_id, 'system', v_note);
    end if;
  end if;

  prospect_id := v_prospect_id;
  guardian_id := v_guardian.id;
  is_new_prospect := v_is_new_prospect;
  return next;
end;
$$;

revoke all on function public.admissions_register_public_interest(
  text, text, text, text, text, uuid, uuid, uuid, boolean, text, boolean, text, text, text, text, text, text
) from public, anon, authenticated, service_role;

grant execute on function public.admissions_register_public_interest(
  text, text, text, text, text, uuid, uuid, uuid, boolean, text, boolean, text, text, text, text, text, text
) to service_role;
