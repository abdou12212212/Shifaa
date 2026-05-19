import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaTrash, FaEdit, FaSpinner, FaSave, FaTimes, FaUserNurse } from 'react-icons/fa';
import { useAppointments } from '../../contexts/AppointmentContext';
import AppointmentModal from '../common/AppointmentModal';
import StatusBadge from '../common/StatusBadge';
import { formatAppointmentDateTime, formatAddress, APPOINTMENT_STATUS } from '../../services/appointmentApi';

/**
 * Enhanced Next Component
 * Displays upcoming appointments with full CRUD operations and real-time updates
 */
const NextEnhanced = forwardRef(({ filters, refreshTrigger }, ref) => {
    const {
        appointments,
        loading,
        error,
        fetchAppointments,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        assignAssistant,
        availableAssistants,
        fetchAvailableAssistants,
        clearError
    } = useAppointments();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [showAssignModal, setShowAssignModal] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [localAppointments, setLocalAppointments] = useState([]);

    // Sync local appointments with context appointments
    useEffect(() => {
        setLocalAppointments(appointments);
    }, [appointments]);

    // Fetch appointments on mount and when refreshTrigger changes
    useEffect(() => {
        const filtersWithStatus = {
            ...filters,
            status: APPOINTMENT_STATUS.UPCOMING
        };
        fetchAppointments(filtersWithStatus);
        fetchAvailableAssistants();
    }, [filters, refreshTrigger]); // Add refreshTrigger to re-fetch when needed

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        applyFilters: (newFilters) => {
            const filtersWithStatus = {
                ...newFilters,
                status: APPOINTMENT_STATUS.UPCOMING
            };
            fetchAppointments(filtersWithStatus);
        },
        // ✅ دالة لإضافة موعد جديد مباشرة (بدون إعادة جلب)
        addAppointmentDirectly: (newAppointment) => {
            console.log('[NextEnhanced] Adding appointment directly:', newAppointment);
            
            // تأكد من أن الموعد قادم (Upcoming)
            if (newAppointment.status === APPOINTMENT_STATUS.UPCOMING || 
                newAppointment.status === 'Upcoming') {
                
                // أضف الموعد إلى القائمة المحلية فوراً
                setLocalAppointments(prev => {
                    // تأكد من عدم وجود تكرار
                    const exists = prev.some(apt => apt.appointment_id === newAppointment.appointment_id);
                    if (exists) return prev;
                    
                    // أضف الموعد الجديد في البداية (مرتب حسب التاريخ)
                    const newList = [newAppointment, ...prev];
                    // رتب حسب التاريخ
                    newList.sort((a, b) => 
                        new Date(a.appointment_datetime) - new Date(b.appointment_datetime)
                    );
                    return newList;
                });
                
                // ✅ نجاح - بدون إعادة جلب من الخادم
                return true;
            }
            return false;
        },
        // ✅ دالة لإعادة تحميل القائمة من الخادم (عند الحاجة)
        refreshList: () => {
            const filtersWithStatus = {
                ...filters,
                status: APPOINTMENT_STATUS.UPCOMING
            };
            fetchAppointments(filtersWithStatus);
        }
    }));

    // Listen for global appointment added event
    useEffect(() => {
        const handleAppointmentAdded = (event) => {
            console.log('[NextEnhanced] Global event: appointmentAdded', event.detail);
            if (event.detail && event.detail.appointment) {
                const newAppointment = event.detail.appointment;
                if (newAppointment.status === APPOINTMENT_STATUS.UPCOMING || 
                    newAppointment.status === 'Upcoming') {
                    setLocalAppointments(prev => {
                        const exists = prev.some(apt => apt.appointment_id === newAppointment.appointment_id);
                        if (exists) return prev;
                        const newList = [newAppointment, ...prev];
                        newList.sort((a, b) => 
                            new Date(a.appointment_datetime) - new Date(b.appointment_datetime)
                        );
                        return newList;
                    });
                }
            }
        };

        window.addEventListener('appointmentAdded', handleAppointmentAdded);
        return () => window.removeEventListener('appointmentAdded', handleAppointmentAdded);
    }, []);

    // Handle delete - update local state after deletion
    const handleDeleteClick = (appointment) => {
        setAppointmentToDelete(appointment);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (appointmentToDelete) {
            const result = await deleteAppointment(appointmentToDelete.appointment_id);
            if (result.success) {
                // Remove from local state
                setLocalAppointments(prev => prev.filter(
                    apt => apt.appointment_id !== appointmentToDelete.appointment_id
                ));
                setShowDeleteConfirm(false);
                setAppointmentToDelete(null);
            }
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setAppointmentToDelete(null);
    };

    // Handle edit - update local state after save
    const startEdit = (appointment) => {
        setEditingId(appointment.appointment_id);
        setEditData({
            patient_notes: appointment.patient_notes || '',
            lab_notes: appointment.lab_notes || '',
            status: appointment.status
        });
    };

    const saveEdit = async (appointmentId) => {
        const result = await updateAppointment(appointmentId, editData);
        if (result.success) {
            // Update local state with new data
            setLocalAppointments(prev => prev.map(apt =>
                apt.appointment_id === appointmentId
                    ? { ...apt, ...editData }
                    : apt
            ));
            setEditingId(null);
            setEditData({});
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleEditChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleAssignAssistant = async (appointmentId, assistantId) => {
        const result = await assignAssistant(appointmentId, assistantId);
        if (result.success) {
            // Update local state with new assistant
            const assistant = availableAssistants.find(a => a.user_id === assistantId);
            if (assistant) {
                setLocalAppointments(prev => prev.map(apt =>
                    apt.appointment_id === appointmentId
                        ? { ...apt, assistant_id: assistantId, assistant_name: assistant.full_name }
                        : apt
                ));
            }
            setShowAssignModal(null);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        const result = await updateAppointmentStatus(appointmentId, newStatus);
        if (result.success) {
            setLocalAppointments(prev => prev.map(apt =>
                apt.appointment_id === appointmentId
                    ? { ...apt, status: newStatus }
                    : apt
            ));
        }
    };

    const handleRowClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowViewModal(true);
    };

    // Filter appointments - فقط المواعيد القادمة (ليست مكتملة، ليست ملغاة، وتاريخها مستقبلي)
const filteredAppointments = localAppointments.filter(appointment => {
    // ✅ الشرط 1: استبعاد المواعيد المكتملة والملغاة
    if (appointment.status === 'Completed' || 
        appointment.status === 'Cancelled' ||
        appointment.status === 'Pending Confirmation') {
        return false;
    }
    
    // ✅ الشرط 2: استبعاد المواعيد التي تاريخها ماضٍ
    const appointmentDate = new Date(appointment.appointment_datetime);
    const now = new Date();
    if (appointmentDate <= now) {
        return false;
    }
    
    // ✅ الشرط 3: تطبيق البحث إذا وجد
    if (!filters?.search) return true;
    const query = filters.search.toLowerCase();
    const patientName = appointment.patient_name?.toLowerCase() || '';
    const patientPhone = appointment.patient_phone?.toLowerCase() || '';
    const refId = appointment.appointment_ref_id?.toString().toLowerCase() || '';
    return patientName.includes(query) || patientPhone.includes(query) || refId.includes(query);
});

    if (loading && localAppointments.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin text-3xl text-teal-600 mr-3" />
                <span className="text-lg">جاري التحميل...</span>
            </div>
        );
    }

    if (error && localAppointments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4 text-lg">{error}</p>
                <button
                    onClick={() => {
                        clearError();
                        fetchAppointments({ ...filters, status: APPOINTMENT_STATUS.UPCOMING });
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
                        <p className="mb-6 text-sm text-gray-500">
                            هذا الإجراء لا يمكن التراجع عنه
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

            {/* Assign Assistant Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-6 text-center">تعيين مساعد</h3>
                        <div className="space-y-3 mb-6">
                            {availableAssistants.length === 0 ? (
                                <p className="text-center text-gray-500">لا يوجد مساعدون متاحون</p>
                            ) : (
                                availableAssistants.map(assistant => (
                                    <button
                                        key={assistant.user_id}
                                        onClick={() => handleAssignAssistant(showAssignModal, assistant.user_id)}
                                        className="w-full p-4 text-right border-2 border-gray-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">
                                                {assistant.active_appointments || 0} مواعيد نشطة
                                            </span>
                                            <div>
                                                <div className="font-medium">{assistant.full_name}</div>
                                                <div className="text-sm text-gray-500">{assistant.phone_number}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setShowAssignModal(null)}
                            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            إلغاء
                        </button>
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
                            <th className="px-4 py-4">ملاحظات</th>
                            <th className="px-4 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-6 py-12">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg mb-2">
                                            {filters?.search ? 'لا توجد نتائج للبحث' : 'لا توجد مواعيد قادمة'}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            {!filters?.search && 'استخدم زر "إضافة" لإنشاء موعد جديد'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredAppointments.map((appointment, i) => {
                                const isEditing = editingId === appointment.appointment_id;
                                const dateTime = formatAppointmentDateTime(appointment.appointment_datetime);

                                return (
                                    <tr
                                        key={appointment.appointment_id}
                                        onClick={() => handleRowClick(appointment)}
                                        className={`border-b border-gray-200 hover:bg-teal-100 transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'
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
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            {appointment.assistant_name ? (
                                                <div className="text-sm">
                                                    <div className="font-medium">{appointment.assistant_name}</div>
                                                    <button
                                                        onClick={() => setShowAssignModal(appointment.appointment_id)}
                                                        className="text-xs text-teal-600 hover:text-teal-800"
                                                    >
                                                        تغيير
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowAssignModal(appointment.appointment_id)}
                                                    className="text-teal-600 hover:text-teal-800 flex items-center gap-1 mx-auto"
                                                >
                                                    <FaUserNurse />
                                                    <span className="text-sm">تعيين</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-4" onClick={(e) => isEditing && e.stopPropagation()}>
                                            {isEditing ? (
                                                <select
                                                    value={editData.status}
                                                    onChange={(e) => handleEditChange('status', e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    <option value={APPOINTMENT_STATUS.UPCOMING}>قادم</option>
                                                    <option value={APPOINTMENT_STATUS.IN_PROGRESS}>جاري</option>
                                                    <option value={APPOINTMENT_STATUS.COMPLETED}>مكتمل</option>
                                                    <option value={APPOINTMENT_STATUS.CANCELLED}>ملغى</option>
                                                </select>
                                            ) : (
                                                <StatusBadge status={appointment.status} />
                                            )}
                                        </td>
                                        <td className="px-4 py-4" onClick={(e) => isEditing && e.stopPropagation()}>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={editData.patient_notes}
                                                        onChange={(e) => handleEditChange('patient_notes', e.target.value)}
                                                        placeholder="ملاحظات المريض"
                                                        rows="2"
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none"
                                                    />
                                                    <textarea
                                                        value={editData.lab_notes}
                                                        onChange={(e) => handleEditChange('lab_notes', e.target.value)}
                                                        placeholder="ملاحظات المختبر"
                                                        rows="2"
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-600 max-w-xs">
                                                    {appointment.patient_notes && (
                                                        <div className="mb-1">
                                                            <span className="font-medium">مريض:</span> {appointment.patient_notes}
                                                        </div>
                                                    )}
                                                    {appointment.lab_notes && (
                                                        <div>
                                                            <span className="font-medium">مختبر:</span> {appointment.lab_notes}
                                                        </div>
                                                    )}
                                                    {!appointment.patient_notes && !appointment.lab_notes && (
                                                        <span className="text-gray-400">لا توجد ملاحظات</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2 justify-center">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEdit(appointment.appointment_id)}
                                                            className="text-green-600 hover:text-green-800 transition-colors p-2"
                                                            title="حفظ"
                                                        >
                                                            <FaSave size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
                                                            title="إلغاء"
                                                        >
                                                            <FaTimes size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(appointment)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                                                            title="تعديل"
                                                        >
                                                            <FaEdit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(appointment)}
                                                            className="text-red-600 hover:text-red-800 transition-colors p-2"
                                                            title="حذف"
                                                        >
                                                            <FaTrash size={16} />
                                                        </button>
                                                    </>
                                                )}
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
            {loading && localAppointments.length > 0 && (
                <div className="fixed bottom-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    <span>جاري التحديث...</span>
                </div>
            )}
        </div>
    );
});

NextEnhanced.displayName = 'NextEnhanced';

export default NextEnhanced;