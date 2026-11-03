-- Permission matrix from spec section 8, exercised with real role switching and
-- JWT claims. An UPDATE or DELETE blocked by RLS affects zero rows instead of
-- raising, so those cases assert on the stored value afterwards.
begin;
create extension if not exists pgtap with schema extensions;

select plan(62);

-- Fixtures, created as the table owner.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-000000000001', 'admin@test.local'),
  ('00000000-0000-4000-a000-000000000002', 'manager@test.local'),
  ('00000000-0000-4000-a000-000000000003', 'agent@test.local'),
  ('00000000-0000-4000-a000-000000000004', 'viewer@test.local'),
  ('00000000-0000-4000-a000-000000000005', 'inactive@test.local'),
  ('00000000-0000-4000-a000-000000000006', 'noprofile@test.local');

insert into public.admissions_profiles (id, full_name, role, is_active) values
  ('00000000-0000-4000-a000-000000000001', 'Admin',    'admin',              true),
  ('00000000-0000-4000-a000-000000000002', 'Manager',  'admissions_manager', true),
  ('00000000-0000-4000-a000-000000000003', 'Agent',    'admissions_agent',   true),
  ('00000000-0000-4000-a000-000000000004', 'Viewer',   'admissions_viewer',  true),
  ('00000000-0000-4000-a000-000000000005', 'Inactive', 'admin',              false);

insert into public.admissions_guardians (id, full_name, phone)
values ('00000000-0000-4000-b000-000000000001', 'Encargado', '99990001');

insert into public.admissions_prospects (id, guardian_id, student_name, academic_year_id, grade_id, status_id, source_id)
select '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'Base',
       (select id from public.admissions_academic_years where year = 2027),
       (select id from public.admissions_grades where code = 'GRADE_01'),
       (select id from public.admissions_statuses where code = 'NEW'),
       (select id from public.admissions_sources where code = 'WEB_FORM');

-- Catalog ids resolved once as the owner, so role sections stay readable and do
-- not depend on the catalog policies they exercise.
create temporary view fixture as select
  (select id from public.admissions_academic_years where year = 2027) as year_id,
  (select id from public.admissions_grades where code = 'GRADE_02') as grade_id,
  (select id from public.admissions_statuses where code = 'NEW') as new_status_id,
  (select id from public.admissions_statuses where code = 'CONTACTED') as contacted_status_id,
  (select id from public.admissions_statuses where code = 'ENROLLED') as enrolled_status_id,
  (select id from public.admissions_sources where code = 'WEB_FORM') as source_id;
grant select on fixture to authenticated;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.admissions_prospects), 1, 'admin reads prospects');
update public.admissions_profiles set role = 'admissions_agent' where id = '00000000-0000-4000-a000-000000000004';
select is(
  (select role from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000004'),
  'admissions_agent', 'admin changes another user''s role');
update public.admissions_profiles set role = 'admissions_viewer' where id = '00000000-0000-4000-a000-000000000004';
select lives_ok(
  $$ insert into public.admissions_sources (code, name) values ('ADMIN_SRC', 'Fuente admin') $$,
  'admin manages catalogs');
select lives_ok(
  $$ insert into public.admissions_profiles (id, full_name, role)
     values ('00000000-0000-4000-a000-000000000006', 'Nuevo', 'admissions_viewer') $$,
  'admin creates profiles');
select throws_ok(
  $$ delete from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000006' $$,
  '42501', null, 'admin deactivates profiles instead of deleting them');
reset role;
delete from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000006';

-- ---------------------------------------------------------------------------
-- Manager
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.admissions_prospects), 1, 'manager reads prospects');
select lives_ok(
  $$ insert into public.admissions_sources (code, name) values ('MANAGER_SRC', 'Fuente gerente') $$,
  'manager creates catalog rows');
update public.admissions_sources set name = 'Fuente gerente 2' where code = 'MANAGER_SRC';
select is((select name from public.admissions_sources where code = 'MANAGER_SRC'),
  'Fuente gerente 2', 'manager updates catalog rows');
delete from public.admissions_sources where code = 'MANAGER_SRC';
select is((select count(*)::int from public.admissions_sources where code = 'MANAGER_SRC'),
  0, 'manager deletes unused catalog rows');

-- Manager cannot promote: self, another user, or by creating a new admin.
update public.admissions_profiles set role = 'admin' where id = '00000000-0000-4000-a000-000000000002';
select is((select role from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000002'),
  'admissions_manager', 'manager cannot promote self to admin');
update public.admissions_profiles set role = 'admin' where id = '00000000-0000-4000-a000-000000000003';
select is((select role from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000003'),
  'admissions_agent', 'manager cannot promote another user to admin');
select throws_ok(
  $$ insert into public.admissions_profiles (id, full_name, role)
     values ('00000000-0000-4000-a000-000000000006', 'Falso', 'admin') $$,
  '42501', null, 'manager cannot create an admin profile');
update public.admissions_profiles set is_active = false where id = '00000000-0000-4000-a000-000000000001';
select is((select is_active from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000001'),
  true, 'manager cannot deactivate an admin');
reset role;

-- ---------------------------------------------------------------------------
-- Agent
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.admissions_prospects), 1, 'agent reads prospects');
select lives_ok(
  $$ insert into public.admissions_guardians (id, full_name, phone)
     values ('00000000-0000-4000-b000-000000000002', 'Otro encargado', '99990002') $$,
  'agent creates guardians');
select lives_ok(
  $$ insert into public.admissions_prospects (id, guardian_id, student_name, academic_year_id, grade_id, status_id, source_id)
     select '00000000-0000-4000-c000-000000000002', '00000000-0000-4000-b000-000000000002', 'Panel',
            year_id, grade_id, new_status_id, source_id from fixture $$,
  'agent creates prospects');
select is(
  (select count(*)::int from public.admissions_status_history
   where prospect_id = '00000000-0000-4000-c000-000000000002'
     and previous_status_id is null
     and changed_by = '00000000-0000-4000-a000-000000000003'),
  1, 'prospect creation records the initial status with its author');
update public.admissions_prospects set status_id = (select contacted_status_id from fixture)
where id = '00000000-0000-4000-c000-000000000002';
select is(
  (select count(*)::int from public.admissions_status_history h, fixture f
   where h.prospect_id = '00000000-0000-4000-c000-000000000002'
     and h.previous_status_id = f.new_status_id
     and h.new_status_id = f.contacted_status_id
     and h.changed_by = '00000000-0000-4000-a000-000000000003'),
  1, 'a status change is audited with its author');
update public.admissions_prospects set internal_notes = 'Sin cambio de estado'
where id = '00000000-0000-4000-c000-000000000002';
select is(
  (select count(*)::int from public.admissions_status_history
   where prospect_id = '00000000-0000-4000-c000-000000000002'),
  2, 'an update that keeps the status adds no history');
update public.admissions_prospects set status_id = (select enrolled_status_id from fixture)
where id = '00000000-0000-4000-c000-000000000002';
select isnt(
  (select closed_at from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000002'),
  null, 'moving to a terminal status sets closed_at');
update public.admissions_prospects set status_id = (select contacted_status_id from fixture)
where id = '00000000-0000-4000-c000-000000000002';
select is(
  (select closed_at from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000002'),
  null, 'reopening a prospect clears closed_at');

select throws_ok(
  $$ update public.admissions_prospects set consent_to_contact = true, consent_at = now(), privacy_notice_version = 'x'
     where id = '00000000-0000-4000-c000-000000000002' $$,
  '42501', null, 'agent cannot rewrite consent evidence');
select throws_ok(
  $$ update public.admissions_prospects set closed_at = now()
     where id = '00000000-0000-4000-c000-000000000002' $$,
  '42501', null, 'agent cannot set the trigger-managed closed_at');
select throws_ok(
  $$ update public.admissions_prospects set grade_id = grade_id, modality_id = (select id from public.admissions_modalities where code = 'ESPANOL')
     where id = '00000000-0000-4000-c000-000000000002' $$,
  '23503', null, 'a modality the grade does not offer is rejected on direct writes');

select lives_ok(
  $$ insert into public.admissions_activities (prospect_id, performed_by, activity_type, description)
     values ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-a000-000000000003', 'call', 'Llamada') $$,
  'agent logs an activity as self');
select throws_ok(
  $$ insert into public.admissions_activities (prospect_id, performed_by, activity_type, description)
     values ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-a000-000000000002', 'call', 'Suplantada') $$,
  '42501', null, 'agent cannot log an activity as someone else');
select throws_ok(
  $$ insert into public.admissions_activities (prospect_id, performed_by, activity_type, description)
     values ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-a000-000000000003', 'system', 'Falso sistema') $$,
  '42501', null, 'agent cannot forge a system activity');
select throws_ok(
  $$ update public.admissions_activities set description = 'Editada' $$,
  '42501', null, 'activities cannot be edited');

select lives_ok(
  $$ insert into public.admissions_tasks (id, prospect_id, created_by, assigned_to, title)
     values ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-c000-000000000002',
             '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000003', 'Llamar') $$,
  'agent creates tasks');
update public.admissions_tasks set status = 'completed', completed_at = now()
where id = '00000000-0000-4000-d000-000000000001';
select is((select status from public.admissions_tasks where id = '00000000-0000-4000-d000-000000000001'),
  'completed', 'agent closes tasks');
select lives_ok(
  $$ insert into public.admissions_visits (id, prospect_id, created_by, scheduled_at)
     values ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-c000-000000000002',
             '00000000-0000-4000-a000-000000000003', now() + interval '1 day') $$,
  'agent schedules visits');
update public.admissions_visits set status = 'cancelled'
where id = '00000000-0000-4000-e000-000000000001';
select is((select status from public.admissions_visits where id = '00000000-0000-4000-e000-000000000001'),
  'cancelled', 'agent cancels visits');

select throws_ok(
  $$ insert into public.admissions_sources (code, name) values ('AGENT_SRC', 'No') $$,
  '42501', null, 'agent cannot create catalog rows');
update public.admissions_sources set name = 'Hackeado' where code = 'WEB_FORM';
select is((select name from public.admissions_sources where code = 'WEB_FORM'),
  'Formulario web', 'agent cannot update catalog rows');
delete from public.admissions_sources where code = 'OTHER';
select is((select count(*)::int from public.admissions_sources where code = 'OTHER'),
  1, 'agent cannot delete catalog rows');
select throws_ok(
  $$ insert into public.admissions_profiles (id, full_name, role)
     values ('00000000-0000-4000-a000-000000000006', 'Falso', 'admissions_viewer') $$,
  '42501', null, 'agent cannot create profiles');
update public.admissions_profiles set role = 'admin' where id = '00000000-0000-4000-a000-000000000003';
select is((select role from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000003'),
  'admissions_agent', 'agent cannot change its own role');
select throws_ok(
  $$ delete from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001' $$,
  '42501', null, 'agent cannot delete prospects');
reset role;

-- ---------------------------------------------------------------------------
-- Viewer
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000004","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.admissions_prospects), 2, 'viewer reads prospects');
select is((select count(*)::int from public.admissions_guardians), 2, 'viewer reads guardians');
select ok((select count(*) from public.admissions_status_history) > 0, 'viewer reads status history');
select throws_ok(
  $$ insert into public.admissions_guardians (full_name, phone) values ('No', '99990003') $$,
  '42501', null, 'viewer cannot insert guardians');
select throws_ok(
  $$ insert into public.admissions_prospects (guardian_id, student_name, academic_year_id, grade_id, status_id, source_id)
     select '00000000-0000-4000-b000-000000000001', 'No', year_id, grade_id, new_status_id, source_id from fixture $$,
  '42501', null, 'viewer cannot insert prospects');
select throws_ok(
  $$ insert into public.admissions_activities (prospect_id, performed_by, activity_type, description)
     values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000004', 'call', 'No') $$,
  '42501', null, 'viewer cannot insert activities');
select throws_ok(
  $$ insert into public.admissions_tasks (prospect_id, created_by, title)
     values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000004', 'No') $$,
  '42501', null, 'viewer cannot insert tasks');
select throws_ok(
  $$ insert into public.admissions_visits (prospect_id, created_by, scheduled_at)
     values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000004', now()) $$,
  '42501', null, 'viewer cannot insert visits');
update public.admissions_prospects set internal_notes = 'Visor' where id = '00000000-0000-4000-c000-000000000001';
select is((select internal_notes from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  null, 'viewer cannot update prospects');
update public.admissions_guardians set full_name = 'Visor' where id = '00000000-0000-4000-b000-000000000001';
select is((select full_name from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'Encargado', 'viewer cannot update guardians');
update public.admissions_tasks set title = 'Visor' where id = '00000000-0000-4000-d000-000000000001';
select is((select title from public.admissions_tasks where id = '00000000-0000-4000-d000-000000000001'),
  'Llamar', 'viewer cannot update tasks');
reset role;

-- ---------------------------------------------------------------------------
-- Status history stays immutable even for the most privileged app users
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ update public.admissions_status_history set notes = 'Editada' $$,
  '42501', null, 'admin cannot edit status history');
select throws_ok(
  $$ delete from public.admissions_status_history $$,
  '42501', null, 'admin cannot delete status history');
select throws_ok(
  $$ insert into public.admissions_status_history (prospect_id, new_status_id)
     select '00000000-0000-4000-c000-000000000001', new_status_id from fixture $$,
  '42501', null, 'admin cannot forge status history');
reset role;

set local role service_role;
select throws_ok(
  $$ update public.admissions_status_history set notes = 'Editada' $$,
  '42501', null, 'service_role cannot edit status history');
reset role;

-- ---------------------------------------------------------------------------
-- Inactive profile: an admin role must grant nothing once deactivated
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000005","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.admissions_prospects), 0, 'inactive user reads no prospects');
select is((select count(*)::int from public.admissions_guardians), 0, 'inactive user reads no guardians');
select is((select count(*)::int from public.admissions_profiles), 0, 'inactive user reads no profiles');
select is((select count(*)::int from public.admissions_grades), 0, 'inactive user reads no catalogs');
select throws_ok(
  $$ insert into public.admissions_guardians (full_name, phone) values ('No', '99990004') $$,
  '42501', null, 'inactive user cannot insert');
update public.admissions_profiles set is_active = true where id = '00000000-0000-4000-a000-000000000005';
reset role;
select is((select is_active from public.admissions_profiles where id = '00000000-0000-4000-a000-000000000005'),
  false, 'inactive user cannot reactivate itself');

-- ---------------------------------------------------------------------------
-- Authenticated user without a profile
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000006","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.admissions_prospects), 0, 'user without profile reads no prospects');
select is((select count(*)::int from public.admissions_guardians), 0, 'user without profile reads no guardians');
select throws_ok(
  $$ insert into public.admissions_profiles (id, full_name, role)
     values ('00000000-0000-4000-a000-000000000006', 'Autorregistro', 'admin') $$,
  '42501', null, 'user without profile cannot self-register');
reset role;

select * from finish();
rollback;
