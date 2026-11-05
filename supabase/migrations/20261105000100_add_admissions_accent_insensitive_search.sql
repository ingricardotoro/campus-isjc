-- Admissions module: accent-insensitive name search for the admin panel.
--
-- Additive only. The panel filters names with ilike, which ignores case but not
-- accents, so "maria" missed "María". This adds folded search columns that the
-- panel filters instead.
--
-- Deduplication is untouched: student_name_normalized, the opportunity key, and
-- the public registration matching keep comparing names with their accents.
-- Folding them would merge siblings such as "José" and "Jose" into one prospect.

-- ---------------------------------------------------------------------------
-- unaccent
-- ---------------------------------------------------------------------------

-- Supabase keeps extensions in the extensions schema. If unaccent was already
-- installed elsewhere, IF NOT EXISTS would silently skip it and the function below
-- would fail later, so stop here with a clear message instead.
create extension if not exists unaccent with schema extensions;

do $$
begin
  if (select extnamespace::regnamespace::text from pg_extension where extname = 'unaccent')
     is distinct from 'extensions' then
    raise exception 'unaccent must be installed in the extensions schema';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Folding
-- ---------------------------------------------------------------------------

-- Search key for a name: accents removed, then trimmed, lower-cased, and with
-- single spaces, like admissions_normalize_name. For Spanish this drops the acute
-- accent and the dieresis and folds ñ to n, which matches the TypeScript folding
-- in src/lib/admissions/admin-queries.ts (NFD, combining marks removed).
--
-- unaccent() is only STABLE because it reads its dictionary through search_path.
-- Naming the dictionary explicitly makes the result depend on the input alone, so
-- the wrapper can be IMMUTABLE and back a generated column.
create function public.admissions_fold_name(raw text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select nullif(
           lower(regexp_replace(
             btrim(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(raw, ''))),
             '\s+', ' ', 'g')),
           '')
$$;

-- PostgreSQL checks EXECUTE on a generated column's function for whoever writes
-- the row: staff (authenticated) and the public registration (service_role).
revoke all on function public.admissions_fold_name(text) from public, anon, authenticated, service_role;
grant execute on function public.admissions_fold_name(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Search columns
-- ---------------------------------------------------------------------------

-- Adding a stored generated column computes it for every existing row, so no
-- separate backfill is needed.
--
-- Privileges: authenticated and service_role hold table-level SELECT on both
-- tables, so they read the new columns; anon holds nothing. Client INSERT and
-- UPDATE grants are column lists that do not name these columns, and nobody can
-- write a generated column anyway, so no grant is added.
alter table public.admissions_prospects
  add column student_name_search text
  generated always as (public.admissions_fold_name(student_name)) stored;

alter table public.admissions_guardians
  add column full_name_search text
  generated always as (public.admissions_fold_name(full_name)) stored;
