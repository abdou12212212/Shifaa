import React, { useState, useEffect } from 'react';
import { FaPhone, FaCalendar, FaClock, FaMapMarkerAlt, FaMoneyBillWave, FaUser, FaIdCard, FaFlask } from 'react-icons/fa';

/**
 * AppointmentModal Component
 * Clean view modal for appointments matching the exact design specifications
 * Displays appointment information in a beautiful, user-friendly RTL layout
 */
const AppointmentModal = ({ isOpen, onClose, appointment = null }) => {
    const [formData, setFormData] = useState({
        patient_name: '',
        patient_phone: '',
        patient_id: '',
        appointment_ref_id: '',
        doctor_name: '',
        doctor_phone: '',
        appointment_date: '',
        appointment_time: '',
        total_cost: '',
        assistant_name: '',
        address_line1: '',
        test_codes: ''
    });

    // Initialize form data from appointment
    useEffect(() => {
        if (appointment) {
            const appointmentDate = appointment.appointment_datetime
                ? new Date(appointment.appointment_datetime)
                : null;

            setFormData({
                patient_name: appointment.patient_name || '',
                patient_phone: appointment.patient_phone || '',
                patient_id: appointment.patient_id || '',
                appointment_ref_id: appointment.appointment_ref_id || '',
                doctor_name: appointment.doctor_name || 'غير محدد',
                doctor_phone: appointment.doctor_phone || '',
                appointment_date: appointmentDate
                    ? appointmentDate.toISOString().split('T')[0]
                    : '',
                appointment_time: appointmentDate
                    ? appointmentDate.toTimeString().substring(0, 5)
                    : '',
                total_cost: appointment.total_cost || '',
                assistant_name: appointment.assistant_name || 'لم يتم التعيين',
                address_line1: appointment.address_line1 || '',
                test_codes: appointment.test_codes || ''
            });
        }
    }, [appointment]);

    const handleClose = () => {
        onClose();
    };

    const handleConfirm = () => {
        // You can add custom confirmation logic here if needed
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <div className="p-6">
                    {/* Header */}
                    <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
                        معلومات المواعيد
                    </h2>

                    {/* Form Fields */}
                    <div className="space-y-3">
                        {/* اسم المريض */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                اسم المريض
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.patient_name}
                                    readOnly
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    placeholder="اسم المريض"
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* رقم الهاتف الخاص به */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                رقم الهاتف الخاص به
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formData.patient_phone}
                                    readOnly
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    placeholder="0556655726"
                                />
                                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* الرقم التعريفي للمريض & الرقم التعريفي للموعد */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    الرقم التعريفي للموعد
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.appointment_ref_id}
                                        readOnly
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                        placeholder="#31111111111"
                                    />
                                    <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    الرقم التعريفي للمريض
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.patient_id}
                                        readOnly
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                        placeholder="#31111111111"
                                    />
                                    <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* اسم الطبيب */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                اسم الطبيب
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.doctor_name}
                                    readOnly
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    placeholder="اسم الطبيب"
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* الرقم الهاتفي الخاص بالطبيب */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                الرقم الهاتفي الخاص بالطبيب
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formData.doctor_phone}
                                    readOnly
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    placeholder="0556655726"
                                />
                                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* رموز الفحوصات */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                رموز الفحوصات
                            </label>
                            <div className="relative">
                                <div className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right min-h-[42px] flex items-center">
                                    {formData.test_codes ? (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.test_codes.split(',').map((code, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                                                >
                                                    {code.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">لا توجد فحوصات</span>
                                    )}
                                </div>
                                <FaFlask className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* تاريخ الموعد & وقت الموعد */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    وقت الموعد
                                </label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        value={formData.appointment_time}
                                        readOnly
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    />
                                    <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    تاريخ الموعد
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.appointment_date}
                                        readOnly
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    />
                                    <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* سعر النهائي */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                سعر النهائي
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.total_cost ? `${formData.total_cost} دج` : ''}
                                    readOnly
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    placeholder="3000 دج"
                                />
                                <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* تحديد الموعد */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                تحديد الموعد
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.assistant_name}
                                    readOnly
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                    placeholder="اسم المساعد"
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* مكان الحضور من أجل النقل إليه */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                مكان الحضور من أجل النقل إليه
                            </label>
                            <div className="relative">
                                <textarea
                                    value={formData.address_line1}
                                    readOnly
                                    rows="2"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                                    placeholder="عنوان المريض الكامل"
                                />
                                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-6 py-2.5 border-2 border-teal-500 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-md"
                        >
                            تأكيد المعلومات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;
