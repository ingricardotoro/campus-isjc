-- Rollback for admissions Delivery 1 (migrations 20261102000100..20261102000300).
-- Removes only objects prefixed `admissions_` in schema public. Existing tables are untouched.
-- WARNING: deletes all admissions data. Run only to revert a failed or unwanted deployment.
-- Kept outside supabase/migrations so the CLI never applies it.

begin;

drop table if exists
  public.admissions_status_history,
  public.admissions_visits,
  public.admissions_tasks,
  public.admissions_activities,
  public.admissions_prospects,
  public.admissions_guardians,
  public.admissions_campaigns,
  public.admissions_sources,
  public.admissions_statuses,
  public.admissions_grade_modalities,
  public.admissions_modalities,
  public.admissions_grades,
  public.admissions_academic_years,
  public.admissions_profiles
cascade;

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'admissions\_%'
  loop
    execute format('drop function if exists %s cascade', fn);
  end loop;
end
$$;

commit;
