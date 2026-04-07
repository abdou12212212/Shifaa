/**
 * Test Configuration
 * Contains all configuration for automated testing
 */

module.exports = {
  // API Base URL
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

  // Test Admin Credentials
  // IMPORTANT: Create a test admin user in your database before running tests
  testAdmin: {
    phoneNumber: process.env.TEST_ADMIN_PHONE || '0555123456',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!',
    userType: 'Admin'
  },

  // Test Patient Data (for creating test records)
  testPatient: {
    fullName: 'Test Patient',
    phoneNumber: '0666111222',
    password: 'TestPatient123!',
    userType: 'Patient',
    date_of_birth: '1990-01-01',
    gender: 'Male',
    address_line1: '123 Test Street',
    address_line2: 'Apt 4B',
    city: 'Algiers'
  },

  // Test Doctor Data
  testDoctor: {
    fullName: 'Dr. Test Doctor',
    phoneNumber: '0777222333',
    password: 'TestDoctor123!',
    userType: 'Doctor',
    clinic_address: '456 Medical Plaza, Algiers'
  },

  // Test Assistant Data
  testAssistant: {
    fullName: 'Test Assistant',
    phoneNumber: '0888333444',
    password: 'TestAssistant123!'
  },

  // Request timeout in milliseconds
  timeout: 10000,

  // Test options
  options: {
    // Whether to clean up test data after tests
    cleanupAfterTests: true,

    // Whether to run only read operations (GET requests)
    readOnlyMode: false,

    // Verbose logging
    verbose: true,

    // Delay between requests (in ms) to avoid rate limiting
    requestDelay: 500
  }
};
