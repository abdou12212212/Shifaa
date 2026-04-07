/**
 * Result Form Modal - Arabic RTL Support
 * Modal for creating/editing analysis results with file upload and searchable tests
 */

import { useEffect, useState } from 'react';
import { FaTimes, FaPhone, FaCalendarAlt, FaUpload, FaIdCard, FaUser, FaTrash, FaFilePdf, FaFileImage } from 'react-icons/fa';
import { useAppointmentApi } from '../../services/appointmentApi';
import { useTestResultsApi } from '../../services/testResultsApi';

const ResultFormModal = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
  mode = 'create',
}) => {
  const appointmentApi = useAppointmentApi();
  const testResultsApi = useTestResultsApi();

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    patient_id: '',
    appointment_ref_id: '',
    doctor_name: '',
    doctor_phone: '',
    test_id: '',
    test_name: '',
    test_code: '',
    analysis_date: '',
    analysis_price: '',
    result_file: null,
  });

  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search states
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicalTests, setMedicalTests] = useState([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [searchTest, setSearchTest] = useState('');

  // Fetch patients based on search
  useEffect(() => {
    if (searchPatient && open) {
      const timer = setTimeout(() => {
        fetchPatients(searchPatient);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPatients([]);
    }
  }, [searchPatient, open]);

  // Fetch doctors based on search
  useEffect(() => {
    if (searchDoctor && open) {
      const timer = setTimeout(() => {
        fetchDoctors(searchDoctor);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDoctors([]);
    }
  }, [searchDoctor, open]);

  // Fetch tests based on search
  useEffect(() => {
    if (searchTest && open) {
      const timer = setTimeout(() => {
        fetchMedicalTests(searchTest);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setMedicalTests([]);
    }
  }, [searchTest, open]);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        patient_name: initialData.patient_name || '',
        patient_phone: initialData.patient_phone || '',
        patient_id: initialData.patient_id || '',
        appointment_ref_id: initialData.appointment_ref_id || '',
        doctor_name: initialData.doctor_name || '',
        doctor_phone: initialData.doctor_phone || '',
        test_id: initialData.test_id || '',
        test_name: initialData.test_name || '',
        test_code: initialData.test_code || '',
        analysis_date: initialData.analysis_date || '',
        analysis_price: initialData.analysis_price || '',
        result_file: null,
      });
    } else {
      resetForm();
    }
  }, [initialData, mode, open]);

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

  const handleTestSelect = (test) => {
    setFormData(prev => ({
      ...prev,
      test_id: test.test_id,
      test_name: test.test_name,
      test_code: test.test_code,
      analysis_price: test.price || ''
    }));
    setSearchTest('');
    setMedicalTests([]);
  };

  const resetForm = () => {
    setFormData({
      patient_name: '',
      patient_phone: '',
      patient_id: '',
      appointment_ref_id: '',
      doctor_name: '',
      doctor_phone: '',
      test_id: '',
      test_name: '',
      test_code: '',
      analysis_date: '',
      analysis_price: '',
      result_file: null,
    });
    setErrors({});
    setSelectedFile(null);
    setFilePreview(null);
    setSearchPatient('');
    setSearchDoctor('');
    setSearchTest('');
    setPatients([]);
    setDoctors([]);
    setMedicalTests([]);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (PDF, PNG, JPG, JPEG)
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('يرجى اختيار ملف PDF أو صورة (PNG, JPG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.patient_name.trim()) {
      newErrors.patient_name = 'اسم المريض مطلوب';
    }

    if (!formData.patient_phone.trim()) {
      newErrors.patient_phone = 'رقم الهاتف مطلوب';
    }

    if (!formData.test_id) {
      newErrors.test_id = 'يجب اختيار الفحص';
    }

    if (!formData.analysis_date.trim()) {
      newErrors.analysis_date = 'تاريخ التحليل مطلوب';
    }

    if (mode === 'create' && !selectedFile) {
      newErrors.result_file = 'يجب رفع ملف النتيجة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let fileUrl = null;

      // Step 1: Upload file if selected
      if (selectedFile) {
        const uploadResponse = await testResultsApi.uploadFile(
          selectedFile,
          formData.appointment_ref_id || 'temp',
          formData.test_id,
          (progress) => setUploadProgress(progress)
        );

        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'فشل رفع الملف');
        }

        fileUrl = uploadResponse.data.fileUrl;
      }

      // Step 2: Prepare submission data
      const submitData = {
        patient_id: formData.patient_id || null,
        patient_name: formData.patient_name || '',
        patient_phone: formData.patient_phone || '',
        doctor_id: formData.doctor_id || null,
        doctor_name: formData.doctor_name || '',
        doctor_phone: formData.doctor_phone || '',
        test_id: formData.test_id || null,
        test_name: formData.test_name || '',
        test_code: formData.test_code || '',
        analysis_date: formData.analysis_date || '',
        analysis_price: parseFloat(formData.analysis_price) || 0,
        result_file_url: fileUrl || '',
        appointment_ref_id: formData.appointment_ref_id || ''
      };

      console.log('Submitting data:', submitData);

      // Step 3: Call onSubmit with prepared data
      if (mode === 'edit') {
        // Use appointment_id as the ID for result updates
        const appointmentId = initialData.appointment_id || initialData.id;
        await onSubmit({ id: appointmentId, data: submitData });
      } else {
        await onSubmit(submitData);
      }

      // Success - reset and close
      alert('تم حفظ النتيجة بنجاح');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isLoading && !uploading) {
      resetForm();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleClose}
              disabled={isLoading || uploading}
              className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center flex-1">
              {mode === 'create' ? 'إضافة نتيجة جديدة' : 'تعديل النتيجة'}
            </h2>
            <div className="w-6"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Name - Searchable */}
            <div>
              <label className="block text-right text-sm mb-1.5 text-gray-600">
                اسم المريض <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.patient_name || searchPatient}
                  onChange={(e) => {
                    setSearchPatient(e.target.value);
                    handleChange('patient_name', e.target.value);
                  }}
                  placeholder="ابحث عن المريض"
                  disabled={isLoading || uploading}
                  className={`w-full px-4 py-2.5 pr-10 bg-gray-50 border rounded-lg text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    errors.patient_name ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

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
              {errors.patient_name && (
                <p className="text-xs text-red-500 text-right mt-1">{errors.patient_name}</p>
              )}
            </div>

            {/* Patient Phone */}
            <div>
              <label className="block text-right text-sm mb-1.5 text-gray-600">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.patient_phone}
                  onChange={(e) => handleChange('patient_phone', e.target.value)}
                  placeholder="0556665726"
                  disabled={isLoading || uploading}
                  className={`w-full px-4 py-2.5 pr-10 bg-gray-50 border rounded-lg text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    errors.patient_phone ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              {errors.patient_phone && (
                <p className="text-xs text-red-500 text-right mt-1">{errors.patient_phone}</p>
              )}
            </div>

            {/* Test Selection - Searchable */}
            <div>
              <label className="block text-right text-sm mb-1.5 text-gray-600">
                نوع التحليل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.test_name || searchTest}
                  onChange={(e) => {
                    setSearchTest(e.target.value);
                    handleChange('test_name', e.target.value);
                  }}
                  placeholder="ابحث عن الفحص"
                  disabled={isLoading || uploading}
                  className={`w-full px-4 py-2.5 pr-10 bg-gray-50 border rounded-lg text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    errors.test_id ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

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
              {errors.test_id && (
                <p className="text-xs text-red-500 text-right mt-1">{errors.test_id}</p>
              )}
            </div>

            {/* Test Code & Appointment Ref */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-right text-sm mb-1.5 text-gray-600">
                  كود الفحص
                </label>
                <input
                  type="text"
                  value={formData.test_code}
                  readOnly
                  placeholder="#111111111"
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-right placeholder:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-right text-sm mb-1.5 text-gray-600">
                  الرقم التعريفي للموعد
                </label>
                <input
                  type="text"
                  value={formData.appointment_ref_id}
                  onChange={(e) => handleChange('appointment_ref_id', e.target.value)}
                  placeholder="#111111111"
                  disabled={isLoading || uploading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Doctor Name - Searchable */}
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
                  placeholder="ابحث عن الطبيب"
                  disabled={isLoading || uploading}
                  className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

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

            {/* Analysis Date & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-right text-sm mb-1.5 text-gray-600">
                  تاريخ إنتهاء التحليل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.analysis_date}
                    onChange={(e) => handleChange('analysis_date', e.target.value)}
                    disabled={isLoading || uploading}
                    className={`w-full px-4 py-2.5 pr-10 bg-gray-50 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                      errors.analysis_date ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                {errors.analysis_date && (
                  <p className="text-xs text-red-500 text-right mt-1">{errors.analysis_date}</p>
                )}
              </div>
              <div>
                <label className="block text-right text-sm mb-1.5 text-gray-600">
                  سعر التحليل
                </label>
                <input
                  type="text"
                  value={formData.analysis_price ? `${formData.analysis_price} دج` : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, '');
                    handleChange('analysis_price', value);
                  }}
                  placeholder="1400 دج"
                  disabled={isLoading || uploading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-right text-sm mb-1.5 text-gray-600">
                تحميل التحليل {mode === 'create' && <span className="text-red-500">*</span>}
              </label>

              {!selectedFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-600 rounded-xl cursor-pointer bg-teal-50 hover:bg-teal-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaUpload className="text-teal-600 text-3xl mb-2" />
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">انقر للرفع</span> أو اسحب الملف هنا
                    </p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG (حتى 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    disabled={isLoading || uploading}
                  />
                </label>
              ) : (
                <div className="border-2 border-teal-600 rounded-xl p-4 bg-teal-50">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isLoading || uploading}
                      className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      <FaTrash size={18} />
                    </button>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {selectedFile.type === 'application/pdf' ? (
                        <FaFilePdf className="text-red-500 text-3xl" />
                      ) : (
                        <FaFileImage className="text-blue-500 text-3xl" />
                      )}
                    </div>
                  </div>

                  {/* Image Preview */}
                  {filePreview && (
                    <div className="mt-4">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-32 object-contain rounded-lg bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
              {errors.result_file && (
                <p className="text-xs text-red-500 text-right mt-1">{errors.result_file}</p>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{uploadProgress}%</span>
                  <span>جاري الرفع...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading || uploading}
                className="flex-1 px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isLoading || uploading}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {isLoading || uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {uploading ? 'جاري الرفع...' : 'جاري المعالجة...'}
                  </div>
                ) : (
                  'تأكيد المعلومات'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResultFormModal;
