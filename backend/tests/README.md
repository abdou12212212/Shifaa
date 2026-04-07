# Admin Endpoints Integration Tests

Comprehensive automated testing suite for all admin endpoints with real-time logging and detailed error reporting.

## 🚀 Features

- ✅ **Complete Coverage** - Tests all admin endpoints (Dashboard, Patients, Doctors, Assistants, Appointments, Tests)
- 📊 **Real-time Logging** - Colored console output with detailed request/response logging
- 🔒 **Security Testing** - Tests authentication and authorization
- 🎯 **Assertions** - Built-in assertion helpers for status codes, data validation
- 🧹 **Auto Cleanup** - Optional cleanup of test data after completion
- 📈 **Success Metrics** - Detailed test summary with pass/fail statistics

## 📋 Prerequisites

1. **Backend server must be running**
   ```bash
   npm start
   ```

2. **Create a test Admin user in your database:**
   ```sql
   INSERT INTO Users (full_name, phone_number, password_hash, user_type)
   VALUES ('Test Admin', '0555123456', '$2b$10$hashedPasswordHere', 'Admin');
   ```

   Or use the existing admin credentials and update `tests/config/test.config.js`

## 🎬 Quick Start

### Run All Tests
```bash
npm test
```

Or:
```bash
npm run test:admin
```

### Run Tests in Read-Only Mode (No Create/Update/Delete)
```bash
npm run test:readonly
```

### Run Tests Directly with Node
```bash
node tests/admin-endpoints.test.js
```

## ⚙️ Configuration

Edit `tests/config/test.config.js` to configure:

```javascript
module.exports = {
  baseURL: 'http://localhost:3000',  // Your backend URL

  testAdmin: {
    phoneNumber: '0555123456',       // Admin phone number
    password: 'TestAdmin123!',       // Admin password
    userType: 'Admin'
  },

  options: {
    cleanupAfterTests: true,         // Delete test data after completion
    readOnlyMode: false,             // Only run GET requests
    verbose: true,                   // Detailed logging
    requestDelay: 500                // Delay between requests (ms)
  }
};
```

## 📊 Test Coverage

### 1. Authentication
- ✅ Admin login with JWT token
- ✅ Unauthorized access test (401)
- ✅ Invalid token test (403)

### 2. Dashboard Statistics
- ✅ GET `/api/admin/dashboard/stats`

### 3. Patient Management
- ✅ GET `/api/admin/patients` (with pagination & filters)
- ✅ GET `/api/admin/patients/stats`
- ✅ GET `/api/admin/patients/:patientId`
- ✅ POST `/api/admin/patients` (create)
- ✅ PUT `/api/admin/patients/:patientId` (update)
- ✅ DELETE `/api/admin/patients/:patientId` (soft delete)
- ✅ PUT `/api/admin/patients/:patientId/reactivate`

### 4. Doctor Management
- ✅ GET `/api/admin/doctors` (with pagination & filters)
- ✅ GET `/api/admin/doctors/unverified`
- ✅ GET `/api/admin/doctors/stats`
- ✅ GET `/api/admin/doctors/:doctorId`
- ✅ POST `/api/admin/doctors` (create)
- ✅ PUT `/api/admin/doctors/:doctorId` (update)
- ✅ PUT `/api/admin/doctors/:doctorId/verify` (toggle verification)
- ✅ PUT `/api/admin/doctors/:doctorId/feature` (toggle featured)
- ✅ DELETE `/api/admin/doctors/:doctorId` (soft delete)

### 5. Assistant Management
- ✅ GET `/api/admin/assistants`
- ✅ GET `/api/admin/assistants/:assistantId`
- ✅ POST `/api/admin/assistants` (create)
- ✅ PATCH `/api/admin/assistants/:assistantId/status` (update status)
- ✅ DELETE `/api/admin/assistants/:assistantId`

### 6. Appointment Management
- ✅ GET `/api/admin/appointments` (with filters)
- ✅ GET `/api/admin/appointments/pending`
- ✅ GET `/api/admin/appointments/stats`
- ✅ GET `/api/admin/appointments/:appointmentId`
- ✅ GET `/api/admin/appointments/available-assistants`
- ✅ PUT `/api/admin/appointments/:appointmentId/status`
- ✅ PATCH `/api/admin/appointments/:appointmentId/assign-assistant`
- ✅ DELETE `/api/admin/appointments/:appointmentId`

### 7. Test Results Management
- ✅ GET `/api/admin/tests`
- ✅ GET `/api/admin/tests/:appointmentId`
- ✅ GET `/api/admin/tests/data/assistants`
- ✅ PUT `/api/admin/tests/:appointmentId` (update)
- ✅ POST `/api/admin/tests/results` (upload)

## 📸 Example Output

```
════════════════════════════════════════════════════════════════════════════════
  🧪 ADMIN ENDPOINTS INTEGRATION TESTS
════════════════════════════════════════════════════════════════════════════════

▶ 1️⃣  AUTHENTICATION
────────────────────────────────────────────────────────────────────────────────

⏳ Testing: Admin Login
  → POST /api/auth/login
  ← Status: 200
  ✓ Admin logged in successfully
  ℹ User Info {
    "id": 1,
    "fullName": "Test Admin",
    "userType": "Admin"
  }

▶ 2️⃣  DASHBOARD STATISTICS
────────────────────────────────────────────────────────────────────────────────

⏳ Testing: GET /api/admin/dashboard/stats
  → GET /api/admin/dashboard/stats
  ← Status: 200
  ✓ Dashboard Stats - Status 200
  ✓ Dashboard Stats - Request successful
  ✓ Dashboard Stats - Field 'data.patients' exists
  ✓ Dashboard Stats - Field 'data.doctors' exists

...

════════════════════════════════════════════════════════════════════════════════
  TEST SUMMARY
════════════════════════════════════════════════════════════════════════════════

  Total Tests: 42
  ✓ Passed: 42
  ✗ Failed: 0
  ⏱ Duration: 23.45s
  Success Rate: 100.0%

════════════════════════════════════════════════════════════════════════════════

 ALL TESTS PASSED!
```

## 🔧 Troubleshooting

### "Admin login failed"
- Ensure the admin user exists in your database
- Check phone number and password in `tests/config/test.config.js`
- Verify user_type is 'Admin'

### "Connection refused"
- Make sure backend server is running on http://localhost:3000
- Check the baseURL in config

### "Token expired" errors
- Tests run quickly, but if needed, increase JWT_EXPIRES_IN in your backend

### Tests hanging
- Reduce `requestDelay` in config
- Check for infinite loops in your endpoints

## 🛠️ Advanced Usage

### Environment Variables

You can override config with environment variables:

```bash
TEST_BASE_URL=http://localhost:5000 \
TEST_ADMIN_PHONE=0555999888 \
TEST_ADMIN_PASSWORD=MyPassword \
npm test
```

### Custom Test Scenarios

Edit `tests/admin-endpoints.test.js` to add custom test scenarios:

```javascript
// Add after existing tests
logger.testStart('Custom Test');
const response = await api.get('/api/admin/custom-endpoint');
api.assertStatus(response, 200, 'Custom Test');
```

## 📝 File Structure

```
tests/
├── README.md                      # This file
├── admin-endpoints.test.js        # Main test runner
├── config/
│   └── test.config.js            # Test configuration
└── helpers/
    ├── apiClient.js              # API request helper
    └── testLogger.js             # Colored logging utility
```

## 🎯 Next Steps

1. **Run the tests** to verify all endpoints work correctly
2. **Review the logs** to identify any issues
3. **Fix failing tests** by updating your backend code
4. **Add CI/CD** integration to run tests automatically
5. **Extend tests** with more edge cases and scenarios

## 📚 Documentation

- [API Documentation](../README.md)
- [Authentication Guide](../middlewares/AuthMiddleware.js)
- [Logger Utility](../utils/logger.js)

---

**Happy Testing!** 🎉
