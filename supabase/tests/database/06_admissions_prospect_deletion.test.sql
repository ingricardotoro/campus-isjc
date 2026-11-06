-- Prospect deletion RPC and the assignee guard, exercised with real role switching
-- and JWT claims. The last section forces interleavings through dblink: those
-- sessions commit outside the test transaction, so their rows use dedicated phone
-- numbers and are removed before and after the assertions.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

select plan(88);

-- Fixtures, created as the table owner.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-000000000001', 'admin@test.local'),
  ('00000000-0000-4000-a000-000000000002', 'manager@test.local'),
  ('00000000-0000-4000-a000-000000000003', 'agent@test.local'),
  ('00000000-0000-4000-a000-000000000004', 'viewer@test.local'),
  ('00000000-0000-4000-a000-000000000005', 'inactive@test.local'),
  ('00000000-0000-4000-a000-000000000006', 'noprofile@test.local'),
  ('00000000-0000-4000-a000-000000000007', 'leaving@test.local');

insert into public.admissions_profiles (id, full_name, role, is_active) values
  ('00000000-0000-4000-a000-000000000001', 'Admin',    'admin',              true),
  ('00000000-0000-4000-a000-000000000002', 'Manager',  'admissions_manager', true),
  ('00000000-0000-4000-a000-000000000003', 'Agent',    'admissions_agent',   true),
  ('00000000-0000-4000-a000-000000000004', 'Viewer',   'admissions_viewer',  true),
  ('00000000-0000-4000-a000-000000000005', 'Inactive', 'admin',              false),
  ('00000000-0000-4000-a000-000000000007', 'Leaving',  'admissions_agent',   true);

insert into public.admissions_guardians (id, full_name, phone) values
  ('00000000-0000-4000-b000-000000000001', 'Ultimo prospecto', '99991001'),
  ('00000000-0000-4000-b000-000000000002', 'Con hermanos',     '99991002'),
  ('00000000-0000-4000-b000-000000000003', 'Protegido',        '99991003'),
  ('00000000-0000-4000-b000-000000000004', 'Asignaciones',     '99991004');

insert into public.admissions_prospects (id, guardian_id, student_name, academic_year_id, grade_id, status_id, source_id)
select v.id::uuid, v.guardian_id::uuid, v.student_name,
       (select id from public.admissions_academic_years where year = 2027),
       (select id from public.admissions_grades where code = 'GRADE_01'),
       (select id from public.admissions_statuses where code = 'NEW'),
       (select id from public.admissions_sources where code = 'WEB_FORM')
from (values
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'Solo'),
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-b000-000000000002', 'Hermana'),
  ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-b000-000000000002', 'Hermano'),
  ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-b000-000000000003', 'Protegido'),
  ('00000000-0000-4000-c000-000000000005', '00000000-0000-4000-b000-000000000004', 'Asignado')
) as v(id, guardian_id, student_name);

insert into public.admissions_activities (prospect_id, performed_by, activity_type, description) values
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000003', 'call', 'Llamada'),
  ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-a000-000000000003', 'call', 'Llamada');
insert into public.admissions_tasks (prospect_id, created_by, title)
values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000003', 'Llamar');
insert into public.admissions_visits (prospect_id, created_by, scheduled_at)
values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000003', now() + interval '1 day');

create temporary view fixture as select
  (select id from public.admissions_academic_years where year = 2027) as year_id,
  (select id from public.admissions_grades where code = 'GRADE_02') as grade_id,
  (select id from public.admissions_statuses where code = 'NEW') as new_status_id,
  (select id from public.admissions_statuses where code = 'CONTACTED') as contacted_status_id,
  (select id from public.admissions_sources where code = 'WEB_FORM') as source_id;
grant select on fixture to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Admin deletes the last prospect of a guardian
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000001') $$,
  'admin deletes a prospect');
reset role;

select is((select count(*)::int from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  0, 'the prospect is gone');
select is((select count(*)::int from public.admissions_status_history where prospect_id = '00000000-0000-4000-c000-000000000001'),
  0, 'its status history is gone');
select is((select count(*)::int from public.admissions_activities where prospect_id = '00000000-0000-4000-c000-000000000001'),
  0, 'its activities are gone');
select is((select count(*)::int from public.admissions_tasks where prospect_id = '00000000-0000-4000-c000-000000000001'),
  0, 'its tasks are gone');
select is((select count(*)::int from public.admissions_visits where prospect_id = '00000000-0000-4000-c000-000000000001'),
  0, 'its visits are gone');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  0, 'a guardian left without prospects is removed');
select is((select count(*)::int from public.admissions_status_history where prospect_id = '00000000-0000-4000-c000-000000000004'),
  1, 'history of other prospects stays');

-- ---------------------------------------------------------------------------
-- A sibling keeps the guardian until it goes too
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000002') $$,
  'admin deletes a prospect with a sibling');
reset role;

select is((select count(*)::int from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000002'),
  0, 'the deleted sibling is gone');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000002'),
  1, 'the guardian stays while a sibling uses it');
select is((select count(*)::int from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000003'),
  1, 'the remaining sibling stays');
select is((select count(*)::int from public.admissions_status_history where prospect_id = '00000000-0000-4000-c000-000000000003'),
  1, 'the remaining sibling keeps its history');

set local role authenticated;
select lives_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000003') $$,
  'admin deletes the remaining sibling');
reset role;
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000002'),
  0, 'the guardian goes with its last prospect');

-- ---------------------------------------------------------------------------
-- Everyone else is refused and nothing is deleted
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', 'not allowed', 'manager cannot delete a prospect');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', 'not allowed', 'agent cannot delete a prospect');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', 'not allowed', 'viewer cannot delete a prospect');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', 'not allowed', 'an inactive admin cannot delete a prospect');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000006","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', 'not allowed', 'a user without a profile cannot delete a prospect');
reset role;

select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', null, 'anon cannot execute the deletion');
reset role;

set local role service_role;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-000000000004') $$,
  '42501', null, 'service_role cannot execute the deletion');
reset role;

select is((select count(*)::int from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000004'),
  1, 'refused calls keep the prospect');
select is((select count(*)::int from public.admissions_status_history where prospect_id = '00000000-0000-4000-c000-000000000004'),
  1, 'refused calls keep the history');
select is((select count(*)::int from public.admissions_activities where prospect_id = '00000000-0000-4000-c000-000000000004'),
  1, 'refused calls keep the activities');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000003'),
  1, 'refused calls keep the guardian');

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
-- to_regprocedure keeps these as ordinary failures, not an aborted file, while
-- the function does not exist.
select ok(coalesce(has_function_privilege('authenticated', to_regprocedure('public.admissions_delete_prospect(uuid)')::oid, 'EXECUTE'), false),
  'authenticated can execute the deletion');
select ok(not coalesce(has_function_privilege('anon', to_regprocedure('public.admissions_delete_prospect(uuid)')::oid, 'EXECUTE'), true),
  'anon has no EXECUTE on the deletion');
select ok(not coalesce(has_function_privilege('service_role', to_regprocedure('public.admissions_delete_prospect(uuid)')::oid, 'EXECUTE'), true),
  'service_role has no EXECUTE on the deletion');
select is(
  (select count(*)::int from pg_proc p
   cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
   where p.oid = to_regprocedure('public.admissions_delete_prospect(uuid)')::oid
     and a.privilege_type = 'EXECUTE'
     and (a.grantee = 0 or a.grantee = 'authenticated'::regrole)),
  1, 'EXECUTE is granted to authenticated and not to PUBLIC');
select ok(
  (select p.prosecdef from pg_proc p where p.oid = to_regprocedure('public.admissions_delete_prospect(uuid)')::oid),
  'the deletion is SECURITY DEFINER');

-- The RPC does not open the tables to its callers.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ delete from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000004' $$,
  '42501', null, 'admin still cannot delete prospects directly');
reset role;
set local role service_role;
select throws_ok(
  $$ delete from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000003' $$,
  '42501', null, 'service_role still cannot delete guardians directly');
reset role;

-- ---------------------------------------------------------------------------
-- Unknown ids
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-0000000000ff') $$,
  'P0002', 'prospect not found', 'an unknown id is reported');
select throws_ok(
  $$ select public.admissions_delete_prospect(null) $$,
  'P0002', 'prospect not found', 'a null id is reported as unknown');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.admissions_delete_prospect('00000000-0000-4000-c000-0000000000ff') $$,
  '42501', 'not allowed', 'a refused caller cannot tell whether an id exists');
reset role;

-- ---------------------------------------------------------------------------
-- Assignee guard
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000003'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'an agent can be assigned');
select is((select assigned_to from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000005'),
  '00000000-0000-4000-a000-000000000003'::uuid, 'the assignment is stored');
select lives_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000002'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'a manager can be assigned');
select lives_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000001'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'an admin can be assigned');

select throws_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000004'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  '22023', 'assignee must be active staff who can edit', 'a viewer cannot be assigned');
select throws_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000005'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  '22023', 'assignee must be active staff who can edit', 'an inactive profile cannot be assigned');
select throws_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000006'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  '22023', 'assignee must be active staff who can edit', 'a user without a profile cannot be assigned');
select is((select assigned_to from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000005'),
  '00000000-0000-4000-a000-000000000001'::uuid, 'a refused assignment leaves the previous assignee');

select lives_ok(
  $$ update public.admissions_prospects set assigned_to = null
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'an assignee can be cleared');
select is((select assigned_to from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000005'),
  null, 'clearing leaves no assignee');

select throws_ok(
  $$ insert into public.admissions_prospects (guardian_id, student_name, academic_year_id, grade_id, status_id, source_id, assigned_to)
     select '00000000-0000-4000-b000-000000000004', 'Insercion', year_id, grade_id, new_status_id, source_id,
            '00000000-0000-4000-a000-000000000004' from fixture $$,
  '22023', 'assignee must be active staff who can edit', 'an insert cannot assign a viewer');
select lives_ok(
  $$ insert into public.admissions_prospects (guardian_id, student_name, academic_year_id, grade_id, status_id, source_id, assigned_to)
     select '00000000-0000-4000-b000-000000000004', 'Insercion', year_id, grade_id, new_status_id, source_id,
            '00000000-0000-4000-a000-000000000003' from fixture $$,
  'an insert can assign an agent');
reset role;

set local role service_role;
select throws_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000004'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  '22023', 'assignee must be active staff who can edit', 'the guard also binds service_role');
reset role;

-- An assignee deactivated later must not freeze the prospect.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000007'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'an active agent is assigned before leaving');
reset role;

update public.admissions_profiles set is_active = false where id = '00000000-0000-4000-a000-000000000007';

set local role authenticated;
select lives_ok(
  $$ update public.admissions_prospects set internal_notes = 'Sigue en curso'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'other columns stay editable after the assignee is deactivated');
select is((select internal_notes from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000005'),
  'Sigue en curso', 'the unrelated update is stored');
select lives_ok(
  $$ update public.admissions_prospects set status_id = (select contacted_status_id from fixture)
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'the status stays editable after the assignee is deactivated');
select lives_ok(
  $$ update public.admissions_prospects
     set assigned_to = '00000000-0000-4000-a000-000000000007', internal_notes = 'Formulario completo'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'resending the same assignee is not a change');
select is((select assigned_to from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000005'),
  '00000000-0000-4000-a000-000000000007'::uuid, 'the deactivated assignee stays until someone changes it');
select lives_ok(
  $$ update public.admissions_prospects set assigned_to = null
     where id = '00000000-0000-4000-c000-000000000005' $$,
  'a deactivated assignee can be cleared');
select throws_ok(
  $$ update public.admissions_prospects set assigned_to = '00000000-0000-4000-a000-000000000007'
     where id = '00000000-0000-4000-c000-000000000005' $$,
  '22023', 'assignee must be active staff who can edit', 'a deactivated assignee cannot be assigned again');
reset role;

-- Public registration never assigns, so the guard must not get in its way.
set local role service_role;
select lives_ok(
  $$ select * from public.admissions_register_public_interest(
       'Publico', '99991005', null, 'whatsapp', 'Registro',
       (select year_id from fixture), (select grade_id from fixture),
       null, true, 'v1') $$,
  'public registration still works');
reset role;
select is(
  (select p.assigned_to from public.admissions_prospects p
   join public.admissions_guardians g on g.id = p.guardian_id
   where g.phone_normalized = '50499991005'),
  null, 'public registration leaves the prospect unassigned');

select ok(not coalesce(has_function_privilege('authenticated', to_regprocedure('public.admissions_guard_prospect_assignee()')::oid, 'EXECUTE'), true),
  'authenticated has no EXECUTE on the guard');
select ok(not coalesce(has_function_privilege('anon', to_regprocedure('public.admissions_guard_prospect_assignee()')::oid, 'EXECUTE'), true),
  'anon has no EXECUTE on the guard');
select ok(not coalesce(has_function_privilege('service_role', to_regprocedure('public.admissions_guard_prospect_assignee()')::oid, 'EXECUTE'), true),
  'service_role has no EXECUTE on the guard');

-- ---------------------------------------------------------------------------
-- Forced interleavings
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '', true);

-- See 04_admissions_concurrent_registration.test.sql for why the connection uses
-- the container address and a password.
create function pg_temp.conn() returns text language sql as
$$ select format('host=%s port=5432 dbname=postgres user=postgres password=postgres', host(inet_server_addr())) $$;

create function pg_temp.cleanup() returns void language plpgsql as $$
begin
  perform dblink_exec(pg_temp.conn(), $sql$
    delete from public.admissions_activities a
      using public.admissions_prospects p, public.admissions_guardians g
      where a.prospect_id = p.id and p.guardian_id = g.id
        and g.phone_normalized between '50488880011' and '50488880029';
    delete from public.admissions_status_history h
      using public.admissions_prospects p, public.admissions_guardians g
      where h.prospect_id = p.id and p.guardian_id = g.id
        and g.phone_normalized between '50488880011' and '50488880029';
    delete from public.admissions_prospects p
      using public.admissions_guardians g
      where p.guardian_id = g.id
        and g.phone_normalized between '50488880011' and '50488880029';
    delete from public.admissions_guardians
      where phone_normalized between '50488880011' and '50488880029';
    delete from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000099';
    delete from auth.users where id = '00000000-0000-4000-a000-000000000099';
  $sql$);
end $$;

create function pg_temp.seed_guardian(id uuid, phone text, email text default null) returns void language plpgsql as $$
begin
  perform dblink_exec('session_setup', format(
    'insert into public.admissions_guardians (id, full_name, phone, email) values (%L, %L, %L, %L)',
    id, 'Carrera', phone, email));
end $$;

create function pg_temp.seed_prospect(id uuid, guardian_id uuid, student text) returns void language plpgsql as $$
begin
  perform dblink_exec('session_setup', format(
    $f$ insert into public.admissions_prospects (id, guardian_id, student_name, academic_year_id, grade_id, status_id, source_id)
        select %L, %L, %L,
               (select id from public.admissions_academic_years where year = 2027),
               (select id from public.admissions_grades where code = 'GRADE_01'),
               (select id from public.admissions_statuses where code = 'NEW'),
               (select id from public.admissions_sources where code = 'WEB_FORM') $f$,
    id, guardian_id, student));
end $$;

create function pg_temp.delete_sql(id uuid) returns text language sql as
$$ select format('select public.admissions_delete_prospect(%L)', id) $$;

create function pg_temp.register_sql(phone text, email text, student text) returns text language sql as $$
  select format(
    $f$ select prospect_id, guardian_id, is_new_prospect
        from public.admissions_register_public_interest(
          'Carrera', %L, %L, 'whatsapp', %L,
          (select id from public.admissions_academic_years where year = 2027),
          (select id from public.admissions_grades where code = 'GRADE_01'),
          null, true, 'v1') $f$,
    phone, email, student)
$$;

-- Polls instead of sleeping a fixed time: the session has to reach the lock.
create function pg_temp.waits_on_lock(session text) returns boolean language plpgsql as $$
declare
  backend int := (select b.pid from backends b where b.name = session);
begin
  for attempt in 1..100 loop
    perform pg_stat_clear_snapshot();
    if exists (select 1 from pg_stat_activity a where a.pid = backend and a.wait_event_type = 'Lock') then
      return true;
    end if;
    perform pg_sleep(0.05);
  end loop;
  return false;
end $$;

-- A connection accepts no new query until its pending results are consumed. This
-- also raises a remote error, with its SQLSTATE, the first time it is called.
create function pg_temp.drain(session text) returns void language plpgsql as $$
begin
  perform * from dblink_get_result(session) as t(result text);
end $$;

create temporary table registrations (
  label text, prospect_id uuid, guardian_id uuid, is_new_prospect boolean
) on commit drop;

-- dblink_get_result raises on a remote error, so a raw FK violation fails this.
create function pg_temp.collect_registration(label text) returns void language plpgsql as $$
begin
  insert into registrations
    select label, t.* from dblink_get_result('session_public')
      as t(prospect_id uuid, guardian_id uuid, is_new_prospect boolean);
end $$;

select pg_temp.cleanup();

select dblink_connect('session_setup', pg_temp.conn());
select dblink_connect('session_admin_1', pg_temp.conn());
select dblink_connect('session_admin_2', pg_temp.conn());
select dblink_connect('session_public', pg_temp.conn());

select dblink_exec('session_setup', $sql$
  insert into auth.users (id, email) values ('00000000-0000-4000-a000-000000000099', 'race@test.local');
  insert into public.admissions_profiles (id, full_name, role) values ('00000000-0000-4000-a000-000000000099', 'Carrera', 'admin');
$sql$);

select t.*
from unnest(array['session_admin_1', 'session_admin_2']) s
cross join lateral dblink(s, $sql$ select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000099","role":"authenticated"}', false) $sql$) as t(result text);
select dblink_exec(s, 'set role authenticated') from unnest(array['session_admin_1', 'session_admin_2']) s;
select dblink_exec('session_public', 'set role service_role');

create temporary table backends on commit drop as
  select s as name, t.pid
  from unnest(array['session_setup', 'session_admin_1', 'session_admin_2', 'session_public']) s
  cross join lateral dblink(s, 'select pg_backend_pid()') as t(pid int);

-- The deletion goes first: a registration matching the phone must wait, then
-- create a new guardian instead of attaching to the removed one.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000011', '88880011');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000011', '00000000-0000-4000-b000-000000000011', 'Primero');
select dblink_exec('session_admin_1', 'begin');
select * from dblink('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000011')) as t(result text);
select dblink_send_query('session_public', pg_temp.register_sql('88880011', null, 'Nueva'));
select ok(pg_temp.waits_on_lock('session_public'), 'a registration on the same phone waits for the deletion');
select dblink_exec('session_admin_1', 'commit');
select lives_ok($$ select pg_temp.collect_registration('phone') $$, 'the waiting registration finishes without an FK error');
select pg_temp.drain('session_public');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000011'),
  0, 'the deletion removed the guardian');
select ok(
  (select r.is_new_prospect and r.guardian_id <> '00000000-0000-4000-b000-000000000011' from registrations r where r.label = 'phone'),
  'the registration created a new guardian');

-- Same interleaving, reaching the guardian only through its email.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000012', '88880012', 'carrera@example.com');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000012', '00000000-0000-4000-b000-000000000012', 'Primero');
select dblink_exec('session_admin_1', 'begin');
select * from dblink('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000012')) as t(result text);
select dblink_send_query('session_public', pg_temp.register_sql('88880013', 'CARRERA@example.com', 'Nueva'));
select ok(pg_temp.waits_on_lock('session_public'), 'a registration on the same email waits for the deletion');
select dblink_exec('session_admin_1', 'commit');
select lives_ok($$ select pg_temp.collect_registration('email') $$, 'the email registration finishes without an FK error');
select pg_temp.drain('session_public');
select ok(
  (select r.guardian_id <> '00000000-0000-4000-b000-000000000012' from registrations r where r.label = 'email'),
  'the email registration created a new guardian');

-- The registration goes first: the deletion must wait, then see the new prospect
-- and keep the guardian.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000014', '88880014');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000014', '00000000-0000-4000-b000-000000000014', 'Primero');
select dblink_exec('session_public', 'begin');
select * from dblink('session_public', pg_temp.register_sql('88880014', null, 'Nueva'))
  as t(prospect_id uuid, guardian_id uuid, is_new_prospect boolean);
select dblink_send_query('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000014'));
select ok(pg_temp.waits_on_lock('session_admin_1'), 'a deletion waits for a registration on the same guardian');
select dblink_exec('session_public', 'commit');
select lives_ok($$ select pg_temp.drain('session_admin_1') $$, 'the waiting deletion finishes without an FK error');
select pg_temp.drain('session_admin_1');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000014'),
  1, 'the guardian the registration attached to stays');
select is((select count(*)::int from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000014'),
  0, 'the deleted prospect is gone');
select is((select count(*)::int from public.admissions_prospects where guardian_id = '00000000-0000-4000-b000-000000000014'),
  1, 'the registered prospect keeps its guardian');

-- Two admins delete the last two siblings: only the second removes the guardian.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000015', '88880015');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000015', '00000000-0000-4000-b000-000000000015', 'Hermana');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000016', '00000000-0000-4000-b000-000000000015', 'Hermano');
select dblink_exec('session_admin_1', 'begin');
select * from dblink('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000015')) as t(result text);
select dblink_send_query('session_admin_2', pg_temp.delete_sql('00000000-0000-4000-c000-000000000016'));
select ok(pg_temp.waits_on_lock('session_admin_2'), 'a deletion waits for another one on the same guardian');
select dblink_exec('session_admin_1', 'commit');
select lives_ok($$ select pg_temp.drain('session_admin_2') $$, 'the second deletion finishes without an error');
select pg_temp.drain('session_admin_2');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000015'),
  0, 'the guardian goes with the last sibling');
select is((select count(*)::int from public.admissions_prospects where guardian_id = '00000000-0000-4000-b000-000000000015'),
  0, 'both siblings are gone');

-- Two admins delete the same prospect: the second finds nothing.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000017', '88880017');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000017', '00000000-0000-4000-b000-000000000017', 'Primero');
select dblink_exec('session_admin_1', 'begin');
select * from dblink('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000017')) as t(result text);
select dblink_send_query('session_admin_2', pg_temp.delete_sql('00000000-0000-4000-c000-000000000017'));
select ok(pg_temp.waits_on_lock('session_admin_2'), 'a repeated deletion waits for the first one');
select dblink_exec('session_admin_1', 'commit');
select throws_ok($$ select pg_temp.drain('session_admin_2') $$, 'P0002', null, 'the repeated deletion reports the prospect as gone');
select pg_temp.drain('session_admin_2');

-- Staff change the guardian's phone mid-deletion: the deletion locked the old
-- key, so removing the guardian could race a registration on the new one.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000018', '88880018');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000018', '00000000-0000-4000-b000-000000000018', 'Primero');
select dblink_exec('session_setup', 'begin');
select dblink_exec('session_setup', $sql$ update public.admissions_guardians set phone = '88880019' where id = '00000000-0000-4000-b000-000000000018' $sql$);
select dblink_send_query('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000018'));
select ok(pg_temp.waits_on_lock('session_admin_1'), 'a deletion waits for an edit of the guardian');
select dblink_exec('session_setup', 'commit');
select throws_ok($$ select pg_temp.drain('session_admin_1') $$, '40001', null, 'a contact change mid-deletion asks for a retry');
select pg_temp.drain('session_admin_1');
select is((select count(*)::int from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000018'),
  1, 'the retry request keeps the prospect');
select is((select count(*)::int from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000018'),
  1, 'the retry request keeps the guardian');

-- Staff move the prospect to another guardian mid-deletion: the locks taken cover
-- the wrong guardian.
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000020', '88880020');
select pg_temp.seed_guardian('00000000-0000-4000-b000-000000000021', '88880021');
select pg_temp.seed_prospect('00000000-0000-4000-c000-000000000020', '00000000-0000-4000-b000-000000000020', 'Primero');
select dblink_exec('session_setup', 'begin');
select dblink_exec('session_setup', $sql$ update public.admissions_prospects set guardian_id = '00000000-0000-4000-b000-000000000021' where id = '00000000-0000-4000-c000-000000000020' $sql$);
select dblink_send_query('session_admin_1', pg_temp.delete_sql('00000000-0000-4000-c000-000000000020'));
select ok(pg_temp.waits_on_lock('session_admin_1'), 'a deletion waits for a move of the prospect');
select dblink_exec('session_setup', 'commit');
select throws_ok($$ select pg_temp.drain('session_admin_1') $$, '40001', null, 'a guardian change mid-deletion asks for a retry');
select pg_temp.drain('session_admin_1');
select is((select guardian_id from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000020'),
  '00000000-0000-4000-b000-000000000021'::uuid, 'the retry request keeps the moved prospect');

select dblink_disconnect('session_setup');
select dblink_disconnect('session_admin_1');
select dblink_disconnect('session_admin_2');
select dblink_disconnect('session_public');

select pg_temp.cleanup();

select is(
  (select count(*)::int from public.admissions_guardians
   where phone_normalized between '50488880011' and '50488880029'),
  0, 'committed test rows are removed');

select * from finish();
rollback;
