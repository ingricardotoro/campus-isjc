-- ============================================================
-- Modulo de Evaluacion Docente - esquema Supabase
-- Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase.
-- Es seguro volver a ejecutarlo (idempotente via IF NOT EXISTS).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- docentes ----------
create table if not exists public.teachers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  photo_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- secciones (grado + letra, ej. 7A, 9C, 10B) ----------
create table if not exists public.sections (
  id             uuid primary key default gen_random_uuid(),
  grade          text not null,
  section_letter text not null,
  label          text generated always as (grade || section_letter) stored,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint sections_grade_letter_unique unique (grade, section_letter)
);

-- ---------- asignaciones docente <-> seccion (muchos a muchos) ----------
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.teachers(id) on delete cascade,
  section_id   uuid not null references public.sections(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint assignments_teacher_section_unique unique (teacher_id, section_id)
);

-- ---------- preguntas de evaluacion ----------
create table if not exists public.questions (
  id           uuid primary key default gen_random_uuid(),
  text         text not null,
  order_index  integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- corridas de evaluacion (una por estudiante/seccion) ----------
create table if not exists public.evaluation_runs (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references public.sections(id) on delete restrict,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------- respuestas individuales ----------
create table if not exists public.evaluation_answers (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references public.evaluation_runs(id) on delete cascade,
  teacher_id   uuid not null references public.teachers(id) on delete restrict,
  question_id  uuid not null references public.questions(id) on delete restrict,
  score        smallint not null check (score between 1 and 4), -- 1=Mejorar 2=Bueno 3=MuyBueno 4=Excelente
  created_at   timestamptz not null default now(),
  constraint evaluation_answers_unique_per_run unique (run_id, teacher_id, question_id)
);

-- ---------- opinion final por docente (opcional, texto libre) ----------
create table if not exists public.evaluation_comments (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references public.evaluation_runs(id) on delete cascade,
  teacher_id   uuid not null references public.teachers(id) on delete restrict,
  comment      text not null,
  created_at   timestamptz not null default now(),
  constraint evaluation_comments_unique_per_run unique (run_id, teacher_id)
);

create index if not exists idx_assignments_teacher on public.assignments(teacher_id);
create index if not exists idx_assignments_section on public.assignments(section_id);
create index if not exists idx_answers_run on public.evaluation_answers(run_id);
create index if not exists idx_answers_teacher on public.evaluation_answers(teacher_id);
create index if not exists idx_answers_question on public.evaluation_answers(question_id);
create index if not exists idx_comments_teacher on public.evaluation_comments(teacher_id);

-- ============================================================
-- Row Level Security: deny-all para anon/authenticated.
-- Solo la service-role key (usada del lado servidor) puede leer/escribir.
-- ============================================================
alter table public.teachers            enable row level security;
alter table public.sections            enable row level security;
alter table public.assignments         enable row level security;
alter table public.questions           enable row level security;
alter table public.evaluation_runs     enable row level security;
alter table public.evaluation_answers  enable row level security;
alter table public.evaluation_comments enable row level security;
-- Sin policies para anon/authenticated => deny-all por defecto.

-- ============================================================
-- Preguntas generales precargadas (evaluacion docente secundaria)
-- ============================================================
insert into public.questions (text, order_index)
select * from (values
  ('El/la docente explica los temas de manera clara y facil de entender.', 1),
  ('El/la docente domina el contenido de la materia que imparte.', 2),
  ('El/la docente llega puntual y aprovecha bien el tiempo de clase.', 3),
  ('El/la docente muestra respeto y trato justo hacia todos los estudiantes.', 4),
  ('El/la docente resuelve mis dudas y preguntas de forma satisfactoria.', 5),
  ('El/la docente utiliza ejemplos y actividades que facilitan el aprendizaje.', 6),
  ('El/la docente mantiene el orden y un buen ambiente dentro del salon de clases.', 7),
  ('El/la docente revisa y retroalimenta tareas y evaluaciones a tiempo.', 8),
  ('El/la docente motiva mi interes y participacion en la clase.', 9),
  ('En general, estoy satisfecho(a) con el desempeno de este/a docente.', 10)
) as v(text, order_index)
where not exists (select 1 from public.questions);

-- ============================================================
-- PASOS MANUALES ADICIONALES (una sola vez, en el dashboard de Supabase):
--
-- 1. Storage > New bucket > nombre "teacher-photos" > Public bucket: ON
-- 2. Authentication > Users > Add user > crear la cuenta admin
--    (email/password) que usara /evaluacion-docente-admin/login
-- ============================================================
