import { useState, useEffect, useCallback } from 'react';
import { FaEye, FaSpinner, FaDownload } from 'react-icons/fa';
import { useApi } from '../../services/api';
import { getFileUrl } from '../../config/api';
import ResultViewerModal from '../common/ResultViewerModal';

/**
 * Previous Results Table Component
 * Displays completed test results with view/download functionality
 */
function Previous({ searchTerm, filters }) {
    const { apiCall } = useApi();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Fetch completed results
    const fetchResults = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch completed appointments with results
            const response = await apiCall('/admin/appointments?status=Completed');

            if (response.success && response.data) {
                // Get appointments array from nested data structure
                const appointments = response.data.appointments || response.data || [];

                // For each appointment, fetch its details including the result
                const appointmentsWithResults = await Promise.all(
                    appointments.map(async (appointment) => {
                        try {
                            // Fetch appointment details which includes the result
                            const detailsResponse = await apiCall(
                                `/admin/appointments/${appointment.appointment_id}`
                            );

                            if (detailsResponse.success && detailsResponse.data) {
                                return {
                                    ...appointment,
                                    result: detailsResponse.data.result,
                                    tests: detailsResponse.data.tests || []
                                };
                            }

                            return {
                                ...appointment,
                                result: null,
                                tests: []
                            };
                        } catch (err) {
                            console.error(`Error fetching details for appointment ${appointment.appointment_id}:`, err);
                            return {
                                ...appointment,
                                result: null,
                                tests: []
                            };
                        }
                    })
                );

                setResults(appointmentsWithResults);
            } else {
                setError('فشل في جلب النتائج');
            }
        } catch (err) {
            console.error('Error fetching results:', err);
            setError('خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    }, [apiCall, searchTerm, filters]);

    useEffect(() => {
        fetchResults();
    }, []);

    // Filter results based on search term
    const filteredResults = results.filter(result => {
        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        return (
            result.patient_name?.toLowerCase().includes(search) ||
            result.patient_phone?.toLowerCase().includes(search) ||
            result.appointment_ref_id?.toLowerCase().includes(search) ||
            result.test_names?.toLowerCase().includes(search)
        );
    });

    const handleViewResult = (appointment) => {
        setSelectedAppointment(appointment);
        setSelectedResult(appointment.result);
        setShowViewerModal(true);
    };

    const handleDownloadResult = (resultFileUrl) => {
        const fullUrl = getFileUrl(resultFileUrl);
        window.open(fullUrl, '_blank');
    };

    const formatDate = (datetime) => {
        if (!datetime) return 'غير محدد';
        const date = new Date(datetime);
        return date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin text-3xl text-teal-600 mr-3" />
                <span className="text-lg">جاري تحميل النتائج...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4 text-lg">{error}</p>
                <button
                    onClick={fetchResults}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            {/* Results Table */}
            <div className="mt-6 overflow-hidden rounded-xl shadow-md">
                <table dir="rtl" className="min-w-full text-sm text-gray-700 bg-white border-collapse text-center">
                    <thead className="bg-teal-600 text-white text-base font-bold">
                        <tr>
                            <th className="px-4 py-4">رقم التعريفي</th>
                            <th className="px-4 py-4">اسم المريض</th>
                            <th className="px-4 py-4">رقم الهاتف</th>
                            <th className="px-4 py-4">التحاليل</th>
                            <th className="px-4 py-4">تاريخ الموعد</th>
                            <th className="px-4 py-4">عدد النتائج</th>
                            <th className="px-4 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredResults.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg">
                                            {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد نتائج متاحة'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredResults.map((appointment, i) => {
                                const hasResult = appointment.result != null;

                                return (
                                    <tr
                                        key={appointment.appointment_id}
                                        className={`border-b border-gray-200 hover:bg-teal-50 transition-colors ${
                                            i % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'
                                        }`}
                                    >
                                        <td className="px-4 py-4 font-medium text-teal-600">
                                            {appointment.appointment_ref_id || `#${appointment.appointment_id}`}
                                        </td>
                                        <td className="px-4 py-4 font-medium">
                                            {appointment.patient_name}
                                        </td>
                                        <td className="px-4 py-4 font-mono text-sm">
                                            {appointment.patient_phone}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {appointment.test_names || 'غير محدد'}
                                        </td>
                                        <td className="px-4 py-4">
                                            {formatDate(appointment.appointment_datetime)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                hasResult
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {hasResult ? '1 نتيجة' : '0 نتيجة'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {hasResult ? (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleViewResult(appointment)}
                                                        className="text-teal-600 hover:text-teal-800 transition-colors p-2"
                                                        title="عرض النتيجة"
                                                    >
                                                        <FaEye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadResult(appointment.result.result_file_url)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                                                        title="تحميل النتيجة"
                                                    >
                                                        <FaDownload size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">لا توجد نتائج</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Result Viewer Modal */}
            <ResultViewerModal
                isOpen={showViewerModal}
                onClose={() => {
                    setShowViewerModal(false);
                    setSelectedResult(null);
                    setSelectedAppointment(null);
                }}
                result={selectedResult}
                appointment={selectedAppointment}
            />
        </div>
    );
}

export default Previous;
