// Utility to test API service with authentication
import { createApiService } from '../services/api';

export const testApiWithAuth = (token) => {
    const api = createApiService(token);
    
    console.log('Testing API service with token:', token ? 'Present' : 'Missing');
    
    // Test a simple API call
    return api.get('/admin/dashboard/stats')
        .then(data => {
            console.log('API test successful:', data);
            return { success: true, data };
        })
        .catch(error => {
            console.error('API test failed:', error);
            return { success: false, error };
        });
};

// Test function to verify Authorization header is included
export const verifyAuthHeader = (token) => {
    const api = createApiService(token);
    
    // Mock fetch to check headers
    const originalFetch = window.fetch;
    let capturedHeaders = null;
    
    window.fetch = (url, options) => {
        capturedHeaders = options?.headers;
        return originalFetch(url, options);
    };
    
    return api.get('/admin/dashboard/stats')
        .then(() => {
            window.fetch = originalFetch; // Restore original fetch
            const hasAuthHeader = capturedHeaders && capturedHeaders['Authorization'] === `Bearer ${token}`;
            console.log('Authorization header check:', hasAuthHeader ? 'PASS' : 'FAIL');
            console.log('Captured headers:', capturedHeaders);
            return hasAuthHeader;
        })
        .catch(() => {
            window.fetch = originalFetch; // Restore original fetch
            return false;
        });
};
