-- Public registration function: guardian resolution, atomicity, and validation.
begin;
create extension if not exists pgtap with schema extensions;

select plan(49);

-- Convenience wrapper over the long signature. It runs as the caller, so the
-- role switches below still decide whether the function is reachable.
create function pg_temp.register(
  guardian_name text,
  phone text,
  email text,
  student text,
  grade_code text default 'GRADE_01',
  modality_code text default null,
  consent boolean default true,
  notice text default 'v1',
  wants_visit boolean default false,
  contact_method text default 'whatsapp'
) returns table (prospect_id uuid, guardian_id uuid, is_new_prospect boolean)
language sql as $$
  select * from public.admissions_register_public_interest(
    guardian_name, phone, email, contact_method, student,
    (select id from public.admissions_academic_years a where a.year = 2027),
    (select id from public.admissions_grades g where g.code = grade_code),
    (select id from public.admissions_modalities m where m.code = modality_code),
    consent, notice, wants_visit, 'WEB_FORM', null, 'google', 'cpc', 'matricula', '/admisiones-2027'
  )
$$;

-- Execution is limited to the server.
set local role anon;
select throws_ok(
  $$ select public.admissions_register_public_interest('A','99990000',null,null,null,null,null,null,true,'v1',false,'WEB_FORM',null,null,null,null,null) $$,
  '42501', null, 'anon cannot execute the registration function');
reset role;

set local role authenticated;
select throws_ok(
  $$ select public.admissions_register_public_interest('A','99990000',null,null,null,null,null,null,true,'v1',false,'WEB_FORM',null,null,null,null,null) $$,
  '42501', null, 'authenticated cannot execute the registration function');
reset role;

set local role service_role;

-- New guardian and prospect.
create temporary table first_result on commit drop as
  select * from pg_temp.register('María López', '+504 9999-1111', ' Maria@Example.COM ', 'Ana');

select is((select is_new_prospect from first_result), true, 'first registration creates a prospect');
select is(
  (select phone_normalized from public.admissions_guardians g join first_result r on r.guardian_id = g.id),
  '50499991111', 'phone is stored normalized');
select is(
  (select email_normalized from public.admissions_guardians g join first_result r on r.guardian_id = g.id),
  'maria@example.com', 'email is stored normalized');
select is(
  (select s.code from public.admissions_prospects p
   join first_result r on r.prospect_id = p.id
   join public.admissions_statuses s on s.id = p.status_id),
  'NEW', 'the prospect starts in NEW');
select is(
  (select count(*)::int from public.admissions_status_history h
   join first_result r on r.prospect_id = h.prospect_id
   where h.previous_status_id is null and h.changed_by is null),
  1, 'the initial status is recorded without an author');
select isnt(
  (select consent_at from public.admissions_prospects p join first_result r on r.prospect_id = p.id),
  null, 'consent time is stored');
select is(
  (select privacy_notice_version from public.admissions_prospects p join first_result r on r.prospect_id = p.id),
  'v1', 'privacy notice version is stored');
select is(
  (select utm_source || '|' || landing_page from public.admissions_prospects p join first_result r on r.prospect_id = p.id),
  'google|/admisiones-2027', 'origin parameters are stored');
select is(
  (select count(*)::int from public.admissions_activities a join first_result r on r.prospect_id = a.prospect_id),
  0, 'a clean registration leaves no review note');

-- Second prospect for the same guardian, with the phone written another way.
create temporary table second_result on commit drop as
  select * from pg_temp.register('María López', '99991111', 'maria@example.com', 'Luis', 'GRADE_02');

select is((select guardian_id from second_result), (select guardian_id from first_result),
  'a second student reuses the guardian');
select isnt((select prospect_id from second_result), (select prospect_id from first_result),
  'a second student gets a separate prospect');
select is((select is_new_prospect from second_result), true, 'the second student is a new prospect');

-- A repeated submission is idempotent.
create temporary table repeat_result on commit drop as
  select * from pg_temp.register('María López', '9999 1111', 'MARIA@example.com', '  ana ');

select is((select prospect_id from repeat_result), (select prospect_id from first_result),
  'a repeated submission returns the existing prospect');
select is((select is_new_prospect from repeat_result), false, 'a repeated submission is not new');
select is(
  (select count(*)::int from public.admissions_status_history h join first_result r on r.prospect_id = h.prospect_id),
  1, 'a repeated submission adds no status history');

-- A repeat that requests a visit tells staff with a note and never changes
-- the prospect itself: staff decide what to do with the request.
select pg_temp.register('María López', '99991111', 'maria@example.com', 'Ana', wants_visit => true);
select is(
  (select count(*)::int from public.admissions_activities a join first_result r on r.prospect_id = a.prospect_id
   where a.description like '%solicita una visita%'),
  1, 'a visit request on a repeated submission adds exactly one note');
select is(
  (select p.wants_visit from public.admissions_prospects p join first_result r on r.prospect_id = p.id),
  false, 'a visit request on a repeated submission leaves the prospect unchanged');

-- Retries and double submits within 24 hours are absorbed.
select pg_temp.register('María López', '99991111', 'maria@example.com', 'Ana', wants_visit => true);
select is(
  (select count(*)::int from public.admissions_activities a join first_result r on r.prospect_id = a.prospect_id),
  1, 'an identical visit request within 24 hours adds no further note');

-- An identical note older than 24 hours is a new signal, not a retry.
reset role;
update public.admissions_activities a
set occurred_at = a.occurred_at - interval '25 hours'
where a.prospect_id = (select prospect_id from first_result);
set local role service_role;
select pg_temp.register('María López', '99991111', 'maria@example.com', 'Ana', wants_visit => true);
select is(
  (select count(*)::int from public.admissions_activities a join first_result r on r.prospect_id = a.prospect_id),
  2, 'an identical note older than 24 hours does not block a new one');

-- A new prospect still stores the visit request from the submission.
create temporary table visit_result on commit drop as
  select * from pg_temp.register('Rosa Méndez', '99990001', null, 'Rosa', wants_visit => true);
select is(
  (select p.wants_visit from public.admissions_prospects p join visit_result r on r.prospect_id = p.id),
  true, 'a new prospect stores the visit request');

update public.admissions_prospects
set status_id = (select id from public.admissions_statuses where code = 'NOT_INTERESTED')
where id = (select prospect_id from second_result);
select pg_temp.register('María López', '99991111', 'maria@example.com', 'Luis', 'GRADE_02');
select ok(
  (select a.description like '%ya estaba cerrado%'
   from public.admissions_activities a join second_result r on r.prospect_id = a.prospect_id),
  'renewed interest in a closed prospect is noted');
select pg_temp.register('María López', '99991111', 'maria@example.com', 'Luis', 'GRADE_02');
select is(
  (select count(*)::int from public.admissions_activities a join second_result r on r.prospect_id = a.prospect_id),
  1, 'an identical repeat on a closed prospect adds no duplicate note');

-- A match on one key reuses the guardian, never overwrites it, and tells staff.
create temporary table partial_result on commit drop as
  select * from pg_temp.register('Juan Pérez', '99991111', 'otro@example.com', 'Sofía');

select is((select guardian_id from partial_result), (select guardian_id from first_result),
  'a phone match reuses the guardian');
select is(
  (select g.full_name || '|' || btrim(g.email) from public.admissions_guardians g join first_result r on r.guardian_id = g.id),
  'María López|Maria@Example.COM', 'public input never overwrites guardian data');
select ok(
  (select a.description like '%Juan Pérez%' and a.description like '%otro@example.com%' and a.activity_type = 'system'
   from public.admissions_activities a join partial_result r on r.prospect_id = a.prospect_id),
  'differing contact data is kept in a system note');
select pg_temp.register('Juan Pérez', '99991111', 'otro@example.com', 'Sofía');
select is(
  (select count(*)::int from public.admissions_activities a join partial_result r on r.prospect_id = a.prospect_id),
  1, 'an identical repeat with differing data adds no duplicate note');
select pg_temp.register('Juan Pérez', '99991111', 'tercero@example.com', 'Sofía');
select is(
  (select count(*)::int from public.admissions_activities a join partial_result r on r.prospect_id = a.prospect_id),
  2, 'genuinely new differing data still adds a note');

-- An email-only submission matches on email.
create temporary table email_result on commit drop as
  select * from pg_temp.register('María López', null, 'MARIA@EXAMPLE.COM', 'Pedro');
select is((select guardian_id from email_result), (select guardian_id from first_result),
  'an email match reuses the guardian');

-- Phone and email point to different guardians: phone wins and staff are told.
create temporary table other_guardian on commit drop as
  select * from pg_temp.register('Carlos Ruiz', '99992222', 'carlos@example.com', 'Elena');
create temporary table conflict_result on commit drop as
  select * from pg_temp.register('Carlos Ruiz', '99992222', 'maria@example.com', 'Tomás');
select is((select guardian_id from conflict_result), (select guardian_id from other_guardian),
  'when keys point to different guardians the phone match wins');
select ok(
  (select a.description like '%otro encargado%'
   from public.admissions_activities a join conflict_result r on r.prospect_id = a.prospect_id),
  'conflicting guardians are flagged for review');

-- Modality rules.
select lives_ok(
  $$ select * from pg_temp.register('Modalidad', '99993333', null, 'Sept', 'GRADE_07', 'ESPANOL') $$,
  'a modality the grade offers is accepted');
select throws_ok(
  $$ select * from pg_temp.register('Modalidad', '99994444', null, 'Uno', 'GRADE_01', 'ESPANOL') $$,
  '22023', null, 'a modality the grade does not offer is rejected');

-- Invalid submissions are refused and leave nothing behind.
create temporary table counts_before on commit drop as
  select (select count(*) from public.admissions_guardians) as guardians,
         (select count(*) from public.admissions_prospects) as prospects;

select throws_ok(
  $$ select * from pg_temp.register('Sin consentimiento', '99995555', null, 'X', consent => false) $$,
  '22023', null, 'registration without consent is refused');
select throws_ok(
  $$ select * from pg_temp.register('Sin contacto', null, '   ', 'X') $$,
  '22023', null, 'registration without phone or email is refused');

-- Malformed contact data fails the same way whether or not a guardian matches.
select throws_ok(
  $$ select * from pg_temp.register('Correo malo', null, 'no-es-correo', 'X') $$,
  '22023', null, 'an invalid email is refused');
select throws_ok(
  $$ select * from pg_temp.register('María López', '99991111', 'no-es-correo', 'X') $$,
  '22023', null, 'an invalid email is refused when the phone matches');
select throws_ok(
  $$ select * from pg_temp.register('Teléfono malo', '123', 'nuevo1@example.com', 'X') $$,
  '22023', null, 'an invalid phone is refused');
select throws_ok(
  $$ select * from pg_temp.register('María López', '123', 'maria@example.com', 'X') $$,
  '22023', null, 'an invalid phone is refused when the email matches');
select throws_ok(
  $$ select * from pg_temp.register('Letras', 'sin-numero', 'nuevo2@example.com', 'X') $$,
  '22023', null, 'a phone without digits is refused instead of ignored');
select throws_ok(
  $$ select * from pg_temp.register('   ', '99998888', null, 'X') $$,
  '22023', null, 'a blank guardian name is refused');
select throws_ok(
  $$ select * from pg_temp.register('   ', '99991111', null, 'X') $$,
  '22023', null, 'a blank guardian name is refused when the phone matches');
select throws_ok(
  $$ select * from pg_temp.register(null, '99998888', null, 'X') $$,
  '22023', null, 'a missing guardian name is refused');
select throws_ok(
  $$ select * from pg_temp.register('Método malo', '99998888', null, 'X', contact_method => 'fax') $$,
  '22023', null, 'an unknown preferred contact method is refused');
select throws_ok(
  $$ select * from pg_temp.register('María López', '99991111', null, 'X', contact_method => 'fax') $$,
  '22023', null, 'an unknown preferred contact method is refused when the phone matches');
select throws_ok(
  $$ select * from pg_temp.register('Grado cerrado', '99996666', null, 'X', 'GRADE_12') $$,
  '22023', null, 'an inactive grade is refused');
select throws_ok(
  $$ select * from pg_temp.register('Grado inexistente', '99997777', null, 'X', 'NO_EXISTE') $$,
  '22023', null, 'an unknown grade is refused');

select is(
  (select (select count(*) from public.admissions_guardians) - guardians
        + (select count(*) from public.admissions_prospects) - prospects from counts_before)::int,
  0, 'refused registrations create no partial rows');

reset role;
select * from finish();
rollback;
