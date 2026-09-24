# 🔐 Super Admin Setup - MR SHAHID BABU

## Quick Setup (3 Steps)

### Step 1️⃣: Generate Password Hash

Run this command in your project directory:

```bash
node generate-admin-hash.js
```

**Output will look like:**
```
==============================================
BCRYPT PASSWORD HASH GENERATED
==============================================

📧 Email: shahidbcsm@gmail.com
🔐 Password: <REDACTED-ROTATE-THIS-PASSWORD>

🔑 PASSWORD HASH:
$2a$10$...long-string-here...

==============================================
```

### Step 2️⃣: Copy the Hash

Copy the entire hash string (starts with `$2a$10$`)

### Step 3️⃣: Update SQL File

1. Open: `supabase/05_create_super_admin.sql`
2. Find this line: `'$2a$10$PASTE_BCRYPT_HASH_HERE',`
3. Replace `PASTE_BCRYPT_HASH_HERE` with your copied hash

**Example:**
```sql
'$2a$10$kVJL8v7nqK9Zl0k8mJpQ2uQqZQqZQqZQqZQqZQqZQqZQqZQqZQqZQq',
```

### Step 4️⃣: Run SQL

In Supabase Dashboard:
1. SQL Editor → New Query
2. Paste content from `05_create_super_admin.sql`
3. Click "Run"

---

## ✅ Verification

After running SQL, verify the user was created:

```sql
SELECT id, email, full_name, role, status 
FROM users 
WHERE email = 'shahidbcsm@gmail.com';
```

Should return:
```
id              | email                  | full_name   | role        | status
──────────────────────────────────────────────────────────────────────────
[UUID]          | shahidbcsm@gmail.com   | Shahid Babu | super_admin | active
```

---

## 🔑 Login Credentials

| Field | Value |
|-------|-------|
| **Email** | shahidbcsm@gmail.com |
| **Password** | <REDACTED-ROTATE-THIS-PASSWORD> |
| **Role** | Super Admin |
| **Username Path** | /mrshahidbabu |

---

## 🚀 Login Flow

1. **Go to login page:** `http://localhost:3000/login`
2. **Enter:**
   - Email: `shahidbcsm@gmail.com`
   - Password: `<REDACTED-ROTATE-THIS-PASSWORD>`
3. **Click "Sign In"**
4. **Access Super Admin Panel** at `/admin`

---

## 🔐 Security Notes

✅ Password is hashed using bcryptjs (10 rounds)
✅ Password never stored in plain text
✅ Session token uses JWT
✅ Email unique constraint enforced
✅ Account locked to super_admin role

---

## 📝 If You Need to Change Password Later

### Generate new hash:
```bash
node generate-admin-hash.js
```

### Update database:
```sql
UPDATE users 
SET password_hash = '$2a$10$NEW_HASH_HERE'
WHERE email = 'shahidbcsm@gmail.com';
```

---

## 🆘 Troubleshooting

**Error: "PASTE_BCRYPT_HASH_HERE is not a valid UUID"**
- You forgot to replace the placeholder with the actual hash

**Error: "Duplicate key value violates unique constraint"**
- User already exists, delete first:
  ```sql
  DELETE FROM users WHERE email = 'shahidbcsm@gmail.com';
  ```

**Error: "Authentication failed"**
- Make sure you're using the correct password: `<REDACTED-ROTATE-THIS-PASSWORD>`
- Verify hash was generated correctly

---

## 📁 Files Created

- `supabase/05_create_super_admin.sql` - SQL insert template
- `generate-admin-hash.js` - Hash generator script
- `ADMIN_SETUP.md` - This file

---

## ✨ Features Available in Super Admin Panel

Once logged in as super admin, you can:

✅ Create hospitals
✅ Create departments
✅ Create/manage users (admins, doctors, reception)
✅ View all appointments
✅ View statistics
✅ Manage audit logs
✅ System configuration
✅ User management
✅ Hospital management

---

**Created:** 2026-09-08
**Status:** Ready to Setup ✅
