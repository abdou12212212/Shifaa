import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

// Create a custom hook for API calls with authentication
export const useApi = () => {
    const { token, handleAuthError } = useAuth();

    const apiCall = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Add Authorization header if token exists
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        console.log('[API CALL START]', `${config.method || 'GET'} ${url}`, {
            headers: config.headers,
            body: config.body
        });

        try {
            const response = await fetch(url, config);

            // Check for authentication errors (401 or 403)
            if (response.status === 401 || response.status === 403) {
                console.log('[API AUTH ERROR]', 'Token expired or invalid');
                handleAuthError();
                throw new Error('Authentication failed');
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Check if backend is running.');
            }

            const data = await response.json();

            // Check for authentication errors in response body
            if (data.error === 'Token expired' ||
                data.error === 'Invalid token' ||
                data.error === 'No token provided' ||
                data.message === 'Token expired' ||
                data.message === 'Invalid token' ||
                data.message === 'No token provided') {
                console.log('[API AUTH ERROR]', 'Token error in response:', data.error || data.message);
                handleAuthError();
                throw new Error('Authentication failed');
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            console.log('[API CALL SUCCESS]', url, { data });
            return data;
        } catch (error) {
            console.error('[API ERROR]', url, error);
            throw error;
        }
    };

    return { apiCall };
};

// Utility functions for common API operations
export const createApiService = (token) => {
    const apiCall = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Add Authorization header if token exists
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        console.log('[API CALL START]', `${config.method || 'GET'} ${url}`, { 
            headers: config.headers,
            body: config.body 
        });

        try {
            const response = await fetch(url, config);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Check if backend is running.');
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API CALL SUCCESS]', url, { data });
            return data;
        } catch (error) {
            console.error('[API ERROR]', url, error);
            throw error;
        }
    };

    return {
        // GET request
        get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
        
        // POST request
        post: (endpoint, data) => apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        
        // PUT request
        put: (endpoint, data) => apiCall(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        
        // DELETE request
        delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),
        
        // PATCH request
        patch: (endpoint, data) => apiCall(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
    };
};
