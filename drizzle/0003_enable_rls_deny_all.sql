-- SECURITY FIX (2026-07-19): close the Supabase Data API exposure.
--
-- The public anon key (shipped in the browser bundle) could read AND write
-- every row of every table via PostgREST — names, birth dates/times, exact GPS
-- coordinates, everything — because RLS was off on all public tables and the
-- app-layer owner_id filter does nothing against the raw REST endpoint.
--
-- Enabling RLS with NO policies = deny-all for the `anon` and `authenticated`
-- PostgREST roles. The app is UNAFFECTED: Drizzle connects as `postgres`
-- (rolbypassrls = true, and table owner), which bypasses RLS entirely. NOT
-- forced — forcing would subject the owner to policies too and break the app.
--
-- Reversible: ALTER TABLE public.<t> DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
