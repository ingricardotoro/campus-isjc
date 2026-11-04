-- Admissions module: academic offer confirmed by the institution. Pre-Básica is
-- bilingual only, and grades 1 to 11 offer both modalities. Grade 12 does not
-- exist and stays inactive, without modalities.
--
-- Additive and idempotent: rows that already exist are left as they are.

insert into public.admissions_grade_modalities (grade_id, modality_id)
select g.id, m.id
from public.admissions_grades g
join public.admissions_modalities m on m.code = 'BILINGUE'
where g.code in (
  'PRE_BASICA', 'GRADE_01', 'GRADE_02', 'GRADE_03', 'GRADE_04', 'GRADE_05', 'GRADE_06',
  'GRADE_07', 'GRADE_08', 'GRADE_09', 'GRADE_10', 'GRADE_11'
)
on conflict (grade_id, modality_id) do nothing;

insert into public.admissions_grade_modalities (grade_id, modality_id)
select g.id, m.id
from public.admissions_grades g
join public.admissions_modalities m on m.code = 'ESPANOL'
where g.code in (
  'GRADE_01', 'GRADE_02', 'GRADE_03', 'GRADE_04', 'GRADE_05', 'GRADE_06',
  'GRADE_07', 'GRADE_08', 'GRADE_09', 'GRADE_10', 'GRADE_11'
)
on conflict (grade_id, modality_id) do nothing;
