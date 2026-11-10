-- ============================================================================
-- Ghana Hospital Appointment System
-- Database Roles, Row-Level Security (RLS) & Audit Policies
-- ============================================================================

-- 1. Database Roles (Least Privilege Separation of Duties)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'migrator') THEN
    CREATE ROLE migrator WITH LOGIN CREATEDB;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'reporter') THEN
    CREATE ROLE reporter WITH LOGIN;
  END IF;
END $$;

-- Table ownership: migrator owns schema; app_user has CRUD on tables except audit_log
GRANT USAGE ON SCHEMA public TO app_user, reporter;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Strictly REVOKE UPDATE and DELETE on audit_log from app_user (Append-only)
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM app_user;
GRANT INSERT, SELECT ON audit_log TO app_user;

-- 2. Row-Level Security (RLS) Policies on Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_own ON appointments;
CREATE POLICY patient_own ON appointments FOR SELECT
  USING (
    patient_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

DROP POLICY IF EXISTS patient_modify_own ON appointments;
CREATE POLICY patient_modify_own ON appointments FOR UPDATE
  USING (
    patient_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

DROP POLICY IF EXISTS staff_facility ON appointments;
CREATE POLICY staff_facility ON appointments FOR ALL
  USING (
    (facility_id = NULLIF(current_setting('app.facility_id', true), '')::uuid
     AND current_setting('app.role', true) IN ('doctor', 'frontdesk', 'facility_admin'))
    OR current_setting('app.role', true) = 'platform_admin'
  );

-- 3. Row-Level Security (RLS) Policies on Patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_self_access ON patients;
CREATE POLICY patient_self_access ON patients FOR ALL
  USING (
    user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.role', true) IN ('doctor', 'frontdesk', 'facility_admin', 'platform_admin')
  );

-- 4. Row-Level Security (RLS) Policies on Notification Preferences
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prefs_self_access ON notification_prefs;
CREATE POLICY prefs_self_access ON notification_prefs FOR ALL
  USING (
    user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.role', true) IN ('facility_admin', 'platform_admin')
  );

-- 5. Row-Level Security (RLS) Policies on Message Delivery Logs
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msg_log_access ON message_log;
CREATE POLICY msg_log_access ON message_log FOR ALL
  USING (
    patient_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.role', true) IN ('facility_admin', 'platform_admin')
  );

-- 6. Reporting Non-PII View for Aggregate Operational Metrics
CREATE OR REPLACE VIEW view_operational_metrics AS
SELECT 
  f.id AS facility_id,
  f.name AS facility_name,
  f.region,
  COUNT(a.id) AS total_appointments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
  ROUND(
    (COUNT(CASE WHEN a.status = 'no_show' THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 
    2
  ) AS no_show_rate_percent,
  COUNT(CASE WHEN a.booked_by_role = 'patient' THEN 1 END) AS self_booked_count,
  ROUND(
    (COUNT(CASE WHEN a.booked_by_role = 'patient' THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100,
    2
  ) AS self_booking_share_percent
FROM facilities f
LEFT JOIN appointments a ON a.facility_id = f.id
GROUP BY f.id, f.name, f.region;

GRANT SELECT ON view_operational_metrics TO reporter;

