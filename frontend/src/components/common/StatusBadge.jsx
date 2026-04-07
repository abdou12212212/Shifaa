import React from 'react';
import { STATUS_COLORS, STATUS_LABELS_AR } from '../../services/appointmentApi';

/**
 * StatusBadge Component
 * Displays appointment status with appropriate color coding
 */
const StatusBadge = ({ status, className = '' }) => {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    const label = STATUS_LABELS_AR[status] || status;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass} ${className}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
