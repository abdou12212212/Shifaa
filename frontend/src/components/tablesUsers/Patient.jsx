import { FaTrash, FaEdit } from 'react-icons/fa';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useApi } from '../../services/api';

const Patient = forwardRef(({ searchQuery = '' }, ref) => {
    const { apiCall } = useApi();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        date_of_birth: '',
        gender: '',
        is_active: true
    });
    const [isEditing, setIsEditing] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filter patients based on search query
    const filteredRows = rows.filter(patient => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = patient.full_name?.toLowerCase() || '';
        const phoneNumber = patient.phone_number?.toLowerCase() || '';
        return fullName.includes(query) || phoneNumber.includes(query);
    });

    // Fetch patients from backend
    const fetchPatients = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiCall('/admin/patients');
            
            if (data.success) {
                setRows(data.data.patients);
                setCurrentPage(data.data.pagination.currentPage);
                setTotalPages(data.data.pagination.totalPages);
                setTotalItems(data.data.pagination.totalItems);
            } else {
                throw new Error(data.message || 'Failed to fetch patients');
            }
        } catch (err) {
            setError(err.message);
            console.error('[API ERROR]', '/admin/patients', err);
        } finally {
            setLoading(false);
        }
    };

    // Load patients on component mount
    useEffect(() => {
        fetchPatients();
    }, []);

    // Expose handleAddClick to parent component
    useImperativeHandle(ref, () => ({
        openAddForm: handleAddClick
    }));

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle delete click
    const handleDeleteClick = (index) => {
        setSelectedIndex(index);
        setSelectedPatient(rows[index]);
        setShowConfirm(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!selectedPatient) return;
        
        setLoading(true);
        try {
            const result = await apiCall(`/admin/patients/${selectedPatient.user_id}`, {
                method: 'DELETE',
            });
            
            if (result.success) {
                // Refresh the patients list
                await fetchPatients(currentPage);
                setShowConfirm(false);
                setSelectedIndex(null);
                setSelectedPatient(null);
            } else {
                throw new Error(result.message || 'Failed to delete patient');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error deleting patient:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowConfirm(false);
        setSelectedIndex(null);
        setSelectedPatient(null);
    };

    // Handle edit click
    const handleEditClick = (patient) => {
        setFormData({
            full_name: patient.full_name || '',
            phone_number: patient.phone_number || '',
            date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
            gender: patient.gender || '',
            is_active: patient.is_active
        });
        setSelectedPatient(patient);
        setIsEditing(true);
        setShowForm(true);
    };

    // Handle add new patient
    const handleAddClick = () => {
        setFormData({
            full_name: '',
            phone_number: '',
            date_of_birth: '',
            gender: '',
            is_active: true
        });
        setSelectedPatient(null);
        setIsEditing(false);
        setShowForm(true);
    };

    // Submit form (create or update)
    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const url = isEditing 
                ? `/admin/patients/${selectedPatient.user_id}` 
                : '/admin/patients';
            
            const method = isEditing ? 'PUT' : 'POST';
            
            const result = await apiCall(url, {
                method: method,
                body: JSON.stringify(formData)
            });

            if (result.success) {
                await fetchPatients(currentPage);
                setShowForm(false);
                setSelectedPatient(null);
                setIsEditing(false);
            } else {
                throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} patient`);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error submitting form:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cancel form
    const cancelForm = () => {
        setShowForm(false);
        setSelectedPatient(null);
        setIsEditing(false);
        setFormData({
            full_name: '',
            phone_number: '',
            date_of_birth: '',
            gender: '',
            is_active: true
        });
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-SA');
    };

    // Calculate age
    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return '';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (loading && rows.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <section>
            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Patients Table */}
            <div className="mt-6 overflow-hidden rounded-xl shadow-sm">
                <table dir="rtl" className="min-w-full text-sm text-center text-gray-700 bg-white border-collapse">
                    <thead className="bg-[#4B8B85] text-white text-base font-bold">
                        <tr>
                            <th className="px-6 py-4">رقم التعريفي</th>
                            <th className="px-6 py-4">إسم المريض</th>
                            <th className="px-6 py-4">عمر</th>
                            <th className="px-6 py-4">جنس</th>
                            <th className="px-6 py-4">رقم الهاتف</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد مرضى مسجلين'}
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((patient, i) => (
                            <tr key={patient.user_id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                i % 2 === 0 ? 'bg-white' : 'bg-[#D1FAE5]/30'
                            }`}>
                                <td className="px-6 py-4 font-medium">#{patient.user_id}</td>
                                <td className="px-6 py-4">{patient.full_name}</td>
                                <td className="px-6 py-4">{calculateAge(patient.date_of_birth)}</td>
                                <td className="px-6 py-4">{patient.gender === 'Male' ? 'ذكر' : patient.gender === 'Female' ? 'أنثى' : patient.gender}</td>
                                <td className="px-6 py-4">{patient.phone_number}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                        patient.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {patient.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 justify-center">
                                        <button
                                            className="text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
                                            onClick={() => handleDeleteClick(i)}
                                            disabled={loading}
                                            title="حذف"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                        <button
                                            className="text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
                                            onClick={() => handleEditClick(patient)}
                                            disabled={loading}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                    <button
                        onClick={() => fetchPatients(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 bg-teal-600 text-white rounded disabled:opacity-50"
                    >
                        السابق
                    </button>
                    <span className="px-3 py-1">
                        صفحة {currentPage} من {totalPages}
                    </span>
                    <button
                        onClick={() => fetchPatients(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 bg-teal-600 text-white rounded disabled:opacity-50"
                    >
                        التالي
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showConfirm && (
                <div className="fixed top-0 right-0 left-0 bottom-0 bg-white/50 bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-[#F3FAF9] p-6 rounded-xl shadow-md text-center w-[650px] h-[200px] flex flex-col items-center justify-center">
                        <p className="mb-4 text-lg font-medium">
                            هل انت متأكد من حذف المريض "{selectedPatient?.full_name}"؟ لن تستطيع الوصول إليه فيما بعد
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[300px] rounded-full disabled:opacity-50"
                                disabled={loading}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-teal-600 text-white px-4 py-2 rounded-full w-[300px] hover:bg-teal-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'جاري الحذف...' : 'نعم , تأكيد'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Form Modal */}
            {showForm && (
                <div className="fixed top-0 right-0 left-0 bottom-0 bg-white/50 bg-opacity-40 flex items-center justify-center z-50">
                    <div className='bg-[#F3FAF9] flex flex-col justify-start items-center rounded-3xl'>
                        <div className="p-6 shadow-md max-w-3xl mx-auto text-right space-y-4">
                            <h2 className="text-2xl font-bold mb-4 text-center">
                                {isEditing ? 'تعديل معلومات المريض' : 'إضافة مريض جديد'}
                            </h2>
                            
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Patient Name */}
                                <div>
                                    <label className="block text-gray-700 mb-1">إسم المريض</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="أنس خليل"
                                        className="w-full border rounded-xl px-4 py-2 pr-4 text-right placeholder-gray-400"
                                        required
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-gray-700 mb-1">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        placeholder="0556655726"
                                        className="w-full border rounded-xl px-4 py-2 pr-4 text-right placeholder-gray-400"
                                        required
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-gray-700 mb-1">تاريخ الميلاد</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-xl px-4 py-2 pr-4 text-right"
                                        required
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-gray-700 mb-1">الجنس</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-xl px-4 py-2 pr-4 text-right"
                                        required
                                    >
                                        <option value="">اختر الجنس</option>
                                        <option value="Male">ذكر</option>
                                        <option value="Female">أنثى</option>
                                    </select>
                                </div>

                                {/* Status (only for editing) */}
                                {isEditing && (
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    is_active: e.target.checked
                                                }))}
                                                className="rounded"
                                            />
                                            <span className="text-gray-700">المريض نشط</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[300px] rounded-full disabled:opacity-50"
                                    disabled={loading}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="bg-teal-600 text-white px-4 py-2 rounded-full w-[300px] hover:bg-teal-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'جاري الحفظ...' : (isEditing ? 'تحديث' : 'إضافة')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});

Patient.displayName = 'Patient';

export default Patient;