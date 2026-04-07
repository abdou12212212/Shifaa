/**
 * Admin Endpoints Integration Tests
 * Comprehensive testing suite for all admin endpoints
 *
 * Run: node tests/admin-endpoints.test.js
 */

const ApiClient = require('./helpers/apiClient');
const logger = require('./helpers/testLogger');
const config = require('./config/test.config');

// Test state
const testState = {
  createdPatientId: null,
  createdDoctorId: null,
  createdAssistantId: null,
  createdAppointmentId: null
};

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test runner
async function runTests() {
  logger.start('🧪 ADMIN ENDPOINTS INTEGRATION TESTS');

  const api = new ApiClient(config.baseURL, config.timeout);

  try {
    // ============================================
    // STEP 1: Authentication
    // ============================================
    logger.section('1️⃣  AUTHENTICATION');

    logger.testStart('Admin Login');
    const loginResult = await api.login(
      config.testAdmin.phoneNumber,
      config.testAdmin.password
    );

    if (!loginResult.success) {
      logger.error('Admin login failed', loginResult);
      logger.warning('⚠️  Please ensure test admin user exists in database:');
      logger.info('Phone: ' + config.testAdmin.phoneNumber);
      logger.info('Password: ' + config.testAdmin.password);
      logger.info('User Type: Admin');
      process.exit(1);
    }

    logger.success('Admin logged in successfully');
    logger.info('User Info', loginResult.user);
    await sleep(config.options.requestDelay);

    // ============================================
    // STEP 2: Dashboard Statistics
    // ============================================
    logger.section('2️⃣  DASHBOARD STATISTICS');

    logger.testStart('GET /admin/dashboard/stats');
    const statsResponse = await api.get('/admin/dashboard/stats');
    api.assertStatus(statsResponse, 200, 'Dashboard Stats');
    api.assertSuccess(statsResponse, 'Dashboard Stats');
    api.assertFieldExists(statsResponse, 'data.patients', 'Dashboard Stats');
    api.assertFieldExists(statsResponse, 'data.doctors', 'Dashboard Stats');
    api.assertFieldExists(statsResponse, 'data.assistants', 'Dashboard Stats');
    api.assertFieldExists(statsResponse, 'data.portfolio', 'Dashboard Stats');
    await sleep(config.options.requestDelay);

    // ============================================
    // STEP 3: Patient Management
    // ============================================
    logger.section('3️⃣  PATIENT MANAGEMENT');

    // Get all patients
    logger.testStart('GET /admin/patients');
    const patientsResponse = await api.get('/admin/patients', {
      page: 1,
      limit: 10,
      status: 'all'
    });
    api.assertStatus(patientsResponse, 200, 'Get Patients');
    api.assertSuccess(patientsResponse, 'Get Patients');
    api.assertFieldExists(patientsResponse, 'data.patients', 'Get Patients');
    api.assertFieldExists(patientsResponse, 'data.pagination', 'Get Patients');
    await sleep(config.options.requestDelay);

    // Get patient statistics
    logger.testStart('GET /admin/patients/stats');
    const patientStatsResponse = await api.get('/admin/patients/stats');
    api.assertStatus(patientStatsResponse, 200, 'Patient Stats');
    api.assertSuccess(patientStatsResponse, 'Patient Stats');
    await sleep(config.options.requestDelay);

    // Create new patient (if not read-only mode)
    if (!config.options.readOnlyMode) {
      logger.testStart('POST /api/admin/patients');
      const createPatientResponse = await api.post('/admin/patients', {
        full_name: config.testPatient.fullName,
        phone_number: config.testPatient.phoneNumber,
        password: config.testPatient.password,
        date_of_birth: config.testPatient.date_of_birth,
        gender: config.testPatient.gender,
        address_line1: config.testPatient.address_line1,
        address_line2: config.testPatient.address_line2,
        city: config.testPatient.city
      });

      if (createPatientResponse.status === 201) {
        api.assertStatus(createPatientResponse, 201, 'Create Patient');
        testState.createdPatientId = createPatientResponse.data?.data?.user_id;
        logger.info('Created Patient ID: ' + testState.createdPatientId);
      } else if (createPatientResponse.status === 400 &&
                 createPatientResponse.data?.message?.includes('already exists')) {
        logger.warning('Patient already exists (skipped creation)');
      } else {
        api.assertStatus(createPatientResponse, 201, 'Create Patient');
      }
      await sleep(config.options.requestDelay);

      // Get patient by ID
      if (testState.createdPatientId) {
        logger.testStart('GET /api/admin/patients/:patientId');
        const getPatientResponse = await api.get(`/api/admin/patients/${testState.createdPatientId}`);
        api.assertStatus(getPatientResponse, 200, 'Get Patient By ID');
        api.assertSuccess(getPatientResponse, 'Get Patient By ID');
        await sleep(config.options.requestDelay);

        // Update patient
        logger.testStart('PUT /api/admin/patients/:patientId');
        const updatePatientResponse = await api.put(`/api/admin/patients/${testState.createdPatientId}`, {
          full_name: config.testPatient.fullName + ' Updated',
          phone_number: config.testPatient.phoneNumber,
          date_of_birth: config.testPatient.date_of_birth,
          gender: config.testPatient.gender,
          is_active: true
        });
        api.assertStatus(updatePatientResponse, 200, 'Update Patient');
        api.assertSuccess(updatePatientResponse, 'Update Patient');
        await sleep(config.options.requestDelay);
      }
    }

    // ============================================
    // STEP 4: Doctor Management
    // ============================================
    logger.section('4️⃣  DOCTOR MANAGEMENT');

    // Get all doctors
    logger.testStart('GET /api/admin/doctors');
    const doctorsResponse = await api.get('/admin/doctors', {
      page: 1,
      limit: 10,
      status: 'all'
    });
    api.assertStatus(doctorsResponse, 200, 'Get Doctors');
    api.assertSuccess(doctorsResponse, 'Get Doctors');
    api.assertFieldExists(doctorsResponse, 'data.doctors', 'Get Doctors');
    await sleep(config.options.requestDelay);

    // Get unverified doctors
    logger.testStart('GET /api/admin/doctors/unverified');
    const unverifiedDoctorsResponse = await api.get('/admin/doctors/unverified', {
      page: 1,
      limit: 10
    });
    api.assertStatus(unverifiedDoctorsResponse, 200, 'Get Unverified Doctors');
    api.assertSuccess(unverifiedDoctorsResponse, 'Get Unverified Doctors');
    await sleep(config.options.requestDelay);

    // Get doctor statistics
    logger.testStart('GET /api/admin/doctors/stats');
    const doctorStatsResponse = await api.get('/admin/doctors/stats');
    api.assertStatus(doctorStatsResponse, 200, 'Doctor Stats');
    api.assertSuccess(doctorStatsResponse, 'Doctor Stats');
    await sleep(config.options.requestDelay);

    // Create new doctor (if not read-only mode)
    if (!config.options.readOnlyMode) {
      logger.testStart('POST /api/admin/doctors');
      const createDoctorResponse = await api.post('/admin/doctors', {
        full_name: config.testDoctor.fullName,
        phone_number: config.testDoctor.phoneNumber,
        password: config.testDoctor.password,
        clinic_address: config.testDoctor.clinic_address,
        is_verified: false,
        is_featured: false
      });

      if (createDoctorResponse.status === 201) {
        api.assertStatus(createDoctorResponse, 201, 'Create Doctor');
        testState.createdDoctorId = createDoctorResponse.data?.data?.user_id;
        logger.info('Created Doctor ID: ' + testState.createdDoctorId);
      } else if (createDoctorResponse.status === 400 &&
                 createDoctorResponse.data?.message?.includes('already exists')) {
        logger.warning('Doctor already exists (skipped creation)');
      }
      await sleep(config.options.requestDelay);

      // Toggle doctor verification
      if (testState.createdDoctorId) {
        logger.testStart('PUT /api/admin/doctors/:doctorId/verify');
        const verifyDoctorResponse = await api.put(`/api/admin/doctors/${testState.createdDoctorId}/verify`, {
          verify: true
        });
        api.assertStatus(verifyDoctorResponse, 200, 'Verify Doctor');
        api.assertSuccess(verifyDoctorResponse, 'Verify Doctor');
        await sleep(config.options.requestDelay);

        // Toggle featured status
        logger.testStart('PUT /api/admin/doctors/:doctorId/feature');
        const featureDoctorResponse = await api.put(`/api/admin/doctors/${testState.createdDoctorId}/feature`);
        api.assertStatus(featureDoctorResponse, 200, 'Toggle Doctor Featured');
        api.assertSuccess(featureDoctorResponse, 'Toggle Doctor Featured');
        await sleep(config.options.requestDelay);
      }
    }

    // ============================================
    // STEP 5: Assistant Management
    // ============================================
    logger.section('5️⃣  ASSISTANT MANAGEMENT');

    // Get all assistants
    logger.testStart('GET /api/admin/assistants');
    const assistantsResponse = await api.get('/admin/assistants');
    api.assertStatus(assistantsResponse, 200, 'Get Assistants');
    api.assertSuccess(assistantsResponse, 'Get Assistants');
    await sleep(config.options.requestDelay);

    // Create new assistant (if not read-only mode)
    if (!config.options.readOnlyMode) {
      logger.testStart('POST /api/admin/assistants');
      const createAssistantResponse = await api.post('/admin/assistants', {
        full_name: config.testAssistant.fullName,
        phone_number: config.testAssistant.phoneNumber,
        password: config.testAssistant.password
      });

      if (createAssistantResponse.status === 201) {
        api.assertStatus(createAssistantResponse, 201, 'Create Assistant');
        testState.createdAssistantId = createAssistantResponse.data?.data?.user_id;
        logger.info('Created Assistant ID: ' + testState.createdAssistantId);
      } else if (createAssistantResponse.status === 400) {
        logger.warning('Assistant already exists (skipped creation)');
      }
      await sleep(config.options.requestDelay);

      // Get assistant details
      if (testState.createdAssistantId) {
        logger.testStart('GET /api/admin/assistants/:assistantId');
        const getAssistantResponse = await api.get(`/api/admin/assistants/${testState.createdAssistantId}`);
        api.assertStatus(getAssistantResponse, 200, 'Get Assistant Details');
        api.assertSuccess(getAssistantResponse, 'Get Assistant Details');
        await sleep(config.options.requestDelay);

        // Update assistant status
        logger.testStart('PATCH /api/admin/assistants/:assistantId/status');
        const updateAssistantResponse = await api.patch(`/api/admin/assistants/${testState.createdAssistantId}/status`, {
          is_active: true
        });
        api.assertStatus(updateAssistantResponse, 200, 'Update Assistant Status');
        api.assertSuccess(updateAssistantResponse, 'Update Assistant Status');
        await sleep(config.options.requestDelay);
      }
    }

    // ============================================
    // STEP 6: Appointment Management
    // ============================================
    logger.section('6️⃣  APPOINTMENT MANAGEMENT');

    // Get all appointments
    logger.testStart('GET /api/admin/appointments');
    const appointmentsResponse = await api.get('/admin/appointments', {
      status: 'all',
      search: '',
      date_from: '',
      date_to: ''
    });
    api.assertStatus(appointmentsResponse, 200, 'Get All Appointments');
    api.assertSuccess(appointmentsResponse, 'Get All Appointments');
    await sleep(config.options.requestDelay);

    // Get pending appointments
    logger.testStart('GET /api/admin/appointments/pending');
    const pendingAppointmentsResponse = await api.get('/admin/appointments/pending', {
      page: 1,
      limit: 10
    });
    api.assertStatus(pendingAppointmentsResponse, 200, 'Get Pending Appointments');
    api.assertSuccess(pendingAppointmentsResponse, 'Get Pending Appointments');
    await sleep(config.options.requestDelay);

    // Get appointment statistics
    logger.testStart('GET /api/admin/appointments/stats');
    const appointmentStatsResponse = await api.get('/admin/appointments/stats');
    api.assertStatus(appointmentStatsResponse, 200, 'Appointment Stats');
    api.assertSuccess(appointmentStatsResponse, 'Appointment Stats');
    await sleep(config.options.requestDelay);

    // Get available assistants
    logger.testStart('GET /api/admin/appointments/available-assistants');
    const availableAssistantsResponse = await api.get('/admin/appointments/available-assistants');
    api.assertStatus(availableAssistantsResponse, 200, 'Get Available Assistants');
    api.assertSuccess(availableAssistantsResponse, 'Get Available Assistants');
    await sleep(config.options.requestDelay);

    // ============================================
    // STEP 7: Test Results Management
    // ============================================
    logger.section('7️⃣  TEST RESULTS MANAGEMENT');

    // Get tests/appointments
    logger.testStart('GET /api/admin/tests');
    const testsResponse = await api.get('/admin/tests', {
      status: 'all'
    });
    api.assertStatus(testsResponse, 200, 'Get Tests');
    api.assertSuccess(testsResponse, 'Get Tests');
    await sleep(config.options.requestDelay);

    // Get available assistants for tests
    logger.testStart('GET /api/admin/tests/data/assistants');
    const testAssistantsResponse = await api.get('/admin/tests/data/assistants');
    api.assertStatus(testAssistantsResponse, 200, 'Get Test Assistants');
    api.assertSuccess(testAssistantsResponse, 'Get Test Assistants');
    await sleep(config.options.requestDelay);

    // ============================================
    // STEP 8: Authorization Tests
    // ============================================
    logger.section('8️⃣  AUTHORIZATION TESTS');

    // Test without token
    logger.testStart('Unauthorized Access Test');
    const unauthorizedApi = new ApiClient(config.baseURL, config.timeout);
    const unauthorizedResponse = await unauthorizedApi.get('/admin/dashboard/stats');
    api.assertError(unauthorizedResponse, 401, 'Unauthorized Access');
    await sleep(config.options.requestDelay);

    // Test with invalid token
    logger.testStart('Invalid Token Test');
    const invalidTokenApi = new ApiClient(config.baseURL, config.timeout);
    invalidTokenApi.setToken('invalid.token.here');
    const invalidTokenResponse = await invalidTokenApi.get('/admin/dashboard/stats');
    api.assertError(invalidTokenResponse, 403, 'Invalid Token');
    await sleep(config.options.requestDelay);

    // ============================================
    // STEP 9: Cleanup (Optional)
    // ============================================
    if (config.options.cleanupAfterTests && !config.options.readOnlyMode) {
      logger.section('9️⃣  CLEANUP');

      // Delete created test data
      if (testState.createdPatientId) {
        logger.testStart('DELETE /api/admin/patients/:patientId');
        await api.delete(`/api/admin/patients/${testState.createdPatientId}`);
        logger.info('Cleaned up test patient');
        await sleep(config.options.requestDelay);
      }

      if (testState.createdDoctorId) {
        logger.testStart('DELETE /api/admin/doctors/:doctorId');
        await api.delete(`/api/admin/doctors/${testState.createdDoctorId}`);
        logger.info('Cleaned up test doctor');
        await sleep(config.options.requestDelay);
      }

      if (testState.createdAssistantId) {
        logger.testStart('DELETE /api/admin/assistants/:assistantId');
        await api.delete(`/api/admin/assistants/${testState.createdAssistantId}`);
        logger.info('Cleaned up test assistant');
        await sleep(config.options.requestDelay);
      }
    }

    // ============================================
    // FINAL SUMMARY
    // ============================================
    logger.summary();

    // Exit with appropriate code
    process.exit(logger.failedTests > 0 ? 1 : 0);

  } catch (error) {
    logger.error('Fatal test error', error);
    logger.summary();
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
