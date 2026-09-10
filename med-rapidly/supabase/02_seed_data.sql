-- ============================================================================
-- Med Rapidly - Sample/Seed Data
-- This file contains sample data for development and testing
-- ============================================================================

-- ============================================================================
-- SAMPLE HOSPITALS
-- ============================================================================
INSERT INTO hospitals (id, name, phone, address, daily_token_cap, booking_window_days, status)
VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Apollo Hospitals Delhi', '+91-11-2222-3333', '123 Medical Avenue, New Delhi, India', 500, 7, 'active'),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Max Healthcare Mumbai', '+91-22-4444-5555', '456 Healthcare Street, Mumbai, India', 450, 7, 'active'),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Fortis Bangalore', '+91-80-6666-7777', '789 Medical Park, Bangalore, India', 400, 14, 'active');

-- ============================================================================
-- SAMPLE DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, hospital_id, name, short_code, display_order)
VALUES
    ('650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Cardiology', 'CARD', 1),
    ('650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Orthopedics', 'ORTHO', 2),
    ('650e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'General Medicine', 'GENM', 3),
    ('650e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Pediatrics', 'PEDS', 1),
    ('650e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Dermatology', 'DERM', 2);

-- ============================================================================
-- SAMPLE USERS (DOCTORS, ADMINS, RECEPTION)
-- ============================================================================

-- Super Admin
INSERT INTO users (id, hospital_id, email, phone, full_name, role, qualification, status)
VALUES
    ('750e8400-e29b-41d4-a716-446655440001'::uuid, NULL, 'admin@medrapidly.com', '+91-9999-0000', 'Admin User', 'super_admin', 'MBA', 'active');

-- Hospital Admins
INSERT INTO users (id, hospital_id, email, phone, full_name, role, qualification, status)
VALUES
    ('750e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'admin@apollo.com', '+91-9876-5432', 'Apollo Admin', 'hospital_admin', 'BE', 'active'),
    ('750e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'admin@max.com', '+91-9123-4567', 'Max Admin', 'hospital_admin', 'MBA', 'active');

-- Doctors - Apollo Hospital
INSERT INTO users (id, hospital_id, email, phone, full_name, role, qualification, registration_number, specialisation, department_id, consultation_fee, status)
VALUES
    ('750e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'dr.rajeev@apollo.com', '+91-9111-1111', 'Dr. Rajeev Singh', 'doctor', 'MBBS, MD', 'MCI2020001', 'Cardiology', '650e8400-e29b-41d4-a716-446655440001'::uuid, 500, 'active'),
    ('750e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'dr.neha@apollo.com', '+91-9222-2222', 'Dr. Neha Sharma', 'doctor', 'MBBS, FRCS', 'MCI2020002', 'Orthopedics', '650e8400-e29b-41d4-a716-446655440002'::uuid, 600, 'active'),
    ('750e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'dr.amit@apollo.com', '+91-9333-3333', 'Dr. Amit Verma', 'doctor', 'MBBS, DM', 'MCI2020003', 'General Medicine', '650e8400-e29b-41d4-a716-446655440003'::uuid, 400, 'active');

-- Doctors - Max Healthcare
INSERT INTO users (id, hospital_id, email, phone, full_name, role, qualification, registration_number, specialisation, department_id, consultation_fee, status)
VALUES
    ('750e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'dr.priya@max.com', '+91-9444-4444', 'Dr. Priya Mehta', 'doctor', 'MBBS, MD Pediatrics', 'MCI2020004', 'Pediatrics', '650e8400-e29b-41d4-a716-446655440004'::uuid, 450, 'active'),
    ('750e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'dr.ananya@max.com', '+91-9555-5555', 'Dr. Ananya Gupta', 'doctor', 'MBBS, MD Dermatology', 'MCI2020005', 'Dermatology', '650e8400-e29b-41d4-a716-446655440005'::uuid, 500, 'active');

-- Reception Staff
INSERT INTO users (id, hospital_id, email, phone, full_name, role, status)
VALUES
    ('750e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'reception1@apollo.com', '+91-9666-6666', 'Rahul Kumar', 'reception', 'active'),
    ('750e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'reception1@max.com', '+91-9777-7777', 'Priya Singh', 'reception', 'active');

-- ============================================================================
-- SAMPLE INTAKE LINKS (QR CODES)
-- ============================================================================
INSERT INTO intake_links (id, hospital_id, token)
VALUES
    ('850e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'APOLLO_DELHI_QR001'),
    ('850e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'MAX_MUMBAI_QR001'),
    ('850e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'FORTIS_BANGALORE_QR001');

-- ============================================================================
-- SAMPLE PATIENTS
-- ============================================================================
INSERT INTO patients (id, hospital_id, name, phone, email, age, address)
VALUES
    ('950e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Rajesh Kumar', '+91-9800-1111', 'rajesh@email.com', 45, '101 Hospital Lane, Delhi'),
    ('950e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Anjali Singh', '+91-9800-2222', 'anjali@email.com', 38, '202 Health Street, Delhi'),
    ('950e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Vikram Patel', '+91-9800-3333', 'vikram@email.com', 52, '303 Medical Avenue, Delhi'),
    ('950e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Sanya Gupta', '+91-9800-4444', 'sanya@email.com', 28, '404 Care Lane, Mumbai'),
    ('950e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Arjun Reddy', '+91-9800-5555', 'arjun@email.com', 35, '505 Wellness Street, Mumbai');

-- ============================================================================
-- SAMPLE DOCTOR AVAILABILITY
-- ============================================================================
INSERT INTO doctor_availability (id, doctor_id, avail_date, department_id, room_number, daily_limit, is_available)
VALUES
    ('a50e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_DATE, '650e8400-e29b-41d4-a716-446655440001'::uuid, '101', 25, true),
    ('a50e8400-e29b-41d4-a716-446655440002'::uuid, '750e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_DATE, '650e8400-e29b-41d4-a716-446655440002'::uuid, '202', 20, true),
    ('a50e8400-e29b-41d4-a716-446655440003'::uuid, '750e8400-e29b-41d4-a716-446655440006'::uuid, CURRENT_DATE, '650e8400-e29b-41d4-a716-446655440003'::uuid, '303', 30, true),
    ('a50e8400-e29b-41d4-a716-446655440004'::uuid, '750e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_DATE + INTERVAL '1 day', '650e8400-e29b-41d4-a716-446655440001'::uuid, '101', 25, true),
    ('a50e8400-e29b-41d4-a716-446655440005'::uuid, '750e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_DATE + INTERVAL '1 day', '650e8400-e29b-41d4-a716-446655440002'::uuid, '202', 20, true);

-- ============================================================================
-- SAMPLE APPOINTMENTS
-- ============================================================================
INSERT INTO appointments (id, hospital_id, patient_id, doctor_id, appt_date, appt_token, queue_number, queue_prefix, status, consent_given, source)
VALUES
    ('b50e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_DATE, 'CARD-001', 1, 'CARD', 'waiting', true, 'qr'),
    ('b50e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440002'::uuid, '750e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_DATE, 'CARD-002', 2, 'CARD', 'waiting', true, 'qr'),
    ('b50e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440003'::uuid, '750e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_DATE, 'ORTHO-001', 1, 'ORTHO', 'in_consult', true, 'reception'),
    ('b50e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, '950e8400-e29b-41d4-a716-446655440004'::uuid, '750e8400-e29b-41d4-a716-446655440007'::uuid, CURRENT_DATE, 'PEDS-001', 1, 'PEDS', 'done', true, 'walk_in'),
    ('b50e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, '950e8400-e29b-41d4-a716-446655440005'::uuid, '750e8400-e29b-41d4-a716-446655440008'::uuid, CURRENT_DATE, 'DERM-001', 1, 'DERM', 'waiting', true, 'qr');

-- ============================================================================
-- SAMPLE QUEUE COUNTERS
-- ============================================================================
INSERT INTO queue_counters (id, doctor_id, counter_date, next_number)
VALUES
    ('c50e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_DATE, 3),
    ('c50e8400-e29b-41d4-a716-446655440002'::uuid, '750e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_DATE, 2),
    ('c50e8400-e29b-41d4-a716-446655440003'::uuid, '750e8400-e29b-41d4-a716-446655440006'::uuid, CURRENT_DATE, 1);

-- ============================================================================
-- SAMPLE TOKEN COUNTERS
-- ============================================================================
INSERT INTO token_counters (id, hospital_id, counter_date, next_number)
VALUES
    ('d50e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_DATE, 6),
    ('d50e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_DATE, 2);

-- ============================================================================
-- SAMPLE CONSULTATIONS
-- ============================================================================
INSERT INTO consultations (id, appointment_id, symptoms, vitals, diagnosis, advice, follow_up_date, created_by)
VALUES
    ('e50e8400-e29b-41d4-a716-446655440001'::uuid, 'b50e8400-e29b-41d4-a716-446655440004'::uuid, 'Fever, cough',
     '{"temperature": 101.5, "bp": "120/80", "heart_rate": 88}'::jsonb, 'Common viral fever',
     'Rest and hydration, take paracetamol', CURRENT_DATE + INTERVAL '3 days', '750e8400-e29b-41d4-a716-446655440007'::uuid);

-- ============================================================================
-- SAMPLE PRESCRIPTION ITEMS
-- ============================================================================
INSERT INTO prescription_items (id, consultation_id, medicine_name, dosage, duration, frequency, instructions)
VALUES
    ('f50e8400-e29b-41d4-a716-446655440001'::uuid, 'e50e8400-e29b-41d4-a716-446655440001'::uuid, 'Paracetamol', '500mg', '3 days', 'Twice daily', 'After meals'),
    ('f50e8400-e29b-41d4-a716-446655440002'::uuid, 'e50e8400-e29b-41d4-a716-446655440001'::uuid, 'Cough Syrup', '10ml', '5 days', 'Twice daily', 'Before bedtime');

-- ============================================================================
-- AUDIT LOG SAMPLE
-- ============================================================================
INSERT INTO audit_log (id, hospital_id, user_id, action, resource_type, resource_id)
VALUES
    ('d50e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440002'::uuid, 'CREATE', 'appointment', 'b50e8400-e29b-41d4-a716-446655440001'::uuid),
    ('d50e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440004'::uuid, 'UPDATE', 'appointment', 'b50e8400-e29b-41d4-a716-446655440003'::uuid);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the seed data:
-- SELECT COUNT(*) as total_hospitals FROM hospitals;
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_patients FROM patients;
-- SELECT COUNT(*) as total_appointments FROM appointments;
-- SELECT COUNT(*) as total_consultations FROM consultations;
