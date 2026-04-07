import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaTrash, FaEdit, FaSpinner, FaCheck } from 'react-icons/fa';
import { useApi } from '../../services/api';

const NoConfirmed = forwardRef((props, ref) => {
    const { apiCall } = useApi();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    // Fetch pending confirmation appointments from backend
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiCall('/admin/appointments?status=Pending Confirmation');
            if (data.success) {
                setAppointments(data.data.appointments);
            } else {
                setError('فشل في جلب البيانات');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('[API ERROR]', '/admin/appointments', err);
        } finally {
            setLoading(false);
        }
    };

    // Confirm appointment
    const confirmAppointment = async (appointmentId) => {
        try {
            const data = await apiCall(`/admin/appointments/${appointmentId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'Upcoming' })
            });

            if (data.success) {
                // Remove from list after confirming
                setAppointments(appointments.filter(app => app.appointment_id !== appointmentId));
            } else {
                setError('فشل في تأكيد الموعد');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('Error confirming appointment:', err);
        }
    };

    // Delete appointment
    const deleteAppointment = async (appointmentId) => {
        try {
            const data = await apiCall(`/admin/appointments/${appointmentId}`, {
                method: 'DELETE',
            });

            if (data.success) {
                setAppointments(appointments.filter(app => app.appointment_id !== appointmentId));
                setShowDeleteConfirm(false);
                setAppointmentToDelete(null);
            } else {
                setError('فشل في حذف الموعد');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('Error deleting appointment:', err);
        }
    };

    // Handle delete click
    const handleDeleteClick = (appointment) => {
        setAppointmentToDelete(appointment);
        setShowDeleteConfirm(true);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setAppointmentToDelete(null);
    };

    // Format date and time
    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const dateStr = date.toLocaleDateString('ar-DZ');
        const timeStr = date.toLocaleTimeString('ar-DZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${dateStr}, ${timeStr}`;
    };

    // Format address
    const formatAddress = (appointment) => {
        const parts = [
            appointment.address_line1,
            appointment.address_line2,
            appointment.city
        ].filter(Boolean);
        return parts.join(', ');
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        openAddForm: () => {} // No confirmed appointments handled separately
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin text-2xl text-[#4B8B85]" />
                <span className="mr-2">جاري التحميل...</span>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#F3FAF9] p-6 rounded-xl shadow-md text-center w-[650px] h-[200px] flex flex-col items-center justify-center">
                        <p className="mb-4 text-lg font-medium">هل أنت متأكد من حذف هذا الموعد؟</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[300px] rounded-full"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => deleteAppointment(appointmentToDelete?.appointment_id)}
                                className="bg-teal-600 text-white px-4 py-2 rounded-full w-[300px] hover:bg-teal-700"
                            >
                                نعم، تأكيد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 overflow-hidden rounded-xl shadow-sm">
                <table dir="rtl" className="min-w-full text-sm text-gray-700 bg-white border-collapse text-center">
                    <thead className="bg-[#4B8B85] text-white text-base font-bold">
                        <tr>
                            <th className="px-6 py-4">رقم التعريفي</th>
                            <th className="px-6 py-4">اسم المريض</th>
                            <th className="px-6 py-4">توقيت الموعد</th>
                            <th className="px-6 py-4">مكان الموعد</th>
                            <th className="px-6 py-4">رقم الهاتف</th>
                            <th className="px-6 py-4">التكلفة</th>
                            <th className="px-6 py-4">المساعد</th>
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-8 text-gray-500">
                                    لا توجد مواعيد غير مؤكدة
                                </td>
                            </tr>
                        ) : (
                            appointments.map((appointment, i) => (
                                <tr key={appointment.appointment_id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                    i % 2 === 0 ? 'bg-white' : 'bg-[#D1FAE5]/30'
                                }`}>
                                    <td className="px-6 py-4 font-medium">{appointment.appointment_ref_id}</td>
                                    <td className="px-6 py-4">{appointment.patient_name}</td>
                                    <td className="px-6 py-4">{formatDateTime(appointment.appointment_datetime)}</td>
                                    <td className="px-6 py-4">{formatAddress(appointment)}</td>
                                    <td className="px-6 py-4">{appointment.patient_phone}</td>
                                    <td className="px-6 py-4 font-medium">{appointment.total_cost} دج</td>
                                    <td className="px-6 py-4">{appointment.assistant_name || 'غير محدد'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 justify-center">
                                            <button
                                                onClick={() => confirmAppointment(appointment.appointment_id)}
                                                className="text-gray-600 hover:text-green-600 transition-colors"
                                                title="تأكيد"
                                            >
                                                <FaCheck size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(appointment)}
                                                className="text-gray-600 hover:text-red-600 transition-colors"
                                                title="حذف"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

NoConfirmed.displayName = 'NoConfirmed';

export default NoConfirmed;
