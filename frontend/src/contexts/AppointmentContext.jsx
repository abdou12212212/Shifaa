import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAppointmentApi } from '../services/appointmentApi';

const AppointmentContext = createContext();

export const useAppointments = () => {
    const context = useContext(AppointmentContext);
    if (!context) {
        throw new Error('useAppointments must be used within an AppointmentProvider');
    }
    return context;
};

export const AppointmentProvider = ({ children }) => {
    const appointmentApi = useAppointmentApi();

    // State
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        date_from: '',
        date_to: '',
        assistant_id: null,
        doctor_id: null,
        is_urgent: undefined
    });
    const [stats, setStats] = useState(null);
    const [availableAssistants, setAvailableAssistants] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    // Fetch appointments with filters
    const fetchAppointments = useCallback(async (customFilters = null) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/appointment/status/coming', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
const data = await response.json();

            if (data.success) {
                setAppointments(data.data || []);
            } else {
                setError(data.msg || 'فشل في جلب المواعيد');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('[AppointmentContext] Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, appointmentApi]);

    // Fetch appointment details
    const fetchAppointmentDetails = useCallback(async (appointmentId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentApi.getAppointmentDetails(appointmentId);

            if (response.success) {
                setSelectedAppointment(response.data.appointment);
                return response.data;
            } else {
                setError(response.message || 'فشل في جلب تفاصيل الموعد');
                return null;
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('[AppointmentContext] Error fetching appointment details:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [appointmentApi]);

    // Create appointment
    const createAppointment = useCallback(async (appointmentData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentApi.createAppointment(appointmentData);

            if (response.success) {
                // Optimistic update: add to list
                await fetchAppointments();
                return { success: true, data: response.data };
            } else {
                setError(response.message || 'فشل في إنشاء الموعد');
                return { success: false, error: response.message };
            }
        } catch (err) {
            const errorMsg = 'خطأ في الاتصال بالخادم';
            setError(errorMsg);
            console.error('[AppointmentContext] Error creating appointment:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [appointmentApi, fetchAppointments]);

    // Update appointment
    const updateAppointment = useCallback(async (appointmentId, updateData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentApi.updateAppointment(appointmentId, updateData);

            if (response.success) {
                // Optimistic update: update in list
                setAppointments(prev =>
                    prev.map(app =>
                        app.appointment_id === appointmentId
                            ? { ...app, ...updateData }
                            : app
                    )
                );
                return { success: true };
            } else {
                setError(response.message || 'فشل في تحديث الموعد');
                return { success: false, error: response.message };
            }
        } catch (err) {
            const errorMsg = 'خطأ في الاتصال بالخادم';
            setError(errorMsg);
            console.error('[AppointmentContext] Error updating appointment:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [appointmentApi]);

    // Update appointment status
    const updateAppointmentStatus = useCallback(async (appointmentId, status, lab_notes = '') => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentApi.updateAppointmentStatus(appointmentId, status, lab_notes);

            if (response.success) {
                // Optimistic update
                setAppointments(prev =>
                    prev.map(app =>
                        app.appointment_id === appointmentId
                            ? { ...app, status, lab_notes }
                            : app
                    )
                );
                return { success: true };
            } else {
                setError(response.message || 'فشل في تحديث حالة الموعد');
                return { success: false, error: response.message };
            }
        } catch (err) {
            const errorMsg = 'خطأ في الاتصال بالخادم';
            setError(errorMsg);
            console.error('[AppointmentContext] Error updating status:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [appointmentApi]);

    // Delete appointment
    const deleteAppointment = useCallback(async (appointmentId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentApi.deleteAppointment(appointmentId);

            if (response.success) {
                // Optimistic update: remove from list
                setAppointments(prev => prev.filter(app => app.appointment_id !== appointmentId));
                return { success: true };
            } else {
                setError(response.message || 'فشل في حذف الموعد');
                return { success: false, error: response.message };
            }
        } catch (err) {
            const errorMsg = 'خطأ في الاتصال بالخادم';
            setError(errorMsg);
            console.error('[AppointmentContext] Error deleting appointment:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [appointmentApi]);

    // Assign assistant
    const assignAssistant = useCallback(async (appointmentId, assistant_id) => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentApi.assignAssistant(appointmentId, assistant_id);

            if (response.success) {
                // Refresh appointments to get updated assistant info
                await fetchAppointments();
                return { success: true };
            } else {
                setError(response.message || 'فشل في تعيين المساعد');
                return { success: false, error: response.message };
            }
        } catch (err) {
            const errorMsg = 'خطأ في الاتصال بالخادم';
            setError(errorMsg);
            console.error('[AppointmentContext] Error assigning assistant:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [appointmentApi, fetchAppointments]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await appointmentApi.getAppointmentStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('[AppointmentContext] Error fetching stats:', err);
        }
    }, [appointmentApi]);

    // Fetch available assistants
    const fetchAvailableAssistants = useCallback(async () => {
        try {
            const response = await appointmentApi.getAvailableAssistants();
            if (response.success) {
                setAvailableAssistants(response.data || []);
            }
        } catch (err) {
            console.error('[AppointmentContext] Error fetching assistants:', err);
        }
    }, [appointmentApi]);

    // Update filters
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        // State
        appointments,
        selectedAppointment,
        loading,
        error,
        filters,
        stats,
        availableAssistants,
        selectedDate,

        // Actions
        fetchAppointments,
        fetchAppointmentDetails,
        createAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        assignAssistant,
        fetchStats,
        fetchAvailableAssistants,
        updateFilters,
        setSelectedAppointment,
        setSelectedDate,
        clearError
    };

    return (
        <AppointmentContext.Provider value={value}>
            {children}
        </AppointmentContext.Provider>
    );
};
