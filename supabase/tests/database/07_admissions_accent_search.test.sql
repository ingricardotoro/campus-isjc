-- Accent-insensitive search columns for the admin panel.
--
-- The panel filters student and guardian names with ilike on folded columns, so
-- "maria" finds "María". The folding must match the TypeScript side for Spanish
-- letters: accents and the dieresis are dropped, ñ folds to n, and everything is
-- lower-cased with single spaces. Deduplication keeps using the unfolded
-- normalized column, so this file also checks that it did not change.
begin;
create extension if not exists pgtap with schema extensions;

select plan(43);

-- ---------------------------------------------------------------------------
-- Extension and folding function
-- ---------------------------------------------------------------------------
select is(
  (select extnamespace::regnamespace::text from pg_extension where extname = 'unaccent'),
  'extensions', 'unaccent is installed in the extensions schema');

select is(public.admissions_fold_name('á é í ó ú ü ñ'), 'a e i o u u n',
  'folds lower-case Spanish vowels, the dieresis, and ñ');
select is(public.admissions_fold_name('Á É Í Ó Ú Ü Ñ'), 'a e i o u u n',
  'folds upper-case Spanish vowels, the dieresis, and Ñ');
select is(public.admissions_fold_name('  María   JOSÉ  Peña '), 'maria jose pena',
  'trims, collapses spaces, and lower-cases like the normalized name');
select is(public.admissions_fold_name('Güell Muñoz'), 'guell munoz', 'folds a mixed name');
select is(public.admissions_fold_name(null), null, 'NULL stays NULL');
select is(public.admissions_fold_name('   '), null, 'a blank name folds to NULL');

select is(
  (select provolatile from pg_proc where oid = 'public.admissions_fold_name(text)'::regprocedure),
  'i', 'the folding function is IMMUTABLE, as a generated column requires');
select ok(
  (select proconfig @> array['search_path=""'] from pg_proc
   where oid = 'public.admissions_fold_name(text)'::regprocedure),
  'the folding function pins an empty search_path');
select ok(
  not (select prosecdef from pg_proc where oid = 'public.admissions_fold_name(text)'::regprocedure),
  'the folding function is not SECURITY DEFINER');
select ok(not has_function_privilege('anon', 'public.admissions_fold_name(text)', 'EXECUTE'),
  'anon cannot execute the folding function');
select ok(
  not exists (
    select 1 from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'public.admissions_fold_name(text)'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'),
  'PUBLIC cannot execute the folding function');
select ok(has_function_privilege('authenticated', 'public.admissions_fold_name(text)', 'EXECUTE'),
  'authenticated can execute it, because staff writes compute the generated columns');
select ok(has_function_privilege('service_role', 'public.admissions_fold_name(text)', 'EXECUTE'),
  'service_role can execute it, because public registration computes the generated columns');

-- ---------------------------------------------------------------------------
-- Generated columns
-- ---------------------------------------------------------------------------
select is(
  (select attgenerated::text from pg_attribute
   where attrelid = 'public.admissions_prospects'::regclass and attname = 'student_name_search'),
  's', 'student_name_search is a stored generated column');
select is(
  (select attgenerated::text from pg_attribute
   where attrelid = 'public.admissions_guardians'::regclass and attname = 'full_name_search'),
  's', 'full_name_search is a stored generated column');

-- Fixtures, created as the table owner.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-000000000001', 'admin@test.local'),
  ('00000000-0000-4000-a000-000000000002', 'manager@test.local'),
  ('00000000-0000-4000-a000-000000000003', 'agent@test.local'),
  ('00000000-0000-4000-a000-000000000004', 'viewer@test.local');

insert into public.admissions_profiles (id, full_name, role, is_active) values
  ('00000000-0000-4000-a000-000000000001', 'Admin',   'admin',              true),
  ('00000000-0000-4000-a000-000000000002', 'Manager', 'admissions_manager', true),
  ('00000000-0000-4000-a000-000000000003', 'Agent',   'admissions_agent',   true),
  ('00000000-0000-4000-a000-000000000004', 'Viewer',  'admissions_viewer',  true);

insert into public.admissions_guardians (id, full_name, phone)
values ('00000000-0000-4000-b000-000000000001', 'JOSÉ Güell Núñez', '99990001');

insert into public.admissions_prospects (id, guardian_id, student_name, academic_year_id, grade_id, status_id, source_id)
select '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'María Peña',
       (select id from public.admissions_academic_years where year = 2027),
       (select id from public.admissions_grades where code = 'GRADE_01'),
       (select id from public.admissions_statuses where code = 'NEW'),
       (select id from public.admissions_sources where code = 'WEB_FORM');

select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'maria pena', 'a new prospect gets its folded student name');
select is(
  (select full_name_search from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'jose guell nunez', 'a new guardian gets its folded name');
select is(
  (select count(*)::int from public.admissions_prospects where student_name_search ilike '%maria%'),
  1, 'an unaccented term finds the accented student name');
select is(
  (select count(*)::int from public.admissions_guardians where full_name_search ilike '%jose%'),
  1, 'a lower-case unaccented term finds the upper-case accented guardian name');

-- Deduplication keeps its semantics: the normalized key still holds the accents.
select is(
  (select student_name_normalized from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'maría peña', 'student_name_normalized is unchanged and keeps the accents');

-- Existing rows: drop both columns and add them back with the definitions the
-- migration created, after rows already exist. Adding a stored generated column
-- computes it for every existing row.
create temporary table saved_expression as
select c.relname::text as table_name, a.attname::text as column_name, pg_get_expr(d.adbin, d.adrelid) as expression
from pg_attribute a
join pg_class c on c.oid = a.attrelid
join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where (c.oid, a.attname) in (
  ('public.admissions_prospects'::regclass, 'student_name_search'),
  ('public.admissions_guardians'::regclass, 'full_name_search'));

select is((select count(*)::int from saved_expression), 2, 'both generation expressions were captured');

do $$
declare
  saved record;
begin
  for saved in select * from saved_expression loop
    execute format('alter table public.%I drop column %I', saved.table_name, saved.column_name);
    execute format('alter table public.%I add column %I text generated always as (%s) stored',
                   saved.table_name, saved.column_name, saved.expression);
  end loop;
end $$;

select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'maria pena', 'an existing prospect is backfilled when the column is added');
select is(
  (select full_name_search from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'jose guell nunez', 'an existing guardian is backfilled when the column is added');

-- ---------------------------------------------------------------------------
-- Staff read the folded names and changes recompute them
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'maria pena', 'admin reads student_name_search');
select is(
  (select full_name_search from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'jose guell nunez', 'admin reads full_name_search');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'maria pena', 'manager reads student_name_search');
select is(
  (select full_name_search from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'jose guell nunez', 'manager reads full_name_search');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'maria pena', 'agent reads student_name_search');

update public.admissions_prospects set student_name = 'ÍÑIGO Úbeda'
where id = '00000000-0000-4000-c000-000000000001';
select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'inigo ubeda', 'renaming the student as staff recomputes the folded name');

update public.admissions_guardians set full_name = 'Óscar Díaz'
where id = '00000000-0000-4000-b000-000000000001';
select is(
  (select full_name_search from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'oscar diaz', 'renaming the guardian as staff recomputes the folded name');

select throws_ok(
  $$ update public.admissions_prospects set student_name_search = 'x'
     where id = '00000000-0000-4000-c000-000000000001' $$,
  '428C9', null, 'staff cannot write student_name_search');
select throws_ok(
  $$ update public.admissions_guardians set full_name_search = 'x'
     where id = '00000000-0000-4000-b000-000000000001' $$,
  '428C9', null, 'staff cannot write full_name_search');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select student_name_search from public.admissions_prospects where id = '00000000-0000-4000-c000-000000000001'),
  'inigo ubeda', 'viewer reads student_name_search');
select is(
  (select full_name_search from public.admissions_guardians where id = '00000000-0000-4000-b000-000000000001'),
  'oscar diaz', 'viewer reads full_name_search');
reset role;

-- ---------------------------------------------------------------------------
-- Clients cannot write the columns; anon cannot read them
-- ---------------------------------------------------------------------------
select ok(
  not has_column_privilege('authenticated', 'public.admissions_prospects', 'student_name_search', 'INSERT')
  and not has_column_privilege('authenticated', 'public.admissions_prospects', 'student_name_search', 'UPDATE'),
  'authenticated holds no INSERT or UPDATE privilege on student_name_search');
select ok(
  not has_column_privilege('authenticated', 'public.admissions_guardians', 'full_name_search', 'INSERT')
  and not has_column_privilege('authenticated', 'public.admissions_guardians', 'full_name_search', 'UPDATE'),
  'authenticated holds no INSERT or UPDATE privilege on full_name_search');

set local role service_role;
select throws_ok(
  $$ update public.admissions_prospects set student_name_search = 'x'
     where id = '00000000-0000-4000-c000-000000000001' $$,
  '428C9', null, 'not even service_role can write student_name_search');
select throws_ok(
  $$ update public.admissions_guardians set full_name_search = 'x'
     where id = '00000000-0000-4000-b000-000000000001' $$,
  '428C9', null, 'not even service_role can write full_name_search');
reset role;

select ok(
  not has_column_privilege('anon', 'public.admissions_prospects', 'student_name_search', 'SELECT'),
  'anon holds no SELECT privilege on student_name_search');
select ok(
  not has_column_privilege('anon', 'public.admissions_guardians', 'full_name_search', 'SELECT'),
  'anon holds no SELECT privilege on full_name_search');

set local role anon;
select throws_ok(
  $$ select student_name_search from public.admissions_prospects $$,
  '42501', null, 'anon cannot read student_name_search');
select throws_ok(
  $$ select full_name_search from public.admissions_guardians $$,
  '42501', null, 'anon cannot read full_name_search');
reset role;

select * from finish();
rollback;
