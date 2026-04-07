import { FaTrash, FaEdit, FaSpinner } from 'react-icons/fa';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useApi } from '../../services/api';

const Doctor = forwardRef(({ searchQuery = '' }, ref) => {
    const { apiCall } = useApi();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        clinic_address: '',
        password: '',
        is_verified: false,
        is_featured: false,
        is_active: true
    });

    // Filter doctors based on search query
    const filteredDoctors = doctors.filter(doctor => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = doctor.full_name?.toLowerCase() || '';
        const phoneNumber = doctor.phone_number?.toLowerCase() || '';
        return fullName.includes(query) || phoneNumber.includes(query);
    });

    // Fetch doctors from API
    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiCall('/admin/doctors');

            if (data.success) {
                setDoctors(data.data.doctors);
            } else {
                setError('فشل في تحميل بيانات الأطباء');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('[API ERROR]', '/admin/doctors', err);
        } finally {
            setLoading(false);
        }
    };

    // Delete doctor
    const deleteDoctor = async (doctorId) => {
        try {
            setLoading(true);
            const data = await apiCall(`/admin/doctors/${doctorId}`, {
                method: 'DELETE'
            });

            if (data.success) {
                fetchDoctors(); // Refresh list
            } else {
                setError('فشل في حذف الطبيب');
            }
        } catch (err) {
            setError('خطأ في حذف الطبيب');
            console.error('[API ERROR]', `/admin/doctors/${doctorId}`, err);
        } finally {
            setLoading(false);
        }
    };

    // Create or update doctor
    const saveDoctor = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            const url = editingDoctor
                ? `/admin/doctors/${editingDoctor.user_id}`
                : '/admin/doctors';

            const method = editingDoctor ? 'PUT' : 'POST';

            const data = await apiCall(url, {
                method: method,
                body: JSON.stringify(formData)
            });

            if (data.success) {
                setShowForm(false);
                setEditingDoctor(null);
                fetchDoctors(); // Refresh list
                resetForm();
            } else {
                setError(data.message || 'فشل في حفظ بيانات الطبيب');
            }
        } catch (err) {
            setError('خطأ في حفظ البيانات');
            console.error('[API ERROR]', err);
        } finally {
            setLoading(false);
        }
    };

    // Toggle verification status
    const toggleVerification = async (doctorId) => {
        try {
            const data = await apiCall(`/admin/doctors/${doctorId}/verify`, {
                method: 'PUT'
            });

            if (data.success) {
                fetchDoctors(); // Refresh list
            } else {
                setError('فشل في تغيير حالة التوثيق');
            }
        } catch (err) {
            setError('خطأ في تغيير حالة التوثيق');
            console.error('Error:', err);
        }
    };

    // Load doctors when component mounts
    useEffect(() => {
        fetchDoctors();
    }, []);

    // Expose handleAddClick to parent component
    useImperativeHandle(ref, () => ({
        openAddForm: handleAddClick
    }));

    const handleDeleteClick = (doctor) => {
        setSelectedDoctor(doctor);
        setShowConfirm(true);
    };

    const confirmDelete = () => {
        deleteDoctor(selectedDoctor.user_id);
        setShowConfirm(false);
        setSelectedDoctor(null);
    };

    const cancelDelete = () => {
        setShowConfirm(false);
        setSelectedDoctor(null);
    };

    const handleEditClick = (doctor) => {
        setEditingDoctor(doctor);
        setFormData({
            full_name: doctor.full_name,
            phone_number: doctor.phone_number,
            clinic_address: doctor.clinic_address || '',
            is_verified: doctor.is_verified,
            is_featured: doctor.is_featured,
            is_active: doctor.is_active
        });
        setShowForm(true);
    };

    const handleAddClick = () => {
        setEditingDoctor(null);
        resetForm();
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone_number: '',
            clinic_address: '',
            password: '',
            is_verified: false,
            is_featured: false,
            is_active: true
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingDoctor(null);
        resetForm();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-teal-600 text-2xl" />
                <span className="mr-2">جاري التحميل...</span>
            </div>
        );
    }

    return (
        <section>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                    <button 
                        onClick={() => setError(null)} 
                        className="float-left text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}


            <div className="mt-6 overflow-hidden rounded-xl shadow-sm">
                <table dir="rtl" className="min-w-full text-sm text-center text-gray-700 bg-white border-collapse">
                    <thead className="bg-[#4B8B85] text-white text-base font-bold">
                        <tr>
                            <th className="px-6 py-4">رقم التعريفي</th>
                            <th className="px-6 py-4">إسم الطبيب</th>
                            <th className="px-6 py-4">مكان العيادة</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4">رقم الهاتف</th>
                            <th className="px-6 py-4">عدد المرضى</th>
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filteredDoctors.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد أطباء مسجلين'}
                            </td>
                        </tr>
                    ) : (
                        filteredDoctors.map((doctor, i) => (
                        <tr key={doctor.user_id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            i % 2 === 0 ? 'bg-white' : 'bg-[#D1FAE5]/30'
                        }`}>
                            <td className="px-6 py-4 font-medium">#{doctor.user_id}</td>
                            <td className="px-6 py-4">{doctor.full_name}</td>
                            <td className="px-6 py-4">{doctor.clinic_address || 'غير محدد'}</td>
                            <td className="px-6 py-4">
                                <button
                                    // onClick={() => toggleVerification(doctor.user_id)}
                                    className={`px-4 py-2 rounded-2xl border-2 transition-colors text-sm font-medium ${
                                        doctor.is_verified
                                            ? "border-[#059669] bg-[#D1FAE5] text-green-600 hover:bg-green-100"
                                            : "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                                    }`}
                                >
                                    {doctor.is_verified ? "موثق" : "غير موثق"}
                                </button>
                            </td>
                            <td className="px-6 py-4">{doctor.phone_number}</td>
                            <td className="px-6 py-4 font-medium">{doctor.total_patients || 0}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3 justify-center">
                                    <button
                                        className="text-gray-600 hover:text-red-600 transition-colors"
                                        onClick={() => handleDeleteClick(doctor)}
                                        title="حذف"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                    <button
                                        className="text-gray-600 hover:text-blue-600 transition-colors"
                                        onClick={() => handleEditClick(doctor)}
                                        title="تعديل"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )))}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showConfirm && (
                <div className="fixed top-0 right-0 left-0 bottom-0 bg-white/50 bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-[#F3FAF9] p-6 rounded-xl shadow-md text-center w-[650px] h-[200px] flex flex-col items-center justify-center">
                        <p className="mb-4 text-lg font-medium">هل انت متأكد من حذف هذا الطبيب؟</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[300px] rounded-full"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-teal-600 text-white px-4 py-2 rounded-full w-[300px] hover:bg-teal-700"
                            >
                                نعم، تأكيد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Doctor Form Modal */}
            {showForm && (
                <div className="fixed top-0 right-0 left-0 bottom-0 bg-white/50 bg-opacity-40 flex items-center justify-center z-50">
                    <div className='bg-[#F3FAF9] flex flex-col justify-start items-center rounded-3xl'>
                        <form onSubmit={saveDoctor} className="p-6 shadow-md max-w-3xl mx-auto text-right space-y-4">
                            <h2 className="text-2xl font-bold mb-4 text-center">
                                {editingDoctor ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">إسم الطبيب</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="أدخل اسم الطبيب"
                                        className="w-full border rounded-xl px-4 py-2 text-right"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-1">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        placeholder="0556655726"
                                        className="w-full border rounded-xl px-4 py-2 text-right"
                                        required
                                    />
                                </div>

                                {!editingDoctor && (
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 mb-1">كلمة المرور</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="أدخل كلمة المرور"
                                            className="w-full border rounded-xl px-4 py-2 text-right"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 mb-1">مكان العيادة</label>
                                    <input
                                        type="text"
                                        name="clinic_address"
                                        value={formData.clinic_address}
                                        onChange={handleInputChange}
                                        placeholder="أدخل عنوان العيادة"
                                        className="w-full border rounded-xl px-4 py-2 text-right"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_verified"
                                            checked={formData.is_verified}
                                            onChange={handleInputChange}
                                            className="ml-2"
                                        />
                                        طبيب موثق
                                    </label>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_featured"
                                            checked={formData.is_featured}
                                            onChange={handleInputChange}
                                            className="ml-2"
                                        />
                                        طبيب مميز
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-center gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[300px] rounded-full"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="bg-teal-600 text-white px-4 py-2 rounded-full w-[300px] hover:bg-teal-700"
                                >
                                    {editingDoctor ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
});

Doctor.displayName = 'Doctor';

export default Doctor;