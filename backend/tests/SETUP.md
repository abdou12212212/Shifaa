# 🚀 Quick Setup Guide for Testing

## Step 1: Create Test Admin User

Before running tests, you need an Admin user in your database. Run this SQL:

```sql
-- Option 1: Create with plain password (will be hashed by bcrypt)
-- You'll need to hash the password first using bcrypt

-- Option 2: Use pre-hashed password
-- Password: TestAdmin123!
INSERT INTO Users (full_name, phone_number, password_hash, user_type, is_active, created_at)
VALUES (
    'Test Admin',
    '0555123456',
    '$2b$10$rKvVKP8XZfQxF6p.r9Gvv.NqB8nXZQWN8P0U0Y0Y0Y0Y0Y0Y0Y0Y0Y0',
    'Admin',
    TRUE,
    NOW()
);
```

**Or generate a hash using Node.js:**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TestAdmin123!', 10).then(hash => console.log(hash));"
```

Then insert that hash into the database.

## Step 2: Update Configuration (Optional)

If you're using different credentials, edit `tests/config/test.config.js`:

```javascript
testAdmin: {
  phoneNumber: '0555123456',     // Your admin phone
  password: 'TestAdmin123!',     // Your admin password
  userType: 'Admin'
}
```

## Step 3: Start Backend Server

```bash
npm start
```

Make sure it's running on http://localhost:3000

## Step 4: Run Tests

```bash
npm test
```

## 🎉 That's It!

The tests will:
1. Login as admin
2. Test all admin endpoints
3. Create test data
4. Update records
5. Delete test data (cleanup)
6. Show detailed results

---

## Troubleshooting

### Cannot login
```bash
# Check if admin user exists
mysql -u root -p your_database
SELECT * FROM Users WHERE user_type = 'Admin';
```

### Connection refused
```bash
# Make sure backend is running
curl http://localhost:3000/api/admin/dashboard/stats
# Should return 401 Unauthorized (which is expected without token)
```

### Port already in use
```bash
# Change port in test.config.js
baseURL: 'http://localhost:5000',  # Use your port
```
