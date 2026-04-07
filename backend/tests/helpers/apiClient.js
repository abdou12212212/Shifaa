/**
 * API Client Helper
 * Provides utility functions for making HTTP requests
 */

const axios = require('axios');
const logger = require('./testLogger');

class ApiClient {
  constructor(baseURL, timeout = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      logger.request(method, endpoint, data);

      const config = {
        method,
        url,
        headers: this.getHeaders(),
        timeout: this.timeout,
        ...options
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      if (data && method === 'GET') {
        config.params = data;
      }

      const response = await axios(config);

      logger.response(response.status, response.data);

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      const status = error.response?.status || 500;
      const data = error.response?.data || { message: error.message };

      logger.response(status, data);

      return {
        success: false,
        status,
        data,
        error: error.message
      };
    }
  }

  async get(endpoint, params = null) {
    return this.request('GET', endpoint, params);
  }

  async post(endpoint, data = null) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data = null) {
    return this.request('PUT', endpoint, data);
  }

  async patch(endpoint, data = null) {
    return this.request('PATCH', endpoint, data);
  }

  async delete(endpoint, data = null) {
    return this.request('DELETE', endpoint, data);
  }

  // Login and set token
  async login(phoneNumber, password) {
    const response = await this.post('/auth/login', {
      phoneNumber,
      password
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      return {
        success: true,
        token: response.data.token,
        user: response.data.user
      };
    }

    return {
      success: false,
      error: response.data?.msg || 'Login failed'
    };
  }

  // Assertion helpers
  assertStatus(response, expectedStatus, testName) {
    if (response.status === expectedStatus) {
      logger.success(`${testName} - Status ${expectedStatus}`);
      return true;
    } else {
      logger.error(`${testName} - Expected status ${expectedStatus}, got ${response.status}`, response);
      return false;
    }
  }

  assertSuccess(response, testName) {
    if (response.success && response.data?.success !== false) {
      logger.success(`${testName} - Request successful`);
      return true;
    } else {
      logger.error(`${testName} - Request failed`, response);
      return false;
    }
  }

  assertHasData(response, testName) {
    if (response.data && response.data.data) {
      logger.success(`${testName} - Response has data`);
      return true;
    } else {
      logger.error(`${testName} - Response missing data`, response);
      return false;
    }
  }

  assertFieldExists(response, fieldPath, testName) {
    const fields = fieldPath.split('.');
    let value = response.data;

    for (const field of fields) {
      if (value && typeof value === 'object' && field in value) {
        value = value[field];
      } else {
        logger.error(`${testName} - Field '${fieldPath}' not found`, response);
        return false;
      }
    }

    logger.success(`${testName} - Field '${fieldPath}' exists`);
    return true;
  }

  assertError(response, expectedStatus, testName) {
    if (!response.success && response.status === expectedStatus) {
      logger.success(`${testName} - Correctly returned error ${expectedStatus}`);
      return true;
    } else {
      logger.error(`${testName} - Expected error ${expectedStatus}, got ${response.status}`, response);
      return false;
    }
  }
}

module.exports = ApiClient;
