import { FaTrash, FaEdit } from 'react-icons/fa';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useApi } from '../../services/api';

const Assistance = forwardRef(({ searchQuery = '' }, ref) => {
    const { apiCall } = useApi();

    const [assistants, setAssistants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedAssistant, setSelectedAssistant] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        password: ''
    });

    // Filter assistants based on search query
    const filteredAssistants = assistants.filter(assistant => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = assistant.full_name?.toLowerCase() || '';
        const phoneNumber = assistant.phone_number?.toLowerCase() || '';
        return fullName.includes(query) || phoneNumber.includes(query);
    });

    // Fetch assistants from backend
    const fetchAssistants = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiCall('/admin/assistants');

            if (data.success) {
                setAssistants(data.data.assistants);
            } else {
                setError('خطأ في جلب بيانات المساعدين');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('[API ERROR]', '/admin/assistants', err);
        } finally {
            setLoading(false);
        }
    };

    // Load assistants on component mount
    useEffect(() => {
        fetchAssistants();
    }, []);

    // Expose handleAddClick to parent component
    useImperativeHandle(ref, () => ({
        openAddForm: handleAddClick
    }));

    // Handle delete click
    const handleDeleteClick = (assistant) => {
        setSelectedAssistant(assistant);
        setShowConfirm(true);
    };

    // Delete assistant
    const confirmDelete = async () => {
        try {
            setLoading(true);
            const data = await apiCall(`/admin/assistants/${selectedAssistant.user_id}`, {
                method: 'DELETE'
            });

            if (data.success) {
                // Remove from local state
                setAssistants(assistants.filter(a => a.user_id !== selectedAssistant.user_id));
                setShowConfirm(false);
                setSelectedAssistant(null);
            } else {
                setError(data.message || 'خطأ في حذف المساعد');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('[API ERROR]', `/admin/assistants/${selectedAssistant?.user_id}`, err);
        } finally {
            setLoading(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowConfirm(false);
        setSelectedAssistant(null);
    };

    // Handle add new assistant
    const handleAddClick = () => {
        setIsEditing(false);
        setFormData({
            full_name: '',
            phone_number: '',
            password: ''
        });
        setShowForm(true);
    };

    // Handle edit assistant
    const handleEditClick = (assistant) => {
        setIsEditing(true);
        setSelectedAssistant(assistant);
        setFormData({
            full_name: assistant.full_name,
            phone_number: assistant.phone_number,
            password: '' // Don't show password
        });
        setShowForm(true);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Submit form (create or update)
    const handleSubmit = async () => {
        if (!formData.full_name || !formData.phone_number) {
            setError('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        if (!isEditing && !formData.password) {
            setError('كلمة المرور مطلوبة للمساعد الجديد');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const url = isEditing
                ? `/admin/assistants/${selectedAssistant.user_id}`
                : '/admin/assistants';

            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing && !formData.password
                ? { full_name: formData.full_name, phone_number: formData.phone_number }
                : formData;

            const data = await apiCall(url, {
                method,
                body: JSON.stringify(body)
            });

            if (data.success) {
                // Refresh the list
                await fetchAssistants();
                setShowForm(false);
                setSelectedAssistant(null);
                setFormData({
                    full_name: '',
                    phone_number: '',
                    password: ''
                });
            } else {
                setError(data.message || 'خطأ في حفظ البيانات');
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
            console.error('Error saving assistant:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cancel form
    const cancelForm = () => {
        setShowForm(false);
        setSelectedAssistant(null);
        setIsEditing(false);
        setFormData({
            full_name: '',
            phone_number: '',
            password: ''
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">جاري التحميل...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-600 text-lg">{error}</div>
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

            {/* Table */}
            <div className="mt-6 overflow-hidden rounded-xl shadow-sm">
                <table dir="rtl" className="min-w-full text-sm text-center text-gray-700 bg-white border-collapse">
                    <thead className="bg-[#4B8B85] text-white text-base font-bold">
                        <tr>
                            <th className="px-6 py-4">رقم التعريفي</th>
                            <th className="px-6 py-4">إسم المساعد</th>
                            <th className="px-6 py-4">رقم الهاتف</th>
                            <th className="px-6 py-4">عدد المواعيد</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssistants.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد مساعدين مسجلين'}
                                </td>
                            </tr>
                        ) : (
                            filteredAssistants.map((assistant, i) => (
                                <tr key={assistant.user_id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                    i % 2 === 0 ? 'bg-white' : 'bg-[#D1FAE5]/30'
                                }`}>
                                    <td className="px-6 py-4 font-medium">#{assistant.user_id}</td>
                                    <td className="px-6 py-4">{assistant.full_name}</td>
                                    <td className="px-6 py-4">{assistant.phone_number}</td>
                                    <td className="px-6 py-4 font-medium">{assistant.total_appointments || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                            assistant.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {assistant.is_active ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 justify-center">
                                            <button
                                                onClick={() => handleDeleteClick(assistant)}
                                                className="text-gray-600 hover:text-red-600 transition-colors"
                                                title="حذف"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(assistant)}
                                                className="text-gray-600 hover:text-blue-600 transition-colors"
                                                title="تعديل"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showConfirm && (
                <div className="fixed top-0 right-0 left-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#F3FAF9] p-6 rounded-xl shadow-md text-center w-[650px] h-[200px] flex flex-col items-center justify-center">
                        <p className="mb-4 text-lg font-medium">
                            هل أنت متأكد من حذف المساعد "{selectedAssistant?.full_name}"؟
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[300px] rounded-full"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-600 text-white px-4 py-2 rounded-full w-[300px] hover:bg-red-700"
                            >
                                نعم، احذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed top-0 right-0 left-0 bottom-0 bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
                    <div className='bg-[#F3FAF9] flex flex-col justify-start items-center rounded-3xl'>
                        <div className="p-6 shadow-md max-w-3xl mx-auto text-right space-y-4">
                            <h2 className="text-2xl font-bold mb-4 text-center">
                                {isEditing ? 'تعديل المساعد' : 'إضافة مساعد جديد'}
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">إسم المساعد *</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="أدخل اسم المساعد"
                                        className="w-full border rounded-xl px-4 py-2 text-right placeholder-gray-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-1">رقم الهاتف *</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        placeholder="0556655726"
                                        className="w-full border rounded-xl px-4 py-2 text-right placeholder-gray-400"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 mb-1">
                                        كلمة المرور {isEditing ? '(اتركها فارغة لعدم التغيير)' : '*'}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="أدخل كلمة المرور"
                                        className="w-full border rounded-xl px-4 py-2 text-right placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center gap-4 mt-6">
                                <button
                                    onClick={cancelForm}
                                    className="text-gray-800 px-4 py-2 border-2 border-teal-600 w-[150px] rounded-full"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="bg-teal-600 text-white px-4 py-2 rounded-full w-[150px] hover:bg-teal-700"
                                >
                                    {isEditing ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});

Assistance.displayName = 'Assistance';

export default Assistance;