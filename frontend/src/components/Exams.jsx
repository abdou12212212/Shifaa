import { useState, useEffect, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { useApi } from "../services/api";

function Exams() {
  // State management
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);

  const { apiCall } = useApi();
  console.log(tests);

  // Fetch tests on component mount
  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall("/test");
      setTests(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchTests();
  }, []);

  // Filter tests based on search term
  const filteredTests = tests.filter(
    (test) =>
      test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.test_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // View test details
  const handleViewDetails = async (testId) => {
    try {
      const testDetails = await apiCall(`/test/${testId}`);
      setSelectedTest(testDetails);
    } catch (err) {
      console.error("Error fetching test details:", err);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header with Search */}
      <div className="flex justify-end items-center">
        <div className="relative w-80">
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full h-10 pl-10 pr-4 bg-[#F3FAF9] border-2 border-teal-600 rounded-lg text-right placeholder:text-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="إبحث عن مقصدك هنا"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-600" />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Test Code Display (Top Right) */}
        {selectedTest && (
          <div className="flex justify-end p-4 border-b border-teal-100">
            <div className="text-2xl font-bold text-teal-900">
              {selectedTest.test_code}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Right Section - Test Details */}
          <div className="space-y-4 order-1 lg:order-2">
            <div>
              <div className="bg-teal-600 text-white rounded-t-lg p-4 text-center font-semibold">
                الوصف
              </div>
              <div className="bg-gray-50 rounded-b-lg p-6" dir="rtl">
                {selectedTest ? (
                  <div className="space-y-3">
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        عنوان :
                      </span>
                      <span className="text-gray-900">
                        {selectedTest.test_name || "-"}
                      </span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        كود :
                      </span>
                      <span className="text-gray-900">
                        {selectedTest.test_code || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">
                    اختر اختبارًا لعرض التفاصيل
                  </p>
                )}
              </div>
            </div>
            {/* User/Results Section */}
            <div>
              <div className="bg-teal-600 text-white rounded-t-lg p-4 text-center font-semibold">
                النتائج
              </div>
              <div
                className="bg-gray-50 rounded-b-lg p-6 min-h-[100px]"
                dir="rtl"
              >
                {selectedTest ? (
                  <div className="space-y-3">
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        وقت التسليم :
                      </span>
                      <span className="text-gray-900">
                        {selectedTest.result_turnaround_time ||
                          selectedTest.turnaround_time ||
                          "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">لا توجد بيانات</p>
                )}
              </div>
            </div>
          </div>

          {/* Left Section - Transfer Conditions and User */}
          <div className="space-y-4 order-2 lg:order-1">
            {/* Transfer Conditions */}
            <div>
              <div className="bg-teal-600 text-white rounded-t-lg p-4 text-center font-semibold">
                نقل و شروط النقل
              </div>
              <div
                className="bg-gray-50 rounded-b-lg p-6 min-h-[100px]"
                dir="rtl"
              >
                {selectedTest ? (
                  <div className="flex items-center gap-8">
                    <div className="space-y-3">
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          العينة :
                        </span>
                        <span className="text-gray-900">
                          {selectedTest.sample_type || "-"}
                        </span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          الحاوية :
                        </span>
                        {selectedTest.container_type ? (
                          <div
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: selectedTest.container_type }}
                            title={selectedTest.container_type}
                          ></div>
                        ) : (
                          <span className="text-gray-900">-</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 ">
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          وقت التسليم :
                        </span>
                        <span className="text-gray-900">
                          {selectedTest.turnaround_time || "-"}
                        </span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          شروط التسليم :
                        </span>
                        <span className="text-gray-900">
                          {selectedTest.pre_test_instructions || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">لا توجد بيانات</p>
                )}
              </div>
            </div>

            <div>
              <div className="bg-teal-600 text-white rounded-t-lg p-4 text-center font-semibold">
                مستعجل
              </div>
              <div
                className="bg-gray-50 rounded-b-lg p-6 min-h-[100px]"
                dir="rtl"
              >
                {selectedTest ? (
                  <div className="space-y-3">
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        عنوان :
                      </span>
                      <span className="text-gray-900">
                        {selectedTest.urgent_test_name ||
                          "-"}
                      </span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        كود :
                      </span>
                      <span className="text-gray-900">
                        {selectedTest.test_code || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">لا توجد بيانات</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="p-6 border-t border-teal-100">
          <div className="bg-teal-600 text-white rounded-t-lg p-4 text-center font-semibold">
            السعر
          </div>
          <div className="bg-gray-50 rounded-b-lg p-6 text-center" dir="rtl">
            {selectedTest ? (
              <div className="text-2xl font-bold text-teal-900">
                {selectedTest.price ? `${selectedTest.price} د ج` : "-"}
              </div>
            ) : (
              <p className="text-gray-500">البكتر:</p>
            )}
          </div>
        </div>
      </div>

      {/* Tests List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-teal-900 mb-4 text-right">
          قائمة الاختبارات
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            {error}
            <button
              onClick={fetchTests}
              className="block mx-auto mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            لا توجد اختبارات متاحة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" dir="rtl">
              <thead>
                <tr className="bg-teal-50 border-b-2 border-teal-600">
                  <th className="px-4 py-3 text-right text-teal-900 font-semibold">
                    #
                  </th>
                  <th className="px-4 py-3 text-right text-teal-900 font-semibold">
                    كود الاختبار
                  </th>
                  <th className="px-4 py-3 text-right text-teal-900 font-semibold">
                    اسم الاختبار
                  </th>
                  <th className="px-4 py-3 text-right text-teal-900 font-semibold">
                    السعر
                  </th>
                  <th className="px-4 py-3 text-right text-teal-900 font-semibold">
                    نوع العينة
                  </th>
                  <th className="px-4 py-3 text-right text-teal-900 font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, index) => (
                  <tr
                    key={test.test_id}
                    className={`border-b border-gray-200 hover:bg-teal-50 transition-colors ${
                      selectedTest?.test_id === test.test_id
                        ? "bg-teal-100"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">
                      {test.test_code}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {test.test_name}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {test.price} د ج
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {test.sample_type || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(test.test_id)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Exams;
