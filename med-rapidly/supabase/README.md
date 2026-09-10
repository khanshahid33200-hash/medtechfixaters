# Med Rapidly - Database Setup Guide

This directory contains all SQL files needed to set up the complete Med Rapidly database from scratch.

## 📋 Files Overview

### 1. **01_init_database.sql** - Core Database Schema
Creates all tables with proper relationships, constraints, and indexes.

**Tables Created:**
- `hospitals` - Hospital organizations
- `departments` - Medical departments
- `users` - Doctors, admins, reception staff
- `intake_links` - QR code tokens
- `patients` - Patient records
- `doctor_availability` - Doctor scheduling
- `appointments` - Queue management
- `queue_counters` - Per-doctor queue tracking
- `token_counters` - Per-hospital token tracking
- `consultations` - Medical consultations
- `prescription_items` - Prescription medications
- `prescription_pdfs` - Prescription documents
- `prescription_access` - OTP-protected prescription downloads
- `voice_calls` - Call recordings and transcripts
- `audit_log` - Activity audit trail

### 2. **02_seed_data.sql** - Sample Data
Populates the database with sample hospitals, doctors, patients, and appointments for testing.

**Sample Data Includes:**
- 3 sample hospitals (Apollo, Max Healthcare, Fortis)
- 5 departments
- 8 users (1 super admin, 2 hospital admins, 5 doctors, 2 reception staff)
- 5 sample patients
- 5 sample appointments
- Sample consultations and prescriptions

### 3. **03_auth_setup.sql** - Authentication & User Management
Creates functions for authentication, user management, and security.

**Functions Included:**
- `create_super_admin()` - Create super admin users
- `create_hospital_admin()` - Create hospital administrators
- `create_doctor()` - Register doctors with full details
- `create_reception_staff()` - Create reception staff
- `verify_user_credentials()` - Authenticate users
- `get_user_by_email()` - Lookup users
- `update_last_login()` - Track login activity
- `update_user_password()` - Password management
- `log_audit_entry()` - Audit trail logging
- Plus RLS policy examples

### 4. **04_storage_and_utilities.sql** - Storage & Helper Functions
Creates utility functions for common operations and storage bucket setup.

**Functions Included:**
- `create_hospital()` - Create new hospital with auto-generated QR token
- `create_department()` - Create department
- `register_patient()` - Register or update patient
- `get_available_doctors()` - List available doctors for a date
- `create_appointment()` - Create queue appointment
- `get_appointment_queue_status()` - Track appointment position
- `update_appointment_status()` - Update appointment state
- `get_hospital_statistics()` - Generate daily statistics
- `archive_old_appointments()` - Data archival
- `reset_daily_counters()` - Daily maintenance

**Views Created:**
- `active_doctors_with_load` - Doctor workload tracking
- `hospital_daily_statistics` - Daily performance metrics

## 🚀 Setup Instructions

### Option A: Using Supabase Dashboard

1. **Navigate to SQL Editor**
   - Go to your Supabase project
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Execute Files in Order**
   ```
   1. Copy content of 01_init_database.sql → Run
   2. Copy content of 02_seed_data.sql → Run
   3. Copy content of 03_auth_setup.sql → Run
   4. Copy content of 04_storage_and_utilities.sql → Run
   ```

3. **Verify Setup**
   ```sql
   -- Check all tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;

   -- Should return 15 tables
   ```

### Option B: Using psql CLI

```bash
# Connect to PostgreSQL
psql -h your-host -U postgres -d your-database

# Execute files in order
\i /path/to/01_init_database.sql
\i /path/to/02_seed_data.sql
\i /path/to/03_auth_setup.sql
\i /path/to/04_storage_and_utilities.sql
```

### Option C: Using Drizzle ORM (Recommended for Development)

If already using Drizzle ORM, the schema is auto-generated. Just need seed data:

```bash
npm run drizzle:push
# Then import seed data separately
```

## 🔧 Configuration

### Environment Variables
Set in your `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/med_rapidly
DIRECT_URL=postgresql://user:password@localhost:5432/med_rapidly

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# AWS S3 (for PDFs)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=med-rapidly-prescriptions
```

## 📊 Database Relationships

```
Hospitals
├── Departments
│   └── Users (Doctors)
├── Users (Admins, Reception)
├── Patients
│   └── Appointments
│       ├── Consultations
│       │   ├── Prescription Items
│       │   └── Prescription PDFs
│       │       └── Prescription Access
│       └── Voice Calls
├── Intake Links (QR Codes)
├── Queue Counters
├── Token Counters
└── Audit Log
```

## 🔐 Security Features

### 1. Password Hashing
Use bcryptjs in application:
```typescript
import bcrypt from 'bcryptjs';

const hash = bcrypt.hashSync(password, 10);
```

### 2. JWT Authentication
Token payload includes:
```typescript
{
  userId: string;
  hospitalId?: string;
  email: string;
  role: "doctor" | "hospital_admin" | "reception" | "super_admin";
  iat: number;
  exp: number;
}
```

### 3. Row Level Security (Optional)
Uncomment RLS policies in `03_auth_setup.sql` for Supabase.

### 4. Audit Logging
All changes are logged to `audit_log` table with:
- User ID
- Action type
- Resource affected
- IP address
- User agent

## 📱 Storage Buckets (Supabase)

Create these buckets in Supabase Dashboard:

1. **hospital-logos** (Public)
   - Path: `/hospital-logos/{hospital_id}/`
   - For hospital branding images

2. **prescription-pdfs** (Private)
   - Path: `/prescriptions/{consultation_id}/`
   - Secure prescription PDFs

3. **doctor-signatures** (Private)
   - Path: `/signatures/{user_id}/`
   - Digital signatures

4. **patient-documents** (Private)
   - Path: `/patients/{patient_id}/`
   - Medical records

5. **voice-recordings** (Private)
   - Path: `/recordings/{call_id}/`
   - Call recordings

## 🧪 Testing

### Test Data Access
```sql
-- Get all users
SELECT email, full_name, role, status FROM users;

-- Get today's appointments
SELECT appt_token, status, queue_number 
FROM appointments 
WHERE appt_date = CURRENT_DATE;

-- Get hospital statistics
SELECT * FROM hospital_daily_statistics;

-- Check available doctors
SELECT * FROM active_doctors_with_load;
```

### Create Test Appointment
```sql
-- Use existing test data
SELECT create_appointment(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- Apollo Hospital
    '950e8400-e29b-41d4-a716-446655440001'::uuid,  -- Test Patient
    '750e8400-e29b-41d4-a716-446655440004'::uuid,  -- Dr. Rajeev
    CURRENT_DATE,
    'CARD',
    'Chest pain',
    'None',
    true,
    'qr'
);
```

## 🔄 Maintenance

### Daily Tasks
```sql
-- Check daily statistics
SELECT * FROM hospital_daily_statistics;

-- Reset counters at midnight (automated via triggers)
-- Counters auto-reset when creating new daily appointments
```

### Weekly Tasks
```sql
-- Backup audit logs
SELECT * FROM audit_log WHERE created_at > CURRENT_DATE - INTERVAL '7 days';

-- Check active user sessions
SELECT id, email, last_login_at FROM users WHERE status = 'active' ORDER BY last_login_at DESC;
```

### Monthly Tasks
```sql
-- Archive old completed appointments
SELECT archive_old_appointments(90);

-- Cleanup old counters
SELECT reset_daily_counters();
```

## ⚠️ Troubleshooting

### Issue: "Database URL not set"
**Solution:** Ensure `DATABASE_URL` is in your `.env` file

### Issue: "Unique constraint violation"
**Solution:** Check that email addresses are unique when creating users

### Issue: "Foreign key constraint failed"
**Solution:** Ensure hospital/department/doctor exist before creating related records

### Issue: "RLS policies blocking access"
**Solution:** Check that user has proper role and hospital_id is set correctly

## 📝 Common Queries

### Get Hospital Queue Status
```sql
SELECT 
    a.queue_number, 
    p.name, 
    a.status, 
    u.full_name as doctor
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
WHERE a.hospital_id = 'HOSPITAL_ID' AND a.appt_date = CURRENT_DATE
ORDER BY a.queue_number;
```

### Get Doctor's Patient History
```sql
SELECT 
    p.name, 
    c.diagnosis, 
    c.created_at,
    STRING_AGG(pi.medicine_name, ', ') as medicines
FROM consultations c
JOIN appointments a ON c.appointment_id = a.id
JOIN patients p ON a.patient_id = p.id
LEFT JOIN prescription_items pi ON c.id = pi.consultation_id
WHERE a.doctor_id = 'DOCTOR_ID'
GROUP BY p.id, p.name, c.diagnosis, c.created_at
ORDER BY c.created_at DESC;
```

### Get Patient Appointment History
```sql
SELECT 
    a.appt_token, 
    a.appt_date, 
    u.full_name as doctor, 
    d.name as department, 
    a.status
FROM appointments a
JOIN users u ON a.doctor_id = u.id
JOIN departments d ON u.department_id = d.id
WHERE a.patient_id = 'PATIENT_ID'
ORDER BY a.appt_date DESC;
```

## 🆘 Support & Documentation

- **Database Schema:** See schema.ts in lib/db/
- **API Documentation:** Check API endpoints in app/api/
- **Authentication:** See lib/auth.ts
- **Drizzle ORM Docs:** https://orm.drizzle.team/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

## ✅ Verification Checklist

After setup, verify:

- [ ] All 15 tables created
- [ ] Foreign key relationships working
- [ ] Indexes created for performance
- [ ] Triggers for timestamp updates active
- [ ] Sample data inserted successfully
- [ ] Authentication functions callable
- [ ] Utility functions accessible
- [ ] Storage buckets configured
- [ ] Environment variables set
- [ ] JWT secret configured

## 🚀 Next Steps

1. **Connect Application**
   ```bash
   npm install
   npm run dev
   ```

2. **Test Authentication**
   - Login with test user: admin@apollo.com
   - Verify JWT token generation

3. **Test Queue Operations**
   - Create appointment via QR scan simulation
   - Verify queue tracking

4. **Set up Monitoring**
   - Configure audit log monitoring
   - Set up database backups

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review PostgreSQL error logs
3. Verify all files executed in correct order
4. Ensure environment variables are set

---

**Database Version:** 1.0
**Last Updated:** 2026-09-08
**PostgreSQL Version:** 12+
**Compatible with:** Supabase, RDS, Self-hosted PostgreSQL
