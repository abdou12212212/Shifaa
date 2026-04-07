import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * CalendarDatePicker Component
 * Simple calendar for selecting appointment dates
 */
const CalendarDatePicker = ({ selectedDate, onDateSelect, highlightedDates = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay();

    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const isSelectedDate = (day) => {
        if (!selectedDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return (
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isToday = (day) => {
        const today = new Date();
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isPastDate = (day) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date < today;
    };

    const handleDateClick = (day) => {
        if (!isPastDate(day)) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            onDateSelect(date);
        }
    };

    const renderCalendarDays = () => {
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = isSelectedDate(day);
            const isTodayDate = isToday(day);
            const isPast = isPastDate(day);

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={isPast}
                    className={`
                        p-2 rounded-lg text-center transition-all
                        ${isSelected ? 'bg-teal-600 text-white font-bold' : ''}
                        ${isTodayDate && !isSelected ? 'border-2 border-teal-600 text-teal-600 font-bold' : ''}
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-teal-100 cursor-pointer'}
                        ${!isSelected && !isTodayDate && !isPast ? 'text-gray-700' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            {/* Month Navigator */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaChevronRight />
                </button>
                <h3 className="text-lg font-bold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaChevronLeft />
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2" dir="rtl">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                        {day.substring(0, 3)}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2" dir="rtl">
                {renderCalendarDays()}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-teal-600"></div>
                    <span>اليوم</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-teal-600"></div>
                    <span>محدد</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarDatePicker;
