-- Structural guarantees: RLS on every table, no anonymous reach, per-object
-- grants, hardened functions, and a read-only status history.
begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

-- Single source of truth for the module's tables in this file.
create temporary table module_tables (name text primary key) on commit drop;
insert into module_tables values
  ('admissions_profiles'), ('admissions_guardians'), ('admissions_academic_years'),
  ('admissions_grades'), ('admissions_modalities'), ('admissions_grade_modalities'),
  ('admissions_statuses'), ('admissions_sources'), ('admissions_campaigns'),
  ('admissions_prospects'), ('admissions_activities'), ('admissions_tasks'),
  ('admissions_visits'), ('admissions_status_history');

select is(
  (select count(*)::int from pg_class c
   where c.relnamespace = 'public'::regnamespace
     and c.relkind = 'r'
     and c.relname like 'admissions\_%'),
  14,
  'the module has exactly the 14 expected tables'
);

select is_empty(
  $$ select m.name from module_tables m
     left join pg_class c on c.relname = m.name
       and c.relnamespace = 'public'::regnamespace
     where c.oid is null or not c.relrowsecurity $$,
  'RLS is enabled on every module table'
);

select is_empty(
  $$ select m.name, p.priv
     from module_tables m
     cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'),
                        ('REFERENCES'), ('TRIGGER')) p(priv)
     where has_table_privilege('anon', 'public.' || m.name, p.priv) $$,
  'anon holds no table privilege on any module table'
);

select is_empty(
  $$ select m.name
     from module_tables m
     cross join lateral aclexplode(
       coalesce(
         (select c.relacl from pg_class c where c.oid = ('public.' || m.name)::regclass),
         '{}'::aclitem[]
       )
     ) a
     where a.grantee = 0 $$,
  'PUBLIC holds no table privilege on any module table'
);

select is_empty(
  $$ select m.name from module_tables m
     where has_table_privilege('authenticated', 'public.' || m.name, 'TRUNCATE')
        or has_table_privilege('service_role', 'public.' || m.name, 'TRUNCATE') $$,
  'authenticated and service_role cannot truncate module tables'
);

-- Anonymous access fails on privilege, not merely on an empty result.
set local role anon;
select throws_ok('select * from public.admissions_profiles',         '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.admissions_guardians',        '42501', null, 'anon cannot read guardians');
select throws_ok('select * from public.admissions_academic_years',   '42501', null, 'anon cannot read academic years');
select throws_ok('select * from public.admissions_grades',           '42501', null, 'anon cannot read grades');
select throws_ok('select * from public.admissions_modalities',       '42501', null, 'anon cannot read modalities');
select throws_ok('select * from public.admissions_grade_modalities', '42501', null, 'anon cannot read grade modalities');
select throws_ok('select * from public.admissions_statuses',         '42501', null, 'anon cannot read statuses');
select throws_ok('select * from public.admissions_sources',          '42501', null, 'anon cannot read sources');
select throws_ok('select * from public.admissions_campaigns',        '42501', null, 'anon cannot read campaigns');
select throws_ok('select * from public.admissions_prospects',        '42501', null, 'anon cannot read prospects');
select throws_ok('select * from public.admissions_activities',       '42501', null, 'anon cannot read activities');
select throws_ok('select * from public.admissions_tasks',            '42501', null, 'anon cannot read tasks');
select throws_ok('select * from public.admissions_visits',           '42501', null, 'anon cannot read visits');
select throws_ok('select * from public.admissions_status_history',   '42501', null, 'anon cannot read status history');
select throws_ok(
  $$ insert into public.admissions_guardians (full_name, phone) values ('Anon', '99990000') $$,
  '42501', null, 'anon cannot write guardians directly'
);
reset role;

-- Function hardening.
select ok(
  (select count(*) from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname like 'admissions\_%' and p.prosecdef) >= 1,
  'the SECURITY DEFINER checks below have something to inspect'
);

select is_empty(
  $$ select p.proname from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.proname like 'admissions\_%'
       and not exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""') $$,
  'every module function pins an empty search_path'
);

select is_empty(
  $$ select p.proname from pg_proc p
     cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
     where p.pronamespace = 'public'::regnamespace
       and p.proname like 'admissions\_%'
       and a.grantee = 0 and a.privilege_type = 'EXECUTE' $$,
  'no module function is executable by PUBLIC'
);

select is_empty(
  $$ select p.proname from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.proname like 'admissions\_%'
       and has_function_privilege('anon', p.oid, 'EXECUTE') $$,
  'no module function is executable by anon'
);

select ok(
  not has_function_privilege('authenticated',
    'public.admissions_register_public_interest(text, text, text, text, text, uuid, uuid, uuid, boolean, text, boolean, text, text, text, text, text, text)',
    'EXECUTE'),
  'authenticated cannot execute the public registration function'
);

select ok(
  has_function_privilege('service_role',
    'public.admissions_register_public_interest(text, text, text, text, text, uuid, uuid, uuid, boolean, text, boolean, text, text, text, text, text, text)',
    'EXECUTE'),
  'service_role can execute the public registration function'
);

-- Status history is read-only for both application roles.
select ok(has_table_privilege('authenticated', 'public.admissions_status_history', 'SELECT'),
  'authenticated can select status history');
select ok(has_table_privilege('service_role', 'public.admissions_status_history', 'SELECT'),
  'service_role can select status history');
select ok(not has_table_privilege('authenticated', 'public.admissions_status_history', 'INSERT'),
  'authenticated cannot insert status history');
select ok(not has_table_privilege('authenticated', 'public.admissions_status_history', 'UPDATE'),
  'authenticated cannot update status history');
select ok(not has_table_privilege('authenticated', 'public.admissions_status_history', 'DELETE'),
  'authenticated cannot delete status history');
select ok(not has_table_privilege('service_role', 'public.admissions_status_history', 'INSERT'),
  'service_role cannot insert status history');
select ok(not has_table_privilege('service_role', 'public.admissions_status_history', 'UPDATE'),
  'service_role cannot update status history');
select ok(not has_table_privilege('service_role', 'public.admissions_status_history', 'DELETE'),
  'service_role cannot delete status history');

-- Prospects cannot be deleted from the application until a policy exists.
select ok(not has_table_privilege('authenticated', 'public.admissions_prospects', 'DELETE'),
  'authenticated cannot delete prospects');
select ok(not has_table_privilege('service_role', 'public.admissions_prospects', 'DELETE'),
  'service_role cannot delete prospects');

select * from finish();
rollback;
