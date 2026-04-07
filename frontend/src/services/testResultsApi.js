import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

/**
 * Test Results API Service
 * Handles file uploads and test result management
 */
export const useTestResultsApi = () => {
    const { token } = useAuth();

    return {
        /**
         * Upload a file to the server
         * @param {File} file - The file to upload
         * @param {number} appointmentId - The appointment ID
         * @param {number} testId - The test ID
         * @param {function} onProgress - Progress callback
         * @returns {Promise<Object>} Upload response with file URL
         */
        uploadFile: async (file, appointmentId, testId, onProgress) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('appointment_id', appointmentId);
            formData.append('test_id', testId);

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(Math.round(percentComplete));
                    }
                });

                // Handle completion
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Invalid server response'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                    }
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload cancelled'));
                });

                // Open connection and send
                xhr.open('POST', `${API_BASE_URL}/admin/tests/upload`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });
        },

        /**
         * Save test result to database
         * @param {number} appointmentId - The appointment ID
         * @param {number} testId - The test ID
         * @param {string} resultFileUrl - The file URL from upload
         * @returns {Promise<Object>} Save response
         */
        saveTestResult: async (appointmentId, testId, resultFileUrl) => {
            const response = await fetch(`${API_BASE_URL}/admin/tests/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointment_id: appointmentId,
                    test_id: testId,
                    result_file_url: resultFileUrl
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save test result: ${response.status}`);
            }

            return await response.json();
        },

        /**
         * Get test results for an appointment
         * @param {number} appointmentId - The appointment ID
         * @returns {Promise<Object>} Test results
         */
        getAppointmentResults: async (appointmentId) => {
            const response = await fetch(`${API_BASE_URL}/admin/appointments/${appointmentId}/results`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch results: ${response.status}`);
            }

            return await response.json();
        }
    };
};
