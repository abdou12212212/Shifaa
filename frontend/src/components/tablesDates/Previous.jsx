import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaTrash, FaSpinner, FaTimes, FaEye } from 'react-icons/fa';
import { useAppointments } from '../../contexts/AppointmentContext';
import AppointmentModal from '../common/AppointmentModal';
import StatusBadge from '../common/StatusBadge';
import { formatAppointmentDateTime, formatAddress, APPOINTMENT_STATUS } from '../../services/appointmentApi';

const Previous = forwardRef(({ filters }, ref) => {
    const {
        appointments,
        loading,
        error,
        fetchAppointments,
        deleteAppointment,
        clearError
    } = useAppointments();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Fetch completed appointments on mount and when filters change
    useEffect(() => {
        const filtersWithStatus = {
            ...filters,
            status: APPOINTMENT_STATUS.COMPLETED
        };
        fetchAppointments(filtersWithStatus);
    }, [filters]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        openAddForm: () => {}, // Previous appointments don't need add functionality
        applyFilters: (newFilters) => {
            const filtersWithStatus = {
                ...newFilters,
                status: APPOINTMENT_STATUS.COMPLETED
            };
            fetchAppointments(filtersWithStatus);
        }
    }));

    // Handle delete
    const handleDeleteClick = (appointment) => {
        setAppointmentToDelete(appointment);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (appointmentToDelete) {
            const result = await deleteAppointment(appointmentToDelete.appointment_id);
            if (result.success) {
                setShowDeleteConfirm(false);
                setAppointmentToDelete(null);
            }
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setAppointmentToDelete(null);
    };

    // Handle row click to view appointment details
    const handleRowClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowViewModal(true);
    };

    if (loading && appointments.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin text-3xl text-teal-600 mr-3" />
                <span className="text-lg">جاري التحميل...</span>
            </div>
        );
    }

    if (error && appointments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4 text-lg">{error}</p>
                <button
                    onClick={() => {
                        clearError();
                        fetchAppointments({ ...filters, status: APPOINTMENT_STATUS.COMPLETED });
                    }}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            {/* Error Toast */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                    <div className="flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={clearError} className="text-red-700 hover:text-red-900">
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">تأكيد الحذف</h3>
                        <p className="mb-6 text-gray-600">
                            هل أنت متأكد من حذف موعد {appointmentToDelete?.patient_name}؟
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'جاري الحذف...' : 'تأكيد الحذف'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Appointment Modal */}
            <AppointmentModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
            />

            {/* Appointments Table */}
            <div className="mt-6 overflow-hidden rounded-xl shadow-md">
                <table dir="rtl" className="min-w-full text-sm text-gray-700 bg-white border-collapse text-center">
                    <thead className="bg-teal-600 text-white text-base font-bold">
                        <tr>
                            <th className="px-4 py-4">رقم التعريفي</th>
                            <th className="px-4 py-4">اسم المريض</th>
                            <th className="px-4 py-4">توقيت الموعد</th>
                            <th className="px-4 py-4">مكان الموعد</th>
                            <th className="px-4 py-4">رقم الهاتف</th>
                            <th className="px-4 py-4">التكلفة</th>
                            <th className="px-4 py-4">المساعد</th>
                            <th className="px-4 py-4">الحالة</th>
                            <th className="px-4 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-12">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg">لا توجد مواعيد سابقة</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            appointments.map((appointment, i) => {
                                const dateTime = formatAppointmentDateTime(appointment.appointment_datetime);
                                return (
                                    <tr
                                        key={appointment.appointment_id}
                                        onClick={() => handleRowClick(appointment)}
                                        className={`border-b border-gray-200 hover:bg-teal-100 transition-colors cursor-pointer ${
                                            i % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'
                                        }`}
                                    >
                                        <td className="px-4 py-4 font-medium text-teal-600">
                                            {appointment.appointment_ref_id || `#${appointment.appointment_id}`}
                                        </td>
                                        <td className="px-4 py-4 font-medium">{appointment.patient_name}</td>
                                        <td className="px-4 py-4">
                                            <div>{dateTime.date}</div>
                                            <div className="text-xs text-gray-500">{dateTime.time}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">{formatAddress(appointment)}</td>
                                        <td className="px-4 py-4 font-mono text-sm">{appointment.patient_phone}</td>
                                        <td className="px-4 py-4 font-bold text-teal-600">
                                            {appointment.total_cost} دج
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {appointment.assistant_name || 'غير محدد'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={appointment.status} />
                                        </td>
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2 justify-center">
                                                <button
                                                    onClick={() => handleDeleteClick(appointment)}
                                                    className="text-red-600 hover:text-red-800 transition-colors p-2"
                                                    title="حذف"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Loading Overlay */}
            {loading && appointments.length > 0 && (
                <div className="fixed bottom-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    <span>جاري التحديث...</span>
                </div>
            )}
        </div>
    );
});

Previous.displayName = 'Previous';

export default Previous;
