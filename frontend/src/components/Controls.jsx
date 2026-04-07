import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaUsers, FaUserMd, FaUserTie, FaWallet } from 'react-icons/fa';
import { useApi } from '../services/api';

function ConnectedAdminDashboard() {
    const { apiCall } = useApi();
    
    // State for dashboard stats
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        assistants: 0,
        portfolio: 0
    });

    // State for appointments
    const [appointments, setAppointments] = useState([]);
    const [appointmentsPagination, setAppointmentsPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    // State for doctors
    const [doctors, setDoctors] = useState([]);
    const [doctorsPagination, setDoctorsPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
        try {
            const data = await apiCall('/admin/dashboard/stats');
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            setError('خطأ في جلب إحصائيات اللوحة');
            console.error('[API ERROR]', '/admin/dashboard/stats', err);
        }
    };

    // Fetch pending appointments
    const fetchPendingAppointments = async (page = 1) => {
        try {
            const data = await apiCall(`/admin/appointments/pending?page=${page}&limit=6`);
            if (data.success) {
                setAppointments(data.data.appointments);
                setAppointmentsPagination(data.data.pagination);
            }
        } catch (err) {
            setError('خطأ في جلب المواعيد المعلقة');
            console.error('[API ERROR]', '/admin/appointments/pending', err);
        }
    };

    // Fetch unverified doctors
    const fetchUnverifiedDoctors = async (page = 1) => {
        try {
            const data = await apiCall(`/admin/doctors/unverified?page=${page}&limit=6`);
            if (data.success) {
                setDoctors(data.data.doctors);
                setDoctorsPagination(data.data.pagination);
            }
        } catch (err) {
            setError('خطأ في جلب الأطباء غير المعتمدين');
            console.error('[API ERROR]', '/admin/doctors/unverified', err);
        }
    };

    // Update appointment status
    const updateAppointmentStatus = async (appointmentId, status) => {
        try {
            const data = await apiCall(`/admin/appointments/${appointmentId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            if (data.success) {
                fetchPendingAppointments(appointmentsPagination.currentPage);
                fetchDashboardStats(); // Refresh stats
            }
        } catch (err) {
            setError('خطأ في تحديث حالة الموعد');
            console.error('[API ERROR]', `/admin/appointments/${appointmentId}/status`, err);
        }
    };

    // Delete appointment
    const deleteAppointment = async (appointmentId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
            try {
                const data = await apiCall(`/admin/appointments/${appointmentId}`, {
                    method: 'DELETE',
                });
                if (data.success) {
                    fetchPendingAppointments(appointmentsPagination.currentPage);
                    fetchDashboardStats(); // Refresh stats
                }
            } catch (err) {
                setError('خطأ في حذف الموعد');
                console.error('[API ERROR]', `/admin/appointments/${appointmentId}`, err);
            }
        }
    };

    // Verify doctor
    const verifyDoctor = async (doctorId, verify) => {
        try {
            const data = await apiCall(`/admin/doctors/${doctorId}/verify`, {
                method: 'PUT',
                body: JSON.stringify({ verify }),
            });
            if (data.success) {
                fetchUnverifiedDoctors(doctorsPagination.currentPage);
                fetchDashboardStats(); // Refresh stats
            }
        } catch (err) {
            setError('خطأ في توثيق الطبيب');
            console.error('[API ERROR]', `/admin/doctors/${doctorId}/verify`, err);
        }
    };

    // Delete doctor application
    const deleteDoctorApplication = async (doctorId) => {
        if (window.confirm('هل أنت متأكد من حذف طلب الطبيب؟')) {
            try {
                const data = await apiCall(`/admin/doctors/${doctorId}`, {
                    method: 'DELETE',
                });
                if (data.success) {
                    fetchUnverifiedDoctors(doctorsPagination.currentPage);
                }
            } catch (err) {
                setError('خطأ في حذف طلب الطبيب');
                console.error('[API ERROR]', `/admin/doctors/${doctorId}`, err);
            }
        }
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchDashboardStats(),
                fetchPendingAppointments(),
                fetchUnverifiedDoctors(),
            ]);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-bold text-teal-600">جاري التحميل...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-bold text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <section className="p-6">
            {/* Dashboard Statistics */}
            <div className="flex items-center justify-center gap-5 font-rubik font-bold text-[32px] leading-[100%] tracking-[0] text-center text-teal-600 mb-8">
                <div className="flex bg-[#F3FAF9] flex-col justify-center items-center border-2 border-teal-600 w-[279.75px] h-[232px] rounded-[16px] pt-[38px] pr-[32px] pb-[38px] pl-[32px] gap-[16px]">
                    <FaUsers className="text-4xl" />
                    <span>مرضى</span>
                    <span>{stats.patients}</span>
                </div>
                <div className="flex bg-[#F3FAF9] flex-col justify-center items-center border-2 border-teal-600 w-[279.75px] h-[232px] rounded-[16px] pt-[38px] pr-[32px] pb-[38px] pl-[32px] gap-[16px]">
                    <FaUserMd className="text-4xl" />
                    <span>أطباء معتمدين</span>
                    <span>{stats.doctors}</span>
                </div>
                <div className="flex bg-[#F3FAF9] flex-col justify-center items-center border-2 border-teal-600 w-[279.75px] h-[232px] rounded-[16px] pt-[38px] pr-[32px] pb-[38px] pl-[32px] gap-[16px]">
                    <FaUserTie className="text-4xl" />
                    <span>مساعدين</span>
                    <span>{stats.assistants}</span>
                </div>
                <div className="flex bg-[#F3FAF9] flex-col justify-center items-center border-2 border-teal-600 w-[279.75px] h-[232px] rounded-[16px] pt-[38px] pr-[32px] pb-[38px] pl-[32px] gap-[16px]">
                    <FaWallet className="text-4xl" />
                    <span>محفظة</span>
                    <span>{stats.portfolio.toLocaleString()} DA</span>
                </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointments Table */}
                <div className="bg-white rounded-2xl shadow border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4 text-center p-4">تأكيد المواعيد</h2>
                    <table dir="rtl" className="min-w-full text-sm text-center text-gray-700 bg-[#F3FAF9]">
                        <thead className="bg-[#4B8B85] text-white text-base font-bold">
                            <tr>
                                <th className="px-4 py-3">رقم الهاتف</th>
                                <th className="px-4 py-3">الاسم</th>
                                <th className="px-4 py-3">العنوان</th>
                                <th className="px-4 py-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appointment) => (
                                <tr key={appointment.appointment_id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3">{appointment.phone_number}</td>
                                    <td className="px-4 py-3">{appointment.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="whitespace-pre-line text-xs">
                                            {appointment.address_line1}
                                            {appointment.address_line2 && `\n${appointment.address_line2}`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 justify-center">
                                            <button
                                                onClick={() => updateAppointmentStatus(appointment.appointment_id, 'Upcoming')}
                                                className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
                                            >
                                                تأكيد
                                            </button>
                                            <button
                                                onClick={() => deleteAppointment(appointment.appointment_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between px-6 py-4 bg-[#F3FAF9]">
                        <span className="font-bold">صفحة {appointmentsPagination.currentPage} من {appointmentsPagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchPendingAppointments(appointmentsPagination.currentPage - 1)}
                                disabled={!appointmentsPagination.hasPrev}
                                className="px-4 py-2 border border-[#4B8B85] text-[#4B8B85] rounded-full hover:bg-[#E7F3F2] disabled:opacity-50"
                            >
                                السابق
                            </button>
                            <button
                                onClick={() => fetchPendingAppointments(appointmentsPagination.currentPage + 1)}
                                disabled={!appointmentsPagination.hasNext}
                                className="px-4 py-2 bg-[#4B8B85] text-white rounded-full hover:bg-[#3a726c] disabled:opacity-50"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                </div>

                {/* Doctors Table */}
                <div className="bg-white rounded-2xl shadow border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4 text-center p-4">توثيق الأطباء</h2>
                    <table dir="rtl" className="min-w-full text-sm text-center text-gray-700 bg-[#F3FAF9]">
                        <thead className="bg-[#4B8B85] text-white text-base font-bold">
                            <tr>
                                <th className="px-4 py-3">الاسم</th>
                                <th className="px-4 py-3">رقم الهاتف</th>
                                <th className="px-4 py-3">الحالة</th>
                                <th className="px-4 py-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map((doctor) => (
                                <tr key={doctor.doctor_id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3">{doctor.name}</td>
                                    <td className="px-4 py-3">{doctor.phone_number}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-block text-sm text-red-600 bg-red-100 border border-red-500 px-3 py-1 rounded-full">
                                            غير موثق
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 justify-center">
                                            <button
                                                onClick={() => verifyDoctor(doctor.doctor_id, true)}
                                                className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
                                            >
                                                توثيق
                                            </button>
                                            <button
                                                onClick={() => deleteDoctorApplication(doctor.doctor_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between px-6 py-4 bg-[#F3FAF9]">
                        <span className="font-bold">صفحة {doctorsPagination.currentPage} من {doctorsPagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchUnverifiedDoctors(doctorsPagination.currentPage - 1)}
                                disabled={!doctorsPagination.hasPrev}
                                className="px-4 py-2 border border-[#4B8B85] text-[#4B8B85] rounded-full hover:bg-[#E7F3F2] disabled:opacity-50"
                            >
                                السابق
                            </button>
                            <button
                                onClick={() => fetchUnverifiedDoctors(doctorsPagination.currentPage + 1)}
                                disabled={!doctorsPagination.hasNext}
                                className="px-4 py-2 bg-[#4B8B85] text-white rounded-full hover:bg-[#3a726c] disabled:opacity-50"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ConnectedAdminDashboard;