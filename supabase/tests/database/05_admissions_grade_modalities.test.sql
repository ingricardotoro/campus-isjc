-- The academic offer confirmed by the institution: Pre-Básica is bilingual only,
-- and grades 1 to 11 offer both modalities.

begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

select results_eq(
  $$ select g.code::text, m.code::text
     from public.admissions_grade_modalities gm
     join public.admissions_grades g on g.id = gm.grade_id
     join public.admissions_modalities m on m.id = gm.modality_id
     where gm.is_active
     order by g.sort_order, m.code $$,
  $$ values
     ('PRE_BASICA', 'BILINGUE'),
     ('GRADE_01', 'BILINGUE'), ('GRADE_01', 'ESPANOL'),
     ('GRADE_02', 'BILINGUE'), ('GRADE_02', 'ESPANOL'),
     ('GRADE_03', 'BILINGUE'), ('GRADE_03', 'ESPANOL'),
     ('GRADE_04', 'BILINGUE'), ('GRADE_04', 'ESPANOL'),
     ('GRADE_05', 'BILINGUE'), ('GRADE_05', 'ESPANOL'),
     ('GRADE_06', 'BILINGUE'), ('GRADE_06', 'ESPANOL'),
     ('GRADE_07', 'BILINGUE'), ('GRADE_07', 'ESPANOL'),
     ('GRADE_08', 'BILINGUE'), ('GRADE_08', 'ESPANOL'),
     ('GRADE_09', 'BILINGUE'), ('GRADE_09', 'ESPANOL'),
     ('GRADE_10', 'BILINGUE'), ('GRADE_10', 'ESPANOL'),
     ('GRADE_11', 'BILINGUE'), ('GRADE_11', 'ESPANOL') $$,
  'each grade offers exactly the confirmed modalities'
);

select is(
  (select is_active from public.admissions_grades where code = 'GRADE_12'),
  false,
  'grade 12 stays unavailable'
);

select is(
  (select count(*)::integer
   from public.admissions_grade_modalities gm
   join public.admissions_grades g on g.id = gm.grade_id
   where g.code = 'GRADE_12'),
  0,
  'grade 12 has no modalities'
);

select * from finish();
rollback;
