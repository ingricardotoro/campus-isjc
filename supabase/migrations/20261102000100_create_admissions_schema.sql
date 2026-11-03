-- Admissions module: tables, foreign keys, constraints, and indexes.
--
-- Additive only. Every object carries the admissions_ prefix so it cannot
-- collide with existing tables in public. RLS, grants, triggers, and the public
-- registration function live in the security migration.
--
-- Supabase default privileges grant broad access to anon and authenticated on
-- new objects in public. The security migration revokes them object by object;
-- nothing in the module is reachable until that migration has run.

-- ---------------------------------------------------------------------------
-- Normalization
-- ---------------------------------------------------------------------------

-- Canonical phone: digits only, without an international 00 prefix. Eight-digit
-- numbers are treated as local Honduran numbers and get country code 504, so
-- "9999-0000" and "+504 9999 0000" resolve to the same value. Returns NULL when
-- no digits remain.
create function public.admissions_normalize_phone(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  with digits as (
    select regexp_replace(
             regexp_replace(coalesce(raw, ''), '\D', '', 'g'),
             '^00', ''
           ) as value
  )
  select case
           when value = '' then null
           when length(value) = 8 then '504' || value
           else value
         end
  from digits
$$;

-- Canonical email: trimmed and lower-cased. Returns NULL when empty.
create function public.admissions_normalize_email(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(lower(btrim(coalesce(raw, ''))), '')
$$;

-- Canonical free-text comparison key: trimmed, lower-cased, single spaces.
create function public.admissions_normalize_name(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(lower(regexp_replace(btrim(coalesce(raw, '')), '\s+', ' ', 'g')), '')
$$;

-- ---------------------------------------------------------------------------
-- Administrative profiles
-- ---------------------------------------------------------------------------

-- Staff are deactivated, never deleted: authorship columns keep referencing
-- them, and deleting the auth user is refused while the profile exists.
create table public.admissions_profiles (
  id         uuid primary key references auth.users (id),
  full_name  text not null check (btrim(full_name) <> ''),
  role       text not null check (
               role in ('admin', 'admissions_manager', 'admissions_agent', 'admissions_viewer')
             ),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogs
-- ---------------------------------------------------------------------------

create table public.admissions_academic_years (
  id                uuid primary key default gen_random_uuid(),
  year              integer not null unique check (year between 2000 and 2100),
  name              text not null check (btrim(name) <> ''),
  starts_on         date,
  ends_on           date,
  is_active         boolean not null default true,
  is_open_for_intake boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint admissions_academic_years_dates_check
    check (starts_on is null or ends_on is null or ends_on > starts_on)
);

create table public.admissions_grades (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (btrim(code) <> ''),
  name       text not null check (btrim(name) <> ''),
  level      text not null check (btrim(level) <> ''),
  sort_order integer not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admissions_modalities (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (btrim(code) <> ''),
  name       text not null check (btrim(name) <> ''),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A row means the grade offers the modality. Not every modality applies to
-- every grade, so absence is meaningful.
create table public.admissions_grade_modalities (
  grade_id    uuid not null references public.admissions_grades (id),
  modality_id uuid not null references public.admissions_modalities (id),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (grade_id, modality_id)
);

create index admissions_grade_modalities_modality_idx
  on public.admissions_grade_modalities (modality_id);

create table public.admissions_statuses (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (btrim(code) <> ''),
  name        text not null check (btrim(name) <> ''),
  is_terminal boolean not null default false,
  sort_order  integer not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.admissions_sources (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (btrim(code) <> ''),
  name       text not null check (btrim(name) <> ''),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admissions_campaigns (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (btrim(code) <> ''),
  name       text not null check (btrim(name) <> ''),
  starts_on  date,
  ends_on    date,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admissions_campaigns_dates_check
    check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

-- ---------------------------------------------------------------------------
-- Guardians
-- ---------------------------------------------------------------------------

-- Phone and email are deliberately not unique. Families share them, so they are
-- imperfect identifiers (spec 6.1). The normalized columns drive matching; the
-- registration function serializes matching with advisory locks.
create table public.admissions_guardians (
  id                       uuid primary key default gen_random_uuid(),
  full_name                text not null check (btrim(full_name) <> ''),
  phone                    text,
  email                    text,
  phone_normalized         text generated always as (public.admissions_normalize_phone(phone)) stored,
  email_normalized         text generated always as (public.admissions_normalize_email(email)) stored,
  preferred_contact_method text check (
                             preferred_contact_method in ('phone', 'whatsapp', 'email')
                           ),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint admissions_guardians_contact_required_check
    check (phone_normalized is not null or email_normalized is not null),
  constraint admissions_guardians_phone_format_check
    check (phone_normalized is null or phone_normalized ~ '^[0-9]{8,15}$'),
  constraint admissions_guardians_email_format_check
    check (email_normalized is null or email_normalized ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create index admissions_guardians_phone_normalized_idx
  on public.admissions_guardians (phone_normalized)
  where phone_normalized is not null;

create index admissions_guardians_email_normalized_idx
  on public.admissions_guardians (email_normalized)
  where email_normalized is not null;

-- ---------------------------------------------------------------------------
-- Prospects
-- ---------------------------------------------------------------------------

-- Foreign keys to status history and follow-up tables block deletion, so
-- non-converted prospects stay available for historical analysis.
create table public.admissions_prospects (
  id                     uuid primary key default gen_random_uuid(),
  guardian_id            uuid not null references public.admissions_guardians (id),
  student_name           text,
  student_name_normalized text generated always as (public.admissions_normalize_name(student_name)) stored,
  academic_year_id       uuid not null references public.admissions_academic_years (id),
  grade_id               uuid not null references public.admissions_grades (id),
  modality_id            uuid references public.admissions_modalities (id),
  status_id              uuid not null references public.admissions_statuses (id),
  source_id              uuid not null references public.admissions_sources (id),
  campaign_id            uuid references public.admissions_campaigns (id),
  assigned_to            uuid references public.admissions_profiles (id) on delete set null,
  consent_to_contact     boolean not null default false,
  consent_at             timestamptz,
  privacy_notice_version text,
  wants_visit            boolean not null default false,
  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  landing_page           text,
  internal_notes         text,
  last_contact_at        timestamptz,
  closed_at              timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- MATCH SIMPLE: a NULL modality skips the check, as "not applicable" requires.
  constraint admissions_prospects_grade_modality_fkey
    foreign key (grade_id, modality_id)
    references public.admissions_grade_modalities (grade_id, modality_id),
  constraint admissions_prospects_consent_check
    check (
      not consent_to_contact
      or (consent_at is not null and privacy_notice_version is not null)
    )
);

-- One opportunity per guardian, student, year, and grade. A missing student name
-- counts as one student; staff can name twins apart from the panel.
create unique index admissions_prospects_opportunity_key
  on public.admissions_prospects (
    guardian_id,
    academic_year_id,
    grade_id,
    coalesce(student_name_normalized, '')
  );

create index admissions_prospects_academic_year_idx on public.admissions_prospects (academic_year_id);
create index admissions_prospects_grade_idx on public.admissions_prospects (grade_id);
create index admissions_prospects_modality_idx on public.admissions_prospects (modality_id);
create index admissions_prospects_grade_modality_idx on public.admissions_prospects (grade_id, modality_id);
create index admissions_prospects_status_idx on public.admissions_prospects (status_id);
create index admissions_prospects_source_idx on public.admissions_prospects (source_id);
create index admissions_prospects_campaign_idx on public.admissions_prospects (campaign_id);
create index admissions_prospects_assigned_to_idx on public.admissions_prospects (assigned_to);
create index admissions_prospects_created_at_idx on public.admissions_prospects (created_at);

-- ---------------------------------------------------------------------------
-- Follow-up
-- ---------------------------------------------------------------------------

-- performed_by is NULL for system events such as public registration notes.
create table public.admissions_activities (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references public.admissions_prospects (id),
  performed_by  uuid references public.admissions_profiles (id),
  activity_type text not null check (
                  activity_type in ('call', 'whatsapp', 'email', 'in_person', 'visit', 'system', 'other')
                ),
  description   text not null check (btrim(description) <> ''),
  outcome       text,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index admissions_activities_prospect_idx
  on public.admissions_activities (prospect_id, occurred_at desc);
create index admissions_activities_performed_by_idx
  on public.admissions_activities (performed_by);

create table public.admissions_tasks (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.admissions_prospects (id),
  assigned_to  uuid references public.admissions_profiles (id) on delete set null,
  created_by   uuid references public.admissions_profiles (id),
  title        text not null check (btrim(title) <> ''),
  description  text,
  due_at       timestamptz,
  status       text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint admissions_tasks_completed_at_check
    check (status = 'completed' or completed_at is null)
);

create index admissions_tasks_prospect_idx on public.admissions_tasks (prospect_id);
create index admissions_tasks_assigned_status_due_idx
  on public.admissions_tasks (assigned_to, status, due_at);
create index admissions_tasks_created_by_idx on public.admissions_tasks (created_by);

create table public.admissions_visits (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.admissions_prospects (id),
  scheduled_at timestamptz not null,
  status       text not null default 'scheduled' check (
                 status in ('scheduled', 'completed', 'cancelled', 'no_show')
               ),
  notes        text,
  created_by   uuid references public.admissions_profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index admissions_visits_prospect_idx on public.admissions_visits (prospect_id);
create index admissions_visits_scheduled_at_idx on public.admissions_visits (scheduled_at);
create index admissions_visits_created_by_idx on public.admissions_visits (created_by);

-- Written only by the trigger on admissions_prospects. changed_by is NULL for
-- changes that have no authenticated staff member, such as public registration.
create table public.admissions_status_history (
  id                 uuid primary key default gen_random_uuid(),
  prospect_id        uuid not null references public.admissions_prospects (id),
  previous_status_id uuid references public.admissions_statuses (id),
  new_status_id      uuid not null references public.admissions_statuses (id),
  changed_by         uuid references public.admissions_profiles (id),
  notes              text,
  changed_at         timestamptz not null default now()
);

create index admissions_status_history_prospect_idx
  on public.admissions_status_history (prospect_id, changed_at desc);
create index admissions_status_history_previous_status_idx
  on public.admissions_status_history (previous_status_id);
create index admissions_status_history_new_status_idx
  on public.admissions_status_history (new_status_id);
create index admissions_status_history_changed_by_idx
  on public.admissions_status_history (changed_by);
