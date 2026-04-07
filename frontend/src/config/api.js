/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Backend server URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Helper function to construct full URL from relative path
 * @param {string} path - Relative path (e.g., '/uploads/test-results/file.pdf')
 * @returns {string} Full URL
 */
export const getFullUrl = (path) => {
    if (!path) return '';

    // If path already includes http/https, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Otherwise, prepend the backend server URL
    return `${API_BASE_URL}${path}`;
};

/**
 * Helper function to get file URL for uploaded files
 * @param {string} relativeUrl - Relative URL from database
 * @returns {string} Full file URL
 */
export const getFileUrl = (relativeUrl) => {
    return getFullUrl(relativeUrl);
};
