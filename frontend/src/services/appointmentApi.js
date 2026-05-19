import { useApi } from './api';

/**
 * Appointment API Service
 * Provides all appointment-related API endpoints based on ADMIN_API_DOCUMENTATION.md
 */

export const useAppointmentApi = () => {
    const { apiCall } = useApi();

    return {
        // Get all appointments with filtering
getAppointments: async (filters = {}) => {
    // ✅ إذا كان الفلتر يطلب المواعيد القادمة
    if (filters.status === 'Upcoming') {
        return await apiCall('/appointment/status/coming');
    }
    
    // ✅ إذا كان الفلتر يطلب المواعيد القديمة
    if (filters.status === 'old') {
        return await apiCall('/appointment/status/old');
    }
    
    // ✅ إذا كان الفلتر يطلب النتائج
    if (filters.status === 'results') {
        return await apiCall('/appointment/status/results');
    }
    
    // ✅ إذا كان الفلتر يطلب المواعيد المؤكدة
    if (filters.status === 'programmed') {
        return await apiCall('/appointment/status/programmed');
    }
    
    // ✅ الوضع الافتراضي - كل المواعيد (للوحة التحكم)
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.assistant_id) params.append('assistant_id', filters.assistant_id);
    if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
    if (filters.is_urgent !== undefined) params.append('is_urgent', filters.is_urgent);

    const queryString = params.toString();
    const endpoint = `/admin/appointments${queryString ? `?${queryString}` : ''}`;

    return await apiCall(endpoint);
},


        // Get all appointments with filtering
        getAppointments: async (filters = {}) => {
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.status && filters.status !== 'all') params.append('status', filters.status);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.assistant_id) params.append('assistant_id', filters.assistant_id);
            if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
            if (filters.is_urgent !== undefined) params.append('is_urgent', filters.is_urgent);

            const queryString = params.toString();
            const endpoint = `/admin/appointments${queryString ? `?${queryString}` : ''}`;

            return await apiCall(endpoint);
        },

        // Get pending appointments
        getPendingAppointments: async (page = 1, limit = 10) => {
            return await apiCall(`/admin/appointments/pending?page=${page}&limit=${limit}`);
        },

        // Get appointment details
        getAppointmentDetails: async (appointmentId) => {
            return await apiCall(`/admin/appointments/${appointmentId}`);
        },

        // Create new appointment
        createAppointment: async (appointmentData) => {
            // Send data with snake_case field names to match the updated controller
            const payload = {
                patient_id: appointmentData.patient_id,
                patient_name: appointmentData.patient_name,
                patient_phone: appointmentData.patient_phone,
                doctor_id: appointmentData.doctor_id || null,
                doctor_name: appointmentData.doctor_name,
                doctor_phone: appointmentData.doctor_phone,
                appointment_datetime: appointmentData.appointment_datetime,
                address_line1: appointmentData.address_line1,
                address_line2: appointmentData.address_line2,
                city: appointmentData.city,
                total_cost: appointmentData.total_cost || 0,
                test_id: appointmentData.test_id || null,
                assistant_id: appointmentData.assistant_id || null,
                payment_method: appointmentData.payment_method || 'Not Selected',
                is_urgent: appointmentData.is_urgent || false,
                patient_notes: appointmentData.patient_notes,
                lab_notes: appointmentData.lab_notes,
                appointment_ref_id: appointmentData.appointment_ref_id
            };

            return await apiCall('/appointment', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },

        // Update appointment status
        updateAppointmentStatus: async (appointmentId, status, lab_notes = '') => {
            return await apiCall(`/admin/appointments/${appointmentId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, lab_notes })
            });
        },

        // Update appointment details
        updateAppointment: async (appointmentId, updateData) => {
            return await apiCall(`/admin/appointments/${appointmentId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            });
        },

        // Assign assistant to appointment
        assignAssistant: async (appointmentId, assistant_id) => {
            return await apiCall(`/admin/appointments/${appointmentId}/assign-assistant`, {
                method: 'PATCH',
                body: JSON.stringify({ assistant_id })
            });
        },

        // Delete appointment
        deleteAppointment: async (appointmentId) => {
            return await apiCall(`/admin/appointments/${appointmentId}`, {
                method: 'DELETE'
            });
        },

        // Get available assistants
        getAvailableAssistants: async () => {
            return await apiCall('/admin/appointments/available-assistants');
        },

        // Get appointment statistics
        getAppointmentStats: async () => {
            return await apiCall('/admin/appointments/stats');
        },

        // Get all patients (for dropdown in create form)
        getPatients: async (search = '') => {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            return await apiCall(`/admin/patients${params}`);
        },

        // Get all doctors (for dropdown in create form)
        getDoctors: async (search = '') => {
            const params = search ? `?search=${encodeURIComponent(search)}&status=verified` : '?status=verified';
            return await apiCall(`/admin/doctors${params}`);
        },

        // Get all assistants (for dropdown)
        getAssistants: async () => {
            return await apiCall('/admin/assistants');
        },

        // Get all medical tests (for dropdown)
        getMedicalTests: async (search = '') => {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            return await apiCall(`/test${params}`);
        },
    };
};

/**
 * Appointment status constants
 */
export const APPOINTMENT_STATUS = {
    PENDING: 'Pending Confirmation',
    UPCOMING: 'Upcoming',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

/**
 * Status color mapping for UI
 */
export const STATUS_COLORS = {
    [APPOINTMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [APPOINTMENT_STATUS.UPCOMING]: 'bg-blue-100 text-blue-800 border-blue-300',
    [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800 border-purple-300',
    [APPOINTMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
    [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800 border-red-300'
};

/**
 * Status labels in Arabic
 */
export const STATUS_LABELS_AR = {
    [APPOINTMENT_STATUS.PENDING]: 'غير مؤكد',
    [APPOINTMENT_STATUS.UPCOMING]: 'قادم',
    [APPOINTMENT_STATUS.IN_PROGRESS]: 'جاري',
    [APPOINTMENT_STATUS.COMPLETED]: 'مكتمل',
    [APPOINTMENT_STATUS.CANCELLED]: 'ملغى'
};

/**
 * Helper function to format appointment datetime
 */
export const formatAppointmentDateTime = (datetime) => {
    const date = new Date(datetime);
    const dateStr = date.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('ar-DZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return { date: dateStr, time: timeStr, full: `${dateStr}, ${timeStr}` };
};

/**
 * Helper function to format address
 */
export const formatAddress = (appointment) => {
    const parts = [
        appointment.address_line1,
        appointment.address_line2,
        appointment.city
    ].filter(Boolean);
    return parts.join(', ') || 'غير محدد';
};

/**
 * Helper function to validate appointment data
 */
export const validateAppointmentData = (data) => {
    const errors = {};

    const patientId = data.patient_id || data.patientId;
    const appointmentDatetime = data.appointment_datetime || data.appointmentDatetime;
    const testId = data.test_id || data.testId;

    if (!patientId) errors.patient_id = 'المريض مطلوب';
    if (!appointmentDatetime) errors.appointment_datetime = 'التاريخ والوقت مطلوبان';
    if (!testId) {
        errors.test_id = 'يجب اختيار فحص واحد';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
