-- =====================================================
-- Run this ONCE as a Postgres superuser, e.g.:
--   psql -U postgres -f 01_create_database.sql
-- (Postgres cannot create a database from inside a
--  transaction/another DB, so this stays a separate step.)
-- =====================================================

CREATE DATABASE electricity_billing;
