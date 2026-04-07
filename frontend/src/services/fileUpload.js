/**
 * File Upload Service
 * Handles file uploads to cloud storage (e.g., Cloudinary, AWS S3, etc.)
 */

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} uploadPreset - Cloudinary upload preset
 * @param {string} cloudName - Cloudinary cloud name
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadToCloudinary = async (file, uploadPreset = 'shifa_results', cloudName = 'your_cloud_name', onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'shifa/test_results');

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url);
            } else {
                reject(new Error('Upload failed'));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
        xhr.send(formData);
    });
};

/**
 * Upload a file to AWS S3
 * This is a placeholder - you'll need to implement based on your S3 setup
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadToS3 = async (file, onProgress) => {
    // TODO: Implement S3 upload with presigned URLs
    // This requires backend endpoint to generate presigned URLs
    throw new Error('S3 upload not implemented yet');
};

/**
 * Upload a file to local backend storage
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadToBackend = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200 || xhr.status === 201) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.file_url || response.url);
            } else {
                reject(new Error('Upload failed'));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });

        // Get auth token from localStorage
        const token = localStorage.getItem('token');

        xhr.open('POST', '/api/upload');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
    });
};

/**
 * Main upload function - chooses the appropriate upload method
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @param {string} options.method - Upload method: 'cloudinary', 's3', or 'backend'
 * @param {Function} options.onProgress - Progress callback function
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadFile = async (file, options = {}) => {
    const { method = 'backend', onProgress } = options;

    switch (method) {
        case 'cloudinary':
            return await uploadToCloudinary(file, undefined, undefined, onProgress);
        case 's3':
            return await uploadToS3(file, onProgress);
        case 'backend':
        default:
            return await uploadToBackend(file, onProgress);
    }
};

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 10MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {Object} - Validation result {valid: boolean, error: string}
 */
export const validateFile = (file, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    } = options;

    if (!file) {
        return { valid: false, error: 'لم يتم اختيار ملف' };
    }

    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        return { valid: false, error: `حجم الملف يجب أن يكون أقل من ${maxSizeMB} ميجابايت` };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'نوع الملف غير مدعوم. يرجى اختيار PDF أو صورة' };
    }

    return { valid: true };
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - The file extension
 */
export const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default {
    uploadFile,
    uploadToCloudinary,
    uploadToS3,
    uploadToBackend,
    validateFile,
    getFileExtension,
    formatFileSize
};
