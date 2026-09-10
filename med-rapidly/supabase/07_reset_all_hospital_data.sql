-- ============================================================================
-- Med Rapidly - COMPLETE DATA RESET
-- Deletes: All hospitals, departments, doctors, patients, appointments
-- KEEPS: Super Admin account (shahidbcsm@gmail.com) INTACT
-- ============================================================================

-- ⚠️  WARNING: This will permanently delete all hospital data!
-- Make sure you have backups before running this.

-- ============================================================================
-- Delete in correct order (reverse of creation order)
-- No need to disable triggers - just delete in correct dependency order
-- ============================================================================

-- 1. Delete audit logs
DELETE FROM audit_log WHERE user_id IS NOT NULL OR hospital_id IS NOT NULL;

-- 2. Delete prescription access records
DELETE FROM prescription_access;

-- 3. Delete prescription PDFs
DELETE FROM prescription_pdfs;

-- 4. Delete prescription items
DELETE FROM prescription_items;

-- 5. Delete consultations
DELETE FROM consultations;

-- 6. Delete voice calls
DELETE FROM voice_calls;

-- 7. Delete appointments
DELETE FROM appointments;

-- 8. Delete queue counters
DELETE FROM queue_counters;

-- 9. Delete token counters
DELETE FROM token_counters;

-- 10. Delete doctor availability
DELETE FROM doctor_availability;

-- 11. Delete users (but NOT super admin)
-- Keep: super admin user
DELETE FROM users
WHERE (role != 'super_admin' OR email != 'shahidbcsm@gmail.com')
  AND hospital_id IS NOT NULL;

-- Also delete any non-super-admin super_admins or non-shahid users
DELETE FROM users
WHERE email != 'shahidbcsm@gmail.com';

-- 12. Delete patients
DELETE FROM patients;

-- 13. Delete intake links
DELETE FROM intake_links;

-- 14. Delete departments
DELETE FROM departments;

-- 15. Delete hospitals
DELETE FROM hospitals;

-- ============================================================================
-- STEP 4: Verify cleanup
-- ============================================================================

-- Check super admin still exists
SELECT
    '✅ SUPER ADMIN' as status,
    id,
    email,
    full_name,
    role
FROM users
WHERE email = 'shahidbcsm@gmail.com';

-- Check all data is deleted
SELECT
    (SELECT COUNT(*) FROM hospitals) as hospitals_count,
    (SELECT COUNT(*) FROM departments) as departments_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM patients) as patients_count,
    (SELECT COUNT(*) FROM appointments) as appointments_count,
    (SELECT COUNT(*) FROM consultations) as consultations_count;

-- ============================================================================
-- Expected Results:
-- Super Admin row should show: shahidbcsm@gmail.com | super_admin | active
-- All counts should be: 0, 0, 1 (just super admin), 0, 0, 0
-- ============================================================================

-- ============================================================================
-- VERIFICATION COMPLETE - Database is now clean!
-- ============================================================================
