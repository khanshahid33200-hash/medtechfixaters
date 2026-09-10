# Med Rapidly - SQL Quick Reference

## 🚀 Most Common Operations

### Creating Users

#### Create Super Admin
```sql
-- First, hash password in app using bcryptjs, then:
INSERT INTO users (email, password_hash, full_name, phone, role, status)
VALUES (
    'admin@medrapidly.com',
    '$2a$10$...',  -- bcrypt hash
    'System Administrator',
    '+91-9000-0000',
    'super_admin',
    'active'
);
```

#### Create Hospital Admin
```sql
-- Use the function:
SELECT create_hospital_admin(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    'admin@hospital.com',
    '$2a$10$...',  -- password hash
    'Hospital Admin Name',
    '+91-9111-1111'
);
```

#### Create Doctor
```sql
SELECT create_doctor(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    'dr.name@hospital.com',
    '$2a$10$...',  -- password hash
    'Dr. Full Name',
    '+91-9222-2222',
    '650e8400-e29b-41d4-a716-446655440001'::uuid,  -- department_id
    'MBBS, MD',
    'MCI2020001',
    'Cardiology',
    500.00
);
```

### Hospital Setup

#### Create New Hospital
```sql
SELECT * FROM create_hospital(
    'New Hospital Name',
    '+91-XXXX-XXXXX',
    'Address Here',
    500,  -- daily_token_cap
    7     -- booking_window_days
);
```

#### Create Department
```sql
SELECT create_department(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    'Cardiology',
    'CARD',
    1  -- display_order
);
```

### Patient & Appointment Management

#### Register Patient
```sql
SELECT register_patient(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    'Patient Full Name',
    '+91-9876-5432',
    'patient@email.com',
    45,  -- age
    'Address here'
);
```

#### Create Appointment (QR-based)
```sql
SELECT * FROM create_appointment(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    '950e8400-e29b-41d4-a716-446655440001'::uuid,  -- patient_id
    '750e8400-e29b-41d4-a716-446655440004'::uuid,  -- doctor_id
    CURRENT_DATE,
    'CARD',      -- queue_prefix (department short code)
    'Chest pain',
    'Aspirin 1mg',
    true,        -- consent_given
    'qr'         -- source
);
```

#### Update Appointment Status
```sql
SELECT update_appointment_status(
    'b50e8400-e29b-41d4-a716-446655440001'::uuid,  -- appointment_id
    'in_consult'  -- new status
);

-- Valid statuses: 'waiting', 'in_consult', 'done', 'no_show', 'cancelled'
```

### Viewing Data

#### Get Available Doctors
```sql
SELECT * FROM get_available_doctors(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    CURRENT_DATE
);
```

#### Get Queue Status for Appointment
```sql
SELECT * FROM get_appointment_queue_status(
    'b50e8400-e29b-41d4-a716-446655440001'::uuid
);
```

#### Get Hospital Statistics
```sql
SELECT * FROM get_hospital_statistics(
    '550e8400-e29b-41d4-a716-446655440001'::uuid
);
```

#### View All Doctors by Hospital
```sql
SELECT 
    full_name,
    specialisation,
    department_id,
    consultation_fee,
    status
FROM users
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
    AND role = 'doctor'
ORDER BY full_name;
```

#### View Today's Appointments by Doctor
```sql
SELECT 
    appt_token,
    queue_number,
    p.name as patient_name,
    status,
    created_at
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = '750e8400-e29b-41d4-a716-446655440004'::uuid
    AND a.appt_date = CURRENT_DATE
ORDER BY queue_number;
```

#### View Active Doctors with Load
```sql
SELECT * FROM active_doctors_with_load 
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440001'::uuid;
```

#### View Daily Hospital Statistics
```sql
SELECT * FROM hospital_daily_statistics 
WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid;
```

### Authentication

#### Verify User Credentials
```sql
-- In application (bcryptjs):
const match = bcrypt.compareSync(password, user.password_hash);

-- Or use SQL function:
SELECT * FROM verify_user_credentials(
    'doctor@hospital.com',
    '$2a$10$...'
);
```

#### Get User by Email
```sql
SELECT * FROM get_user_by_email('doctor@hospital.com');
```

#### Get User by ID
```sql
SELECT * FROM get_user_by_id('750e8400-e29b-41d4-a716-446655440004'::uuid);
```

#### Update Last Login
```sql
SELECT update_last_login('750e8400-e29b-41d4-a716-446655440004'::uuid);
```

#### Update User Password
```sql
SELECT update_user_password(
    '750e8400-e29b-41d4-a716-446655440004'::uuid,
    '$2a$10$...'  -- new password hash
);
```

### Audit & Security

#### Log Action
```sql
SELECT log_audit_entry(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- hospital_id
    '750e8400-e29b-41d4-a716-446655440004'::uuid,  -- user_id
    'CREATE',                                        -- action
    'appointment',                                   -- resource_type
    'b50e8400-e29b-41d4-a716-446655440001'::uuid,  -- resource_id
    '{"complaint": "Chest pain"}'::jsonb,          -- changes
    '192.168.1.100',                                -- ip_address
    'Mozilla/5.0...'                                -- user_agent
);
```

#### View Audit Trail
```sql
SELECT 
    user_id,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    created_at
FROM audit_log
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
ORDER BY created_at DESC
LIMIT 50;
```

### Consultations & Prescriptions

#### Create Consultation
```sql
INSERT INTO consultations (
    appointment_id,
    symptoms,
    vitals,
    diagnosis,
    advice,
    follow_up_date,
    private_notes,
    created_by
) VALUES (
    'b50e8400-e29b-41d4-a716-446655440001'::uuid,
    'Fever, cough, body ache',
    '{"temperature": 101.5, "bp": "120/80", "heart_rate": 88}'::jsonb,
    'Viral fever',
    'Rest, hydration, paracetamol',
    CURRENT_DATE + INTERVAL '3 days',
    'Patient appears anxious',
    '750e8400-e29b-41d4-a716-446655440004'::uuid
)
RETURNING id;
```

#### Add Prescription Item
```sql
INSERT INTO prescription_items (
    consultation_id,
    medicine_name,
    dosage,
    duration,
    frequency,
    instructions
) VALUES (
    'e50e8400-e29b-41d4-a716-446655440001'::uuid,
    'Paracetamol',
    '500mg',
    '3 days',
    'Twice daily',
    'After meals with water'
);
```

#### Get Patient Medical History
```sql
SELECT 
    a.appt_date,
    u.full_name as doctor,
    d.name as department,
    c.diagnosis,
    c.advice,
    STRING_AGG(pi.medicine_name || ' (' || pi.dosage || ')', ', ') as medicines
FROM consultations c
JOIN appointments a ON c.appointment_id = a.id
JOIN patients p ON a.patient_id = p.id
JOIN users u ON c.created_by = u.id
JOIN departments d ON u.department_id = d.id
LEFT JOIN prescription_items pi ON c.id = pi.consultation_id
WHERE p.id = '950e8400-e29b-41d4-a716-446655440001'::uuid
GROUP BY a.appt_date, u.full_name, d.name, c.diagnosis, c.advice
ORDER BY a.appt_date DESC;
```

### Maintenance

#### Deactivate User
```sql
SELECT deactivate_user('750e8400-e29b-41d4-a716-446655440004'::uuid);
```

#### Activate User
```sql
SELECT activate_user('750e8400-e29b-41d4-a716-446655440004'::uuid);
```

#### Archive Old Appointments (90+ days)
```sql
SELECT archive_old_appointments(90);
```

#### Reset Daily Counters
```sql
SELECT reset_daily_counters();
```

## 🔍 Useful Query Snippets

### Get All Hospitals with Statistics
```sql
SELECT 
    h.id,
    h.name,
    h.phone,
    h.status,
    COUNT(DISTINCT u.id) as active_doctors,
    COUNT(DISTINCT p.id) as total_patients,
    h.daily_token_cap,
    h.created_at
FROM hospitals h
LEFT JOIN users u ON h.id = u.hospital_id AND u.role = 'doctor' AND u.status = 'active'
LEFT JOIN patients p ON h.id = p.hospital_id
GROUP BY h.id, h.name, h.phone, h.status, h.daily_token_cap, h.created_at
ORDER BY h.created_at DESC;
```

### Get Queue Status for All Doctors
```sql
SELECT 
    u.full_name as doctor,
    d.name as department,
    COUNT(CASE WHEN a.status = 'waiting' THEN 1 END) as waiting,
    COUNT(CASE WHEN a.status = 'in_consult' THEN 1 END) as consulting,
    COUNT(CASE WHEN a.status = 'done' THEN 1 END) as completed,
    MAX(a.completed_at) as last_completed
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN appointments a ON u.id = a.doctor_id AND a.appt_date = CURRENT_DATE
WHERE u.role = 'doctor' AND u.hospital_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
GROUP BY u.id, u.full_name, d.name
ORDER BY u.full_name;
```

### Find Patients by Phone
```sql
SELECT 
    id,
    name,
    phone,
    email,
    age,
    created_at
FROM patients
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
    AND phone LIKE '%9876%'
ORDER BY created_at DESC;
```

### Check User Access Levels
```sql
SELECT 
    id,
    email,
    full_name,
    role,
    hospital_id,
    department_id,
    status,
    last_login_at
FROM users
WHERE role IN ('doctor', 'hospital_admin')
    AND status = 'active'
ORDER BY role, full_name;
```

## 💡 Pro Tips

1. **Always use UUIDs for IDs**: All IDs use UUID format: `'550e8400-e29b-41d4-a716-446655440001'::uuid`

2. **Date Handling**:
   ```sql
   CURRENT_DATE          -- Today (date only)
   CURRENT_TIMESTAMP     -- Now (with time)
   CURRENT_DATE + INTERVAL '1 day'  -- Tomorrow
   ```

3. **Pagination**:
   ```sql
   SELECT * FROM appointments 
   LIMIT 10 OFFSET 0;  -- First page
   LIMIT 10 OFFSET 10; -- Second page
   ```

4. **Searching**:
   ```sql
   WHERE email ILIKE '%example%'  -- Case-insensitive
   WHERE name LIKE '%John%'       -- Case-sensitive
   ```

5. **Aggregations**:
   ```sql
   COUNT(*)              -- Total records
   COUNT(DISTINCT id)    -- Unique IDs
   STRING_AGG(field, ', ') -- Join strings
   MAX(), MIN(), AVG()   -- Numeric aggregates
   ```

## ⚠️ Important Notes

- All tables have `created_at` and `updated_at` timestamps (auto-managed)
- Foreign key constraints prevent orphaned records
- Unique constraints prevent duplicate entries
- Indexes are created for optimal query performance
- Use transactions for multi-step operations

## 📚 Related Files

- Database Schema: `lib/db/schema.ts`
- Auth Functions: `lib/auth.ts`
- API Endpoints: `app/api/`
- Full Documentation: `supabase/README.md`

---

**Last Updated:** 2026-09-08
