import React, { useState } from 'react';
import { FaTimes, FaCloudUploadAlt, FaFilePdf, FaFileImage, FaTrash } from 'react-icons/fa';
import { useTestResultsApi } from '../../services/testResultsApi';

/**
 * ResultUploadModal Component
 * Modal for uploading test results for appointments
 * Based on the design specifications for results management
 */
const ResultUploadModal = ({ isOpen, onClose, appointment, onUpload }) => {
    const testResultsApi = useTestResultsApi();
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedTestId, setSelectedTestId] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    if (!isOpen || !appointment) return null;

    // Parse test IDs from comma-separated string
    const testIds = appointment.test_ids ? appointment.test_ids.split(',').map(id => id.trim()) : [];
    const testNames = appointment.test_names ? appointment.test_names.split(',').map(name => name.trim()) : [];
    const testCodes = appointment.test_codes ? appointment.test_codes.split(',').map(code => code.trim()) : [];

    const tests = testIds.map((id, index) => ({
        id,
        name: testNames[index] || '',
        code: testCodes[index] || ''
    }));

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type (PDF, PNG, JPG, JPEG)
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('يرجى اختيار ملف PDF أو صورة (PNG, JPG)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
            return;
        }

        setSelectedFile(file);

        // Create preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('يرجى اختيار ملف النتيجة');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // Step 1: Upload file to server
            const uploadResponse = await testResultsApi.uploadFile(
                selectedFile,
                appointment.appointment_id,
                selectedTestId,
                (progress) => setUploadProgress(progress)
            );

            if (!uploadResponse.success) {
                throw new Error(uploadResponse.message || 'فشل رفع الملف');
            }

            // Step 2: Save file URL to database
            const saveResponse = await testResultsApi.saveTestResult(
                appointment.appointment_id,
                selectedTestId,
                uploadResponse.data.fileUrl
            );

            if (!saveResponse.success) {
                throw new Error(saveResponse.message || 'فشل حفظ النتيجة');
            }

            // Step 3: Call onUpload callback if provided
            if (onUpload) {
                await onUpload(appointment.appointment_id, selectedTestId, uploadResponse.data.fileUrl);
            }

            // Reset form and close
            setSelectedFile(null);
            setFilePreview(null);
            setSelectedTestId('');
            setUploadProgress(0);

            alert('تم رفع النتيجة بنجاح');
            onClose();
        } catch (error) {
            console.error('Error uploading file:', error);
            setError(error.message || 'حدث خطأ أثناء رفع الملف');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null);
            setFilePreview(null);
            setSelectedTestId('');
            setUploadProgress(0);
            setError(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                        >
                            <FaTimes size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-center flex-1">رفع نتائج التحاليل</h2>
                        <div className="w-6"></div>
                    </div>

                    {/* Appointment Info */}
                    <div className="bg-teal-50 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-lg mb-3 text-right">معلومات الموعد</h3>
                        <div className="grid grid-cols-2 gap-4 text-right">
                            <div>
                                <span className="text-gray-600 text-sm">رقم المرجع:</span>
                                <p className="font-semibold">{appointment.appointment_ref_id}</p>
                            </div>
                            <div>
                                <span className="text-gray-600 text-sm">إسم المريض:</span>
                                <p className="font-semibold">{appointment.patient_name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600 text-sm">رقم الهاتف:</span>
                                <p className="font-semibold">{appointment.patient_phone}</p>
                            </div>
                            <div>
                                <span className="text-gray-600 text-sm">الفحوصات:</span>
                                <p className="font-semibold">{appointment.test_codes}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-right">
                                <p className="font-semibold">خطأ:</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Test Selection
                        <div>
                            <label className="block text-right text-sm mb-2 font-semibold">
                                اختر الفحص <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedTestId}
                                onChange={(e) => setSelectedTestId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                                required
                                disabled={uploading}
                            >
                                <option value="">اختر الفحص المراد رفع نتيجته</option>
                                {tests.map((test) => (
                                    <option key={test.id} value={test.id}>
                                        {test.code} - {test.name}
                                    </option>
                                ))}
                            </select>
                        </div> */}

                        {/* File Upload Area */}
                        <div>
                            <label className="block text-right text-sm mb-2 font-semibold">
                                ملف النتيجة <span className="text-red-500">*</span>
                            </label>

                            {!selectedFile ? (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-teal-600 rounded-xl cursor-pointer bg-teal-50 hover:bg-teal-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FaCloudUploadAlt className="text-teal-600 text-5xl mb-3" />
                                        <p className="mb-2 text-sm text-gray-700">
                                            <span className="font-semibold">انقر للرفع</span> أو اسحب الملف هنا
                                        </p>
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG (حتى 10MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={handleFileSelect}
                                        disabled={uploading}
                                    />
                                </label>
                            ) : (
                                <div className="border-2 border-teal-600 rounded-xl p-4 bg-teal-50">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            disabled={uploading}
                                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                        >
                                            <FaTrash size={20} />
                                        </button>
                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            {selectedFile.type === 'application/pdf' ? (
                                                <FaFilePdf className="text-red-500 text-3xl" />
                                            ) : (
                                                <FaFileImage className="text-blue-500 text-3xl" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Image Preview */}
                                    {filePreview && (
                                        <div className="mt-4">
                                            <img
                                                src={filePreview}
                                                alt="Preview"
                                                className="w-full h-48 object-contain rounded-lg bg-white"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{uploadProgress}%</span>
                                    <span>جاري الرفع...</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={uploading}
                                className="flex-1 px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={uploading || !selectedFile}
                                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'جاري الرفع...' : 'رفع النتيجة'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResultUploadModal;
