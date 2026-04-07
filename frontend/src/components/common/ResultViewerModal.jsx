import React from 'react';
import { FaTimes, FaDownload, FaFilePdf, FaFileImage, FaPrint } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:3000';

/**
 * ResultViewerModal Component
 * Modal for viewing uploaded test results
 */
const ResultViewerModal = ({ isOpen, onClose, result, appointment }) => {
    if (!isOpen || !result) return null;

    // Construct full URL for the file
    const getFileUrl = (relativeUrl) => {
        if (!relativeUrl) return '';
        // If URL already includes http/https, return as is
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl;
        }
        // Otherwise, prepend the backend server URL
        return `${API_BASE_URL}${relativeUrl}`;
    };

    const fileUrl = getFileUrl(result.result_file_url);

    const isImage = fileUrl && (
        fileUrl.endsWith('.png') ||
        fileUrl.endsWith('.jpg') ||
        fileUrl.endsWith('.jpeg')
    );

    const isPDF = fileUrl && fileUrl.endsWith('.pdf');

    const handleDownload = () => {
        window.open(fileUrl, '_blank');
    };

    const handlePrint = () => {
        const printWindow = window.open(fileUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
            style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="طباعة"
                            >
                                <FaPrint size={20} />
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="تحميل"
                            >
                                <FaDownload size={20} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-center flex-1">عرض نتيجة التحليل</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {/* Result Info */}
                    <div className="bg-teal-50 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-right">
                            {appointment && (
                                <>
                                    <div>
                                        <span className="text-gray-600 text-sm">إسم المريض:</span>
                                        <p className="font-semibold">{appointment.patient_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">رقم المرجع:</span>
                                        <p className="font-semibold">{appointment.appointment_ref_id}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">رمز الفحص:</span>
                                        <p className="font-semibold">{appointment.test_codes || 'غير محدد'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">تاريخ الرفع:</span>
                                        <p className="font-semibold">
                                            {result.uploaded_at
                                                ? new Date(result.uploaded_at).toLocaleDateString('ar-DZ')
                                                : 'غير محدد'
                                            }
                                        </p>
                                    </div>
                                </>
                            )}
                            {!appointment && (
                                <div>
                                    <span className="text-gray-600 text-sm">تاريخ الرفع:</span>
                                    <p className="font-semibold">
                                        {result.uploaded_at
                                            ? new Date(result.uploaded_at).toLocaleDateString('ar-DZ')
                                            : 'غير محدد'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File Viewer */}
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        {isImage && (
                            <div className="p-4">
                                <img
                                    src={fileUrl}
                                    alt="Test Result"
                                    className="w-full h-auto max-h-[60vh] object-contain"
                                />
                            </div>
                        )}

                        {isPDF && (
                            <div className="h-[60vh]">
                                <iframe
                                    src={fileUrl}
                                    className="w-full h-full"
                                    title="PDF Viewer"
                                />
                            </div>
                        )}

                        {!isImage && !isPDF && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FaFilePdf className="text-gray-400 text-6xl mb-4" />
                                <p className="text-gray-600 mb-4">لا يمكن عرض هذا النوع من الملفات</p>
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
                                >
                                    <FaDownload />
                                    تحميل الملف
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultViewerModal;
