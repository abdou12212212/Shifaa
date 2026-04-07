import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-bold text-teal-600">جاري التحميل...</div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        // 🔥 الحل هنا
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;