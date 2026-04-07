/**
 * Filter Modal - Arabic RTL Support
 * Allows users to filter results
 */

import { useState, useEffect } from 'react';
import { FaFilter, FaTimes, FaUndo } from 'react-icons/fa';

const FilterModal = ({
  open,
  onClose,
  onApply,
  initialFilters = {},
  activeFiltersCount = 0,
}) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterOption1: '',
    filterOption2: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (open) {
      setFilters({
        searchTerm: initialFilters.searchTerm || '',
        filterOption1: initialFilters.filterOption1 || '',
        filterOption2: initialFilters.filterOption2 || '',
        dateFrom: initialFilters.dateFrom || '',
        dateTo: initialFilters.dateTo || '',
      });
    }
  }, [open, initialFilters]);

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      searchTerm: '',
      filterOption1: '',
      filterOption2: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideInRight" dir="rtl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes size={24} />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">الفلاتر</h2>
              <FaFilter className="text-teal-600" />
              {activeFiltersCount > 0 && (
                <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="w-6"></div>
          </div>

          <div className="space-y-6">
            {/* Search Term */}
            <div className="space-y-2">
              <label className="block text-right text-sm font-medium">بحث</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleChange('searchTerm', e.target.value)}
                placeholder="ابحث بكلمة مفتاحية..."
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Filter Option 1 */}
            <div className="space-y-2">
              <label className="block text-right text-sm font-medium">خيار الفلتر 1</label>
              <select
                value={filters.filterOption1}
                onChange={(e) => handleChange('filterOption1', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">الكل</option>
                <option value="option1">الخيار 1</option>
                <option value="option2">الخيار 2</option>
                <option value="option3">الخيار 3</option>
              </select>
            </div>

            {/* Filter Option 2 */}
            <div className="space-y-2">
              <label className="block text-right text-sm font-medium">خيار الفلتر 2</label>
              <select
                value={filters.filterOption2}
                onChange={(e) => handleChange('filterOption2', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">الكل</option>
                <option value="typeA">النوع أ</option>
                <option value="typeB">النوع ب</option>
                <option value="typeC">النوع ج</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <label className="block text-right text-sm font-medium">نطاق التاريخ</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-right text-xs text-gray-500">إلى</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleChange('dateTo', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-right text-xs text-gray-500">من</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleChange('dateFrom', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <p className="text-sm font-medium text-right mb-2 text-teal-800">
                  الفلاتر النشطة:
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {filters.searchTerm && (
                    <span className="px-3 py-1 bg-white text-teal-700 rounded-full text-xs border border-teal-200">
                      بحث: {filters.searchTerm}
                    </span>
                  )}
                  {filters.filterOption1 && (
                    <span className="px-3 py-1 bg-white text-teal-700 rounded-full text-xs border border-teal-200">
                      خيار 1: {filters.filterOption1}
                    </span>
                  )}
                  {filters.filterOption2 && (
                    <span className="px-3 py-1 bg-white text-teal-700 rounded-full text-xs border border-teal-200">
                      خيار 2: {filters.filterOption2}
                    </span>
                  )}
                  {filters.dateFrom && (
                    <span className="px-3 py-1 bg-white text-teal-700 rounded-full text-xs border border-teal-200">
                      من: {filters.dateFrom}
                    </span>
                  )}
                  {filters.dateTo && (
                    <span className="px-3 py-1 bg-white text-teal-700 rounded-full text-xs border border-teal-200">
                      إلى: {filters.dateTo}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaUndo />
              إعادة تعيين
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <FaFilter />
              تطبيق الفلاتر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
