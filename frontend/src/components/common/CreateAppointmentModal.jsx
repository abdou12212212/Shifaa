import React, { useState, useEffect } from 'react';
import { FaPhone, FaCalendar, FaClock, FaMapMarkerAlt, FaMoneyBillWave, FaUser, FaIdCard, FaTimes } from 'react-icons/fa';
import { useAppointmentApi } from '../../services/appointmentApi';

/**
 * CreateAppointmentModal Component
 * Modal for creating new appointments matching the exact design specifications
 * with blur background and grid layout
 */
const CreateAppointmentModal = ({ isOpen, onClose, onSubmit }) => {
    const appointmentApi = useAppointmentApi();

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
        assistant_id: '',
        assistant_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        payment_method: 'Cash',
        is_urgent: false,
        patient_notes: '',
        lab_notes: '',
        selectedTests: [] // Array of selected test objects
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [assistants, setAssistants] = useState([]);
    const [medicalTests, setMedicalTests] = useState([]);
    const [searchPatient, setSearchPatient] = useState('');
    const [searchDoctor, setSearchDoctor] = useState('');
    const [searchTest, setSearchTest] = useState('');

    // Fetch assistants on mount
    useEffect(() => {
        if (isOpen) {
            fetchAssistants();
        }
    }, [isOpen]);

    // Fetch patients based on search
    useEffect(() => {
        if (searchPatient) {
            const timer = setTimeout(() => {
                fetchPatients(searchPatient);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchPatient]);

    // Fetch doctors based on search
    useEffect(() => {
        if (searchDoctor) {
            const timer = setTimeout(() => {
                fetchDoctors(searchDoctor);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchDoctor]);

    // Fetch tests based on search
    useEffect(() => {
        if (searchTest) {
            const timer = setTimeout(() => {
                fetchMedicalTests(searchTest);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchTest]);

    const fetchPatients = async (search = '') => {
        try {
            const response = await appointmentApi.getPatients(search);
            if (response.success) {
                setPatients(response.data.patients || []);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    };

    const fetchDoctors = async (search = '') => {
        try {
            const response = await appointmentApi.getDoctors(search);
            if (response.success) {
                setDoctors(response.data.doctors || []);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    const fetchAssistants = async () => {
        try {
            const response = await appointmentApi.getAssistants();
            if (response.success) {
                setAssistants(response.data.assistants || []);
            }
        } catch (err) {
            console.error('Error fetching assistants:', err);
        }
    };

    const fetchMedicalTests = async (search = '') => {
        try {
            const response = await appointmentApi.getMedicalTests(search);
            if (response.success) {
                setMedicalTests(response.data || []);
            } else if (Array.isArray(response)) {
                setMedicalTests(response);
            }
        } catch (err) {
            console.error('Error fetching medical tests:', err);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    // Handle is_urgent checkbox change - auto-set date and time to now
    const handleUrgentChange = (checked) => {
        if (checked) {
            // Get current date and time
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM

            setFormData(prev => ({
                ...prev,
                is_urgent: true,
                appointment_date: currentDate,
                appointment_time: currentTime
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                is_urgent: false
            }));
        }
        setError(null);
    };

    const handlePatientSelect = (patient) => {
        setFormData(prev => ({
            ...prev,
            patient_id: patient.user_id,
            patient_name: patient.full_name,
            patient_phone: patient.phone_number
        }));
        setSearchPatient('');
        setPatients([]);
    };

    const handleDoctorSelect = (doctor) => {
        setFormData(prev => ({
            ...prev,
            doctor_id: doctor.user_id,
            doctor_name: doctor.full_name,
            doctor_phone: doctor.phone_number
        }));
        setSearchDoctor('');
        setDoctors([]);
    };

    const handleAssistantSelect = (e) => {
        const selectedId = e.target.value;
        const selectedAssistant = assistants.find(a => a.user_id.toString() === selectedId);
        setFormData(prev => ({
            ...prev,
            assistant_id: selectedId,
            assistant_name: selectedAssistant ? selectedAssistant.full_name : ''
        }));
    };

    const handleTestSelect = (test) => {
        // Check if test is already selected
        const isAlreadySelected = formData.selectedTests.some(t => t.test_id === test.test_id);
        if (isAlreadySelected) {
            setError('هذا الفحص مضاف بالفعل');
            setTimeout(() => setError(null), 2000);
            return;
        }

        // Add test to selected tests array
        setFormData(prev => ({
            ...prev,
            selectedTests: [...prev.selectedTests, test]
        }));

        // Clear search input and results
        setSearchTest('');
        setMedicalTests([]);
    };

    const handleRemoveTest = (testId) => {
        setFormData(prev => ({
            ...prev,
            selectedTests: prev.selectedTests.filter(t => t.test_id !== testId)
        }));
    };

    const validateForm = () => {
        if (!formData.patient_name) {
            setError('يرجى إدخال اسم المريض');
            return false;
        }
        if (!formData.patient_phone) {
            setError('يرجى إدخال رقم هاتف المريض');
            return false;
        }
        if (!formData.appointment_date) {
            setError('يرجى اختيار تاريخ الموعد');
            return false;
        }
        if (!formData.appointment_time) {
            setError('يرجى اختيار وقت الموعد');
            return false;
        }
        if (!formData.address_line1) {
            setError('يرجى إدخال عنوان الموعد');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Combine date and time into ISO format
            const appointment_datetime = new Date(
                `${formData.appointment_date}T${formData.appointment_time}:00`
            ).toISOString();

            const appointmentData = {
                patient_id: formData.patient_id,
                patient_name: formData.patient_name,
                patient_phone: formData.patient_phone,
                appointment_datetime,
                address_line1: formData.address_line1,
                address_line2: formData.address_line2,
                city: formData.city,
                total_cost: parseFloat(formData.total_cost) || 0,
                test_id: formData.selectedTests.length > 0
                    ? formData.selectedTests.map(t => t.test_id)
                    : null,
                assistant_id: formData.assistant_id || null,
                payment_method: formData.payment_method,
                is_urgent: formData.is_urgent,
                patient_notes: formData.patient_notes,
                lab_notes: formData.lab_notes,
                doctor_id: formData.doctor_id || null,
                doctor_name: formData.doctor_name,
                doctor_phone: formData.doctor_phone
            };

            await onSubmit(appointmentData);
            handleClose();
        } catch (err) {
            setError('حدث خطأ أثناء حفظ الموعد');
            console.error('Error submitting appointment:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            patient_name: '',
            patient_phone: '',
            patient_id: '',
            appointment_ref_id: '',
            doctor_name: '',
            doctor_phone: '',
            appointment_date: '',
            appointment_time: '',
            total_cost: '',
            assistant_id: '',
            assistant_name: '',
            address_line1: '',
            address_line2: '',
            city: '',
            payment_method: 'Cash',
            is_urgent: false,
            patient_notes: '',
            lab_notes: '',
            selectedTests: []
        });
        setError(null);
        setPatients([]);
        setDoctors([]);
        setMedicalTests([]);
        setSearchPatient('');
        setSearchDoctor('');
        setSearchTest('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
            style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }}
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

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-center text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* اسم المريض */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                اسم المريض
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.patient_name || searchPatient}
                                    onChange={(e) => {
                                        setSearchPatient(e.target.value);
                                        handleChange('patient_name', e.target.value);
                                    }}
                                    placeholder="أسم خليل"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-400"
                                    required
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />

                                {/* Patient Search Results */}
                                {patients.length > 0 && searchPatient && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {patients.map(patient => (
                                            <button
                                                key={patient.user_id}
                                                type="button"
                                                onClick={() => handlePatientSelect(patient)}
                                                className="w-full px-4 py-2 text-right hover:bg-teal-50 transition-colors border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{patient.full_name}</div>
                                                <div className="text-sm text-gray-500">{patient.phone_number}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                    onChange={(e) => handleChange('patient_phone', e.target.value)}
                                    placeholder="0556655726"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-400"
                                    required
                                />
                                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* الرقم التعريفي الإختيار (Test Search) */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                الرقم التعريفي الإختيار
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTest}
                                    onChange={(e) => setSearchTest(e.target.value)}
                                    placeholder="ابحث عن الفحص"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-400"
                                />
                                <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />

                                {/* Test Search Results */}
                                {medicalTests.length > 0 && searchTest && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {medicalTests.map(test => (
                                            <button
                                                key={test.test_id}
                                                type="button"
                                                onClick={() => handleTestSelect(test)}
                                                className="w-full px-4 py-2 text-right hover:bg-teal-50 transition-colors border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{test.test_name}</div>
                                                <div className="text-sm text-gray-500">{test.test_code} - {test.price} دج</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Tests Badges */}
                            {formData.selectedTests.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.selectedTests.map(test => (
                                        <span
                                            key={test.test_id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                                        >
                                            {test.test_name} ({test.test_code})
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTest(test.test_id)}
                                                className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* الرقم التعريفي للمريض & الرقم التعريفي للموعد */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    كود الفحص
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.selectedTests.map(t => t.test_code).join(', ')}
                                        readOnly
                                        placeholder="#1111111111"
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-100 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none placeholder:text-gray-400 cursor-not-allowed"
                                    />
                                    <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    الرقم التعريفي للموعد
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.patient_id}
                                        readOnly
                                        placeholder="#1111111111"
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-100 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none placeholder:text-gray-400 cursor-not-allowed"
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
                                    value={formData.doctor_name || searchDoctor}
                                    onChange={(e) => {
                                        setSearchDoctor(e.target.value);
                                        handleChange('doctor_name', e.target.value);
                                    }}
                                    placeholder="أسم خليل"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-400"
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />

                                {/* Doctor Search Results */}
                                {doctors.length > 0 && searchDoctor && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {doctors.map(doctor => (
                                            <button
                                                key={doctor.user_id}
                                                type="button"
                                                onClick={() => handleDoctorSelect(doctor)}
                                                className="w-full px-4 py-2 text-right hover:bg-teal-50 transition-colors border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{doctor.full_name}</div>
                                                <div className="text-sm text-gray-500">{doctor.phone_number}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                    onChange={(e) => handleChange('doctor_phone', e.target.value)}
                                    placeholder="0556655726"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-400"
                                />
                                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* تاريخ الموعد & وقت الموعد */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-right text-sm mb-1.5 text-gray-600">
                                    توقيت الموعد
                                </label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        value={formData.appointment_time}
                                        onChange={(e) => handleChange('appointment_time', e.target.value)}
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                        required
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
                                        onChange={(e) => handleChange('appointment_date', e.target.value)}
                                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors"
                                        required
                                    />
                                    <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* تحديد المساعد */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                تحديد المساعد
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.assistant_id}
                                    onChange={handleAssistantSelect}
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors appearance-none"
                                >
                                    <option value="">أسم خليل</option>
                                    {assistants.map(assistant => (
                                        <option key={assistant.user_id} value={assistant.user_id}>
                                            {assistant.full_name}
                                        </option>
                                    ))}
                                </select>
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
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
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d.]/g, '');
                                        handleChange('total_cost', value);
                                    }}
                                    placeholder="2000 دج"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-400"
                                />
                                <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* مكان المختبر من أجل النقل إليه */}
                        <div>
                            <label className="block text-right text-sm mb-1.5 text-gray-600">
                                مكان المختبر من أجل النقل اليه
                            </label>
                            <div className="relative">
                                <textarea
                                    value={formData.address_line1}
                                    onChange={(e) => handleChange('address_line1', e.target.value)}
                                    placeholder="عنوان حي الإستقلال"
                                    rows="2"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right text-gray-700 focus:outline-none focus:border-teal-500 transition-colors resize-none placeholder:text-gray-400"
                                    required
                                />
                                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* حالة استعجالية */}
                        <div className="flex items-center justify-end gap-2 py-2">
                            <label className="text-sm text-gray-600 cursor-pointer select-none">
                                حالة استعجالية
                            </label>
                            <input
                                type="checkbox"
                                checked={formData.is_urgent}
                                onChange={(e) => handleUrgentChange(e.target.checked)}
                                className="w-5 h-5 text-teal-600 bg-gray-50 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                            />
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
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'جاري الحفظ...' : 'تأكيد المعلومات'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAppointmentModal;
