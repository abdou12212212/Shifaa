import React, { useState, useEffect } from "react";
import { FaTrash, FaEdit, FaUpload, FaEye, FaFilePdf } from "react-icons/fa";
import { useApi } from "../../services/api";
import ResultUploadModal from "../common/ResultUploadModal";
import ResultViewerModal from "../common/ResultViewerModal";

function Next({ searchTerm = '', filters = {} }) {
  const { apiCall } = useApi();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // New state for upload and viewer modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [appointmentResult, setAppointmentResult] = useState(null);

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await apiCall("/admin/tests");

      if (data.success) {
        setAppointments(data.data);
      } else {
        setError("فشل في جلب البيانات");
      }
    } catch (err) {
      setError("خطأ في الاتصال بالخادم");
      console.error("[API ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointment details including result
  const fetchAppointmentDetails = async (appointmentId , testCodes) => {
    try {
      const data = await apiCall(`/admin/appointments/${appointmentId}`);

      if (data.success) {
        setSelectedAppointment({...data.data.appointment , test_codes: testCodes});
        setAppointmentResult(data.data.result || null);
        setShowModal(true);
      } else {
        alert("فشل في جلب تفاصيل الموعد");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالخادم");
      console.error("[API ERROR]", `/admin/appointments/${appointmentId}`, err);
    }
  };

  // Update appointment
  const updateAppointment = async (appointmentId, updateData) => {
    try {
      const data = await apiCall(`/admin/tests/${appointmentId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (data.success) {
        alert("تم تحديث الموعد بنجاح");
        setShowModal(false);
        setEditMode(false);
        fetchAppointments(); // Refresh the list
      } else {
        alert("فشل في تحديث الموعد");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالخادم");
      console.error("[API ERROR]", `/admin/tests/${appointmentId}`, err);
    }
  };

  // Upload test results
  const uploadTestResults = async (appointmentId, testId, fileUrl) => {
    try {
      const data = await apiCall("/admin/tests/results", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: appointmentId,
          test_id: testId,
          result_file_url: fileUrl,
        }),
      });

      if (data.success) {
        alert("تم رفع نتائج التحاليل بنجاح");
        setShowUploadModal(false);
        fetchAppointments(); // Refresh the list
      } else {
        alert("فشل في رفع نتائج التحاليل");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالخادم");
      console.error("[API ERROR]", "/admin/tests/results", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    return (
      appointment.patient_name?.toLowerCase().includes(search) ||
      appointment.patient_phone?.toLowerCase().includes(search) ||
      appointment.appointment_ref_id?.toLowerCase().includes(search) ||
      appointment.test_codes?.toLowerCase().includes(search) ||
      appointment.assistant_name?.toLowerCase().includes(search)
    );
  });

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setEditMode(true);
    setShowModal(true);
  };

  const handleView = (appointment) => {
    fetchAppointmentDetails(appointment.appointment_id , appointment.test_codes);
  };

  const handleSave = () => {
    if (selectedAppointment) {
      updateAppointment(selectedAppointment.appointment_id, {
        appointment_datetime: selectedAppointment.appointment_datetime,
        status: selectedAppointment.status,
        payment_method: selectedAppointment.payment_method,
        total_cost: selectedAppointment.total_cost,
        is_urgent: selectedAppointment.is_urgent,
        patient_notes: selectedAppointment.patient_notes,
        lab_notes: selectedAppointment.lab_notes,
        assistant_id: selectedAppointment.assistant_id,
      });
    }
  };

  const handleUpload = (appointment) => {
    setSelectedAppointment(appointment);
    setShowUploadModal(true);
  };

  const handleViewResult = () => {
    setSelectedResult(appointmentResult);
    setShowViewerModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <span className="text-red-500 text-2xl">✕</span>
        </div>
        <p className="text-red-500 font-semibold">{error}</p>
        <button
          onClick={fetchAppointments}
          className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FaFilePdf className="text-gray-400 text-2xl" />
        </div>
        <p className="text-gray-500 font-semibold">لا توجد نتائج لعرضها</p>
      </div>
    );
  }

  if (filteredAppointments.length === 0 && searchTerm) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FaFilePdf className="text-gray-400 text-2xl" />
        </div>
        <p className="text-gray-500 font-semibold">لا توجد نتائج مطابقة للبحث</p>
        <p className="text-gray-400 text-sm mt-2">حاول البحث بكلمات مختلفة</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Enhanced Table with better styling */}
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        <table
          dir="rtl"
          className="min-w-full text-sm text-gray-700 bg-white border-collapse"
        >
          <thead className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
            <tr>
              <th className="px-6 py-4 text-right font-semibold">
                رقم التعريفي
              </th>
              <th className="px-6 py-4 text-right font-semibold">المريض</th>
              <th className="px-6 py-4 text-right font-semibold">
                رمز التحليل
              </th>
              <th className="px-6 py-4 text-right font-semibold">المساعد</th>
              <th className="px-6 py-4 text-right font-semibold">رقم الهاتف</th>
              <th className="px-6 py-4 text-right font-semibold">التكلفة</th>
              <th className="px-6 py-4 text-right font-semibold">الحالة</th>
              <th className="px-6 py-4 text-center font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAppointments.map((appointment, i) => (
              <tr
                key={i}
                className="hover:bg-teal-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-teal-700">
                    {appointment.appointment_ref_id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {appointment.patient_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {appointment.test_codes || "لا يوجد"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {appointment.assistant_name || "غير محدد"}
                </td>
                <td className="px-6 py-4 text-gray-600" dir="ltr">
                  {appointment.patient_phone}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    {appointment.total_cost} دج
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === "Completed"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : appointment.status === "Pending Confirmation"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : appointment.status === "In Progress"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : appointment.status === "Cancelled"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    {appointment.status === "Completed"
                      ? "مكتمل"
                      : appointment.status === "Pending Confirmation"
                      ? "في الانتظار"
                      : appointment.status === "In Progress"
                      ? "قيد التنفيذ"
                      : appointment.status === "Cancelled"
                      ? "ملغى"
                      : appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 justify-end">
                    {appointment.status !== "Completed" && (
                      <button
                        onClick={() => handleUpload(appointment)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="رفع النتائج"
                      >
                        <FaUpload size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleView(appointment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="عرض التفاصيل"
                    >
                      <FaEye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(appointment)}
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="تعديل"
                    >
                      <FaEdit size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8" dir="rtl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-teal-100">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="width"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? "تعديل الموعد" : "تفاصيل الموعد"}
                </h2>
                <div className="w-6"></div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Appointment Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      رقم التعريفي
                    </label>
                    <input
                      type="text"
                      value={selectedAppointment.appointment_ref_id || ""}
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-800 font-semibold"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      اسم المريض
                    </label>
                    <input
                      type="text"
                      value={selectedAppointment.patient_name || ""}
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-800 font-semibold"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="text"
                      value={selectedAppointment.patient_phone || ""}
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-800"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      التكلفة (دج)
                    </label>
                    <input
                      type="number"
                      value={selectedAppointment.total_cost || ""}
                      disabled={!editMode}
                      onChange={(e) =>
                        setSelectedAppointment({
                          ...selectedAppointment,
                          total_cost: e.target.value,
                        })
                      }
                      className={`w-full p-3 border border-gray-200 rounded-lg ${
                        editMode ? "bg-white" : "bg-gray-100"
                      }`}
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      الحالة
                    </label>
                    <select
                      value={selectedAppointment.status || ""}
                      disabled={!editMode}
                      onChange={(e) =>
                        setSelectedAppointment({
                          ...selectedAppointment,
                          status: e.target.value,
                        })
                      }
                      className={`w-full p-3 border border-gray-200 rounded-lg ${
                        editMode ? "bg-white" : "bg-gray-100"
                      }`}
                    >
                      <option value="Pending Confirmation">في الانتظار</option>
                      <option value="Upcoming">قادم</option>
                      <option value="In Progress">قيد التنفيذ</option>
                      <option value="Completed">مكتمل</option>
                      <option value="Cancelled">ملغى</option>
                    </select>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      طريقة الدفع
                    </label>
                    <select
                      value={selectedAppointment.payment_method || "cash"}
                      disabled={!editMode}
                      onChange={(e) =>
                        setSelectedAppointment({
                          ...selectedAppointment,
                          payment_method: e.target.value,
                        })
                      }
                      className={`w-full p-3 border border-gray-200 rounded-lg ${
                        editMode ? "bg-white" : "bg-gray-100"
                      }`}
                    >
                      <option value="cash">نقداً</option>
                      <option value="card">بطاقة</option>
                      <option value="insurance">تأمين</option>
                    </select>
                  </div>
                </div>

                {/* Tests Info */}
                <div className="bg-teal-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    التحاليل المطلوبة
                  </label>
                  <input
                    type="text"
                    value={selectedAppointment.test_codes || ""}
                    disabled
                    className="w-full p-3 border border-teal-200 rounded-lg bg-white text-gray-800"
                  />
                </div>

                {/* Notes Section */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      ملاحظات المريض
                    </label>
                    <textarea
                      value={selectedAppointment.patient_notes || ""}
                      disabled={!editMode}
                      onChange={(e) =>
                        setSelectedAppointment({
                          ...selectedAppointment,
                          patient_notes: e.target.value,
                        })
                      }
                      className={`w-full p-3 border border-gray-200 rounded-lg ${
                        editMode ? "bg-white" : "bg-gray-100"
                      }`}
                      rows="3"
                      placeholder="لا توجد ملاحظات"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      ملاحظات المختبر
                    </label>
                    <textarea
                      value={selectedAppointment.lab_notes || ""}
                      disabled={!editMode}
                      onChange={(e) =>
                        setSelectedAppointment({
                          ...selectedAppointment,
                          lab_notes: e.target.value,
                        })
                      }
                      className={`w-full p-3 border border-gray-200 rounded-lg ${
                        editMode ? "bg-white" : "bg-gray-100"
                      }`}
                      rows="3"
                      placeholder="لا توجد ملاحظات"
                    />
                  </div>
                </div>

                {/* Results Section */}
                {appointmentResult && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-green-800 mb-3">
                      النتيجة المرفوعة
                    </label>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                      <button
                        onClick={handleViewResult}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        عرض النتيجة
                      </button>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          نتيجة التحليل
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(appointmentResult.uploaded_at).toLocaleDateString(
                            "ar-DZ"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditMode(false);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    {editMode ? "إلغاء" : "إغلاق"}
                  </button>
                  {editMode && (
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                      حفظ التغييرات
                    </button>
                  )}
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                      تعديل
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <ResultUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        appointment={selectedAppointment}
        onUpload={uploadTestResults}
      />

      {/* Result Viewer Modal */}
      <ResultViewerModal
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        result={selectedResult}
        appointment={selectedAppointment}
      />
    </div>
  );
}

export default Next;
