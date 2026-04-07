# 🚀 Quick Start - Run Tests in 3 Steps

## ✅ Step 1: Make Sure Admin User Exists

You mentioned the user exists already, so you're good! If not, here's the SQL:

```sql
-- Check if admin exists
SELECT * FROM Users WHERE phone_number = '0555123456' AND user_type = 'Admin';

-- If not exists, create one (make sure to hash the password first)
```

## ✅ Step 2: Start Your Backend Server

```bash
# In one terminal
npm start
```

Make sure it shows:
```
Server running on http://localhost:XXXX
```

## ✅ Step 3: Run the Tests

```bash
# In another terminal
npm test
```

## 📺 What You'll See

```
════════════════════════════════════════════════════════════════════
  🧪 ADMIN ENDPOINTS INTEGRATION TESTS
════════════════════════════════════════════════════════════════════

▶ 1️⃣  AUTHENTICATION
────────────────────────────────────────────────────────────────────
⏳ Testing: Admin Login
  → POST /auth/login
  ← Status: 200
  ✓ Admin logged in successfully

▶ 2️⃣  DASHBOARD STATISTICS
────────────────────────────────────────────────────────────────────
⏳ Testing: GET /admin/dashboard/stats
  → GET /admin/dashboard/stats
  ← Status: 200
  ✓ Dashboard Stats - Status 200
  ✓ Dashboard Stats - Request successful
  ...
```

## 🎯 Test Results

At the end you'll see:

```
════════════════════════════════════════════════════════════════════
  TEST SUMMARY
════════════════════════════════════════════════════════════════════

  Total Tests: 42
  ✓ Passed: 42
  ✗ Failed: 0
  ⏱ Duration: 23.45s
  Success Rate: 100.0%

 ALL TESTS PASSED!
```

## 🔧 If Something Fails

1. **401 Unauthorized** - Check admin credentials in `tests/config/test.config.js`
2. **404 Not Found** - Make sure backend server is running
3. **Connection Refused** - Check if PORT matches in config

## ⚙️ Configuration

Edit `tests/config/test.config.js` if needed:

```javascript
{
  baseURL: 'http://localhost:3000',  // Your backend URL

  testAdmin: {
    phoneNumber: '0555123456',       // Your admin phone
    password: 'TestAdmin123!',       // Your admin password
  }
}
```

## 🎉 That's It!

Your tests are now automated! No more manual Postman testing.

Run `npm test` anytime to test all endpoints in ~30 seconds!
