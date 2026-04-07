/**
 * Results API Service
 * Centralized API calls for the Results feature
 */

import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Fetch paginated results
 * @param {Object} params - Query parameters { page, limit, filters }
 */
export const fetchResults = async ({ page = 1, limit = 10, ...filters } = {}) => {
  const response = await apiClient.get('/results', {
    params: { page, limit, ...filters },
  });
  return response;
};

/**
 * Fetch a single result by ID
 * @param {string|number} id - Result ID
 */
export const fetchResultById = async (id) => {
  const response = await apiClient.get(`/results/${id}`);
  return response;
};

/**
 * Create a new result
 * @param {Object} data - Result data
 */
export const createResult = async (data) => {
  const response = await apiClient.post('/results', data);
  return response;
};

/**
 * Update an existing result
 * @param {string|number} id - Result ID
 * @param {Object} data - Updated data
 */
export const updateResult = async (id, data) => {
  const response = await apiClient.put(`/results/${id}`, data);
  return response;
};

/**
 * Delete a result
 * @param {string|number} id - Result ID
 */
export const deleteResult = async (id) => {
  const response = await apiClient.delete(`/results/${id}`);
  return response;
};

export default {
  fetchResults,
  fetchResultById,
  createResult,
  updateResult,
  deleteResult,
};
