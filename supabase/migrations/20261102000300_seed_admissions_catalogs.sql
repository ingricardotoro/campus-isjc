-- Admissions module: initial catalogs. Display names are shown to users, so they
-- are in Spanish.
--
-- Idempotent on code so a re-run never duplicates or overwrites staff edits.

-- ---------------------------------------------------------------------------
-- Statuses (spec section 7)
-- ---------------------------------------------------------------------------

insert into public.admissions_statuses (code, name, is_terminal, sort_order) values
  ('NEW',             'Nuevo',                   false, 10),
  ('CONTACTED',       'Contactado',              false, 20),
  ('INFO_SENT',       'Información enviada',     false, 30),
  ('VISIT_SCHEDULED', 'Visita programada',       false, 40),
  ('IN_PROCESS',      'En proceso de matrícula', false, 50),
  ('ENROLLED',        'Matriculado',             true,  60),
  ('NOT_INTERESTED',  'No interesado',           true,  70),
  ('NO_RESPONSE',     'Sin respuesta',           true,  80)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------------

-- WEB_FORM is the default source of the public registration function.
insert into public.admissions_sources (code, name) values
  ('WEB_FORM',  'Formulario web'),
  ('WHATSAPP',  'WhatsApp'),
  ('FACEBOOK',  'Facebook'),
  ('INSTAGRAM', 'Instagram'),
  ('PHONE',     'Llamada telefónica'),
  ('WALK_IN',   'Visita presencial'),
  ('REFERRAL',  'Referido'),
  ('OTHER',     'Otro')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Academic year
-- ---------------------------------------------------------------------------

-- PENDING INSTITUTIONAL CONFIRMATION: start and end dates are left NULL because
-- the site does not publish them.
insert into public.admissions_academic_years (year, name, is_open_for_intake) values
  (2027, 'Año académico 2027', true)
on conflict (year) do nothing;

-- ---------------------------------------------------------------------------
-- Grades
-- ---------------------------------------------------------------------------

-- PENDING INSTITUTIONAL CONFIRMATION. Candidates derived from the public site,
-- not from an official academic offering:
--   * src/data/header-menu/main-menu-data.ts: "Pre-Básica", "Educ. Básica (1 - 9)",
--     "Educ. Media (10 y 11)".
--   * src/components/elementary/BannerSectionOne.tsx: "1ro a 9no grado".
--   * src/components/highSchool/BannerSectionOne.tsx: "10mo a 12vo grado".
--
-- The site contradicts itself on Educación Media: the menu says 10 and 11, the
-- banner says 10 to 12. Grade 12 is seeded inactive so it cannot be selected
-- until the institution confirms it.
--
-- Pre-Básica stays one row because the site does not list its sublevels.
insert into public.admissions_grades (code, name, level, sort_order, is_active) values
  ('PRE_BASICA', 'Pre-Básica',    'Pre-Básica',        0,  true),
  ('GRADE_01',   'Primer grado',  'Educación Básica',  1,  true),
  ('GRADE_02',   'Segundo grado', 'Educación Básica',  2,  true),
  ('GRADE_03',   'Tercer grado',  'Educación Básica',  3,  true),
  ('GRADE_04',   'Cuarto grado',  'Educación Básica',  4,  true),
  ('GRADE_05',   'Quinto grado',  'Educación Básica',  5,  true),
  ('GRADE_06',   'Sexto grado',   'Educación Básica',  6,  true),
  ('GRADE_07',   'Séptimo grado', 'Educación Básica',  7,  true),
  ('GRADE_08',   'Octavo grado',  'Educación Básica',  8,  true),
  ('GRADE_09',   'Noveno grado',  'Educación Básica',  9,  true),
  ('GRADE_10',   'Décimo grado',  'Educación Media',   10, true),
  ('GRADE_11',   'Undécimo grado', 'Educación Media',  11, true),
  ('GRADE_12',   'Duodécimo grado', 'Educación Media', 12, false)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Modalities
-- ---------------------------------------------------------------------------

-- PENDING INSTITUTIONAL CONFIRMATION. Deliberately minimal: only what
-- src/components/elementary/BannerSectionOne.tsx states with an explicit grade
-- range, "Totalmente Bilingüe de 1ro a 9no grado" and "Modalidad Español de 7mo
-- a 9no grado".
--
-- Pre-Básica and Educación Media have no mapping, so their prospects carry a
-- NULL modality. The site uses "bilingüe" and "Bachillerato en Ciencias y
-- Humanidades" there as descriptions, without saying whether a family chooses
-- between options, so no mapping is inferred.
insert into public.admissions_modalities (code, name) values
  ('BILINGUE', 'Bilingüe'),
  ('ESPANOL',  'Español')
on conflict (code) do nothing;

insert into public.admissions_grade_modalities (grade_id, modality_id)
select g.id, m.id
from public.admissions_grades g
join public.admissions_modalities m on m.code = 'BILINGUE'
where g.code in (
  'GRADE_01', 'GRADE_02', 'GRADE_03', 'GRADE_04', 'GRADE_05',
  'GRADE_06', 'GRADE_07', 'GRADE_08', 'GRADE_09'
)
on conflict (grade_id, modality_id) do nothing;

insert into public.admissions_grade_modalities (grade_id, modality_id)
select g.id, m.id
from public.admissions_grades g
join public.admissions_modalities m on m.code = 'ESPANOL'
where g.code in ('GRADE_07', 'GRADE_08', 'GRADE_09')
on conflict (grade_id, modality_id) do nothing;
