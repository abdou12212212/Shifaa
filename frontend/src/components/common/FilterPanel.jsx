import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { APPOINTMENT_STATUS } from '../../services/appointmentApi';

/**
 * FilterPanel Component
 * Advanced filtering panel for appointments
 */
const FilterPanel = ({ isOpen, onClose, onApplyFilters, initialFilters }) => {
    const [filters, setFilters] = useState({
        status: 'all',
        date_from: '',
        date_to: '',
        assistant_id: '',
        is_urgent: undefined,
        ...initialFilters
    });

    useEffect(() => {
        if (initialFilters) {
            setFilters(prev => ({ ...prev, ...initialFilters }));
        }
    }, [initialFilters]);

    const handleChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {
            status: 'all',
            date_from: '',
            date_to: '',
            assistant_id: '',
            is_urgent: undefined
        };
        setFilters(resetFilters);
        onApplyFilters(resetFilters);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">فلترة المواعيد</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Filter Form */}
                <div className="space-y-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-right text-sm font-medium mb-2">الحالة</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                        >
                            <option value="all">الكل</option>
                            <option value={APPOINTMENT_STATUS.PENDING}>غير مؤكد</option>
                            <option value={APPOINTMENT_STATUS.UPCOMING}>قادم</option>
                            <option value={APPOINTMENT_STATUS.IN_PROGRESS}>جاري</option>
                            <option value={APPOINTMENT_STATUS.COMPLETED}>مكتمل</option>
                            <option value={APPOINTMENT_STATUS.CANCELLED}>ملغى</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-right text-sm font-medium mb-2">من تاريخ</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-right text-sm font-medium mb-2">إلى تاريخ</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                    </div>

                    {/* Urgent Filter */}
                    <div>
                        <label className="block text-right text-sm font-medium mb-2">الحالات الإستعجالية</label>
                        <select
                            value={filters.is_urgent === undefined ? 'all' : filters.is_urgent.toString()}
                            onChange={(e) => {
                                const value = e.target.value;
                                handleChange('is_urgent', value === 'all' ? undefined : value === 'true');
                            }}
                            className="w-full px-4 py-2 bg-gray-100 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                        >
                            <option value="all">الكل</option>
                            <option value="true">إستعجالية فقط</option>
                            <option value="false">عادية فقط</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleReset}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        إعادة تعيين
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        تطبيق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
