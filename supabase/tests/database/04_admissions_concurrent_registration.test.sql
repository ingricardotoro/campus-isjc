-- Real concurrency through dblink: each connection is its own session, so these
-- registrations commit outside the test transaction. Rows are identified by
-- dedicated phone numbers and removed before and after the assertions.
--
-- The connection targets the same local Docker database this test runs on.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

select plan(14);

-- dblink refuses a non-superuser connection that did not authenticate with a
-- password, and the local image trusts 127.0.0.1. The container's own network
-- address, the one this test session arrived on, requires the password.
create function pg_temp.conn() returns text language sql as
$$ select format('host=%s port=5432 dbname=postgres user=postgres password=postgres', host(inet_server_addr())) $$;

create function pg_temp.cleanup() returns void language plpgsql as $$
begin
  perform dblink_exec(pg_temp.conn(), $sql$
    delete from public.admissions_activities a
      using public.admissions_prospects p, public.admissions_guardians g
      where a.prospect_id = p.id and p.guardian_id = g.id
        and g.phone_normalized in ('50488880001', '50488880002');
    delete from public.admissions_status_history h
      using public.admissions_prospects p, public.admissions_guardians g
      where h.prospect_id = p.id and p.guardian_id = g.id
        and g.phone_normalized in ('50488880001', '50488880002');
    delete from public.admissions_prospects p
      using public.admissions_guardians g
      where p.guardian_id = g.id
        and g.phone_normalized in ('50488880001', '50488880002');
    delete from public.admissions_guardians
      where phone_normalized in ('50488880001', '50488880002');
  $sql$);
end $$;

create function pg_temp.register_sql(phone text, email text default null) returns text language sql as $$
  select format(
    $f$ select prospect_id, guardian_id, is_new_prospect
        from public.admissions_register_public_interest(
          'Concurrente', %L, %L, 'whatsapp', 'Estudiante',
          (select id from public.admissions_academic_years where year = 2027),
          (select id from public.admissions_grades where code = 'GRADE_01'),
          null, true, 'v1', false, 'WEB_FORM', null, null, null, null, null) $f$,
    phone, email)
$$;

-- Polls instead of sleeping a fixed time: the session has to reach the lock.
create function pg_temp.waits_on_advisory_lock(backend int) returns boolean language plpgsql as $$
begin
  for attempt in 1..100 loop
    perform pg_stat_clear_snapshot();
    if exists (select 1 from pg_stat_activity a
               where a.pid = backend and a.wait_event_type = 'Lock' and a.wait_event = 'advisory') then
      return true;
    end if;
    perform pg_sleep(0.05);
  end loop;
  return false;
end $$;

select pg_temp.cleanup();

-- ---------------------------------------------------------------------------
-- Forced interleaving: B must wait for A, then reuse what A committed
-- ---------------------------------------------------------------------------
select dblink_connect('session_a', pg_temp.conn());
select dblink_connect('session_b', pg_temp.conn());
select dblink_exec('session_a', 'set role service_role');
select dblink_exec('session_b', 'set role service_role');

create temporary table b_backend on commit drop as
  select * from dblink('session_b', 'select pg_backend_pid()') as t(pid int);

select dblink_exec('session_a', 'begin');
create temporary table result_a on commit drop as
  select * from dblink('session_a', pg_temp.register_sql('88880001'))
    as t(prospect_id uuid, guardian_id uuid, is_new_prospect boolean);

select dblink_send_query('session_b', pg_temp.register_sql('8888-0001'));

select ok(pg_temp.waits_on_advisory_lock((select pid from b_backend)),
  'a concurrent registration with the same contact waits for the first one');

select dblink_exec('session_a', 'commit');

create temporary table result_b on commit drop as
  select * from dblink_get_result('session_b')
    as t(prospect_id uuid, guardian_id uuid, is_new_prospect boolean);

select dblink_disconnect('session_a');
select dblink_disconnect('session_b');

select is((select is_new_prospect from result_a), true, 'the first session creates the prospect');
select is((select is_new_prospect from result_b), false, 'the waiting session finds the prospect');
select is((select guardian_id from result_b), (select guardian_id from result_a),
  'both sessions resolve the same guardian');
select is((select prospect_id from result_b), (select prospect_id from result_a),
  'both sessions resolve the same prospect');
select is(
  (select count(*)::int from public.admissions_guardians where phone_normalized = '50488880001'),
  1, 'forced interleaving leaves one guardian');
select is(
  (select count(*)::int from public.admissions_prospects p join result_a r on r.guardian_id = p.guardian_id),
  1, 'forced interleaving leaves one prospect');
select is(
  (select count(*)::int from public.admissions_status_history h join result_a r on r.prospect_id = h.prospect_id),
  1, 'forced interleaving leaves one initial status');

-- ---------------------------------------------------------------------------
-- Burst: eight sessions submit together, using both matching keys
-- ---------------------------------------------------------------------------
create temporary table burst_results (prospect_id uuid, guardian_id uuid, is_new_prospect boolean) on commit drop;

create function pg_temp.run_burst(sessions int) returns void language plpgsql as $$
begin
  for i in 1..sessions loop
    perform dblink_connect('burst_' || i, pg_temp.conn());
    perform dblink_exec('burst_' || i, 'set role service_role');
  end loop;

  for i in 1..sessions loop
    perform dblink_send_query('burst_' || i, pg_temp.register_sql('88880002', 'BURST@example.com'));
  end loop;

  -- dblink_get_result raises on a remote error, so a deadlock or a unique
  -- violation in any session fails this test run.
  for i in 1..sessions loop
    insert into burst_results
      select * from dblink_get_result('burst_' || i)
        as t(prospect_id uuid, guardian_id uuid, is_new_prospect boolean);
    perform dblink_disconnect('burst_' || i);
  end loop;
end $$;

select lives_ok('select pg_temp.run_burst(8)', 'eight simultaneous registrations finish without errors');

select is((select count(*)::int from burst_results), 8, 'every session returns a result');
select is((select count(distinct prospect_id)::int from burst_results), 1, 'all sessions resolve one prospect');
select is((select count(*)::int from burst_results where is_new_prospect), 1, 'exactly one session creates it');
select is(
  (select count(*)::int from public.admissions_guardians where phone_normalized = '50488880002'),
  1, 'the burst leaves one guardian');

select pg_temp.cleanup();

select is(
  (select count(*)::int from public.admissions_guardians
   where phone_normalized in ('50488880001', '50488880002')),
  0, 'committed test rows are removed');

select * from finish();
rollback;
