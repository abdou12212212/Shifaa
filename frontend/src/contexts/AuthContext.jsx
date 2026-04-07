import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigateRef = useRef(null);

    // Check for existing token on app load
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (phoneNumber, password) => {
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, password }),
        });

        const data = await response.json();
        console.log("[AuthContext] Login", data);

        if (data.user) {
            const { token: newToken, user: userData } = data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);

            return { success: true, user: userData }; // ⚡
        } else {
            return { success: false, error: data.message || 'فشل في تسجيل الدخول' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'خطأ في الاتصال بالخادم' };
    }
};

    const logout = (redirect = true) => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear state
        setToken(null);
        setUser(null);

        // Redirect to login page if requested
        if (redirect && navigateRef.current) {
            navigateRef.current('/login');
        } else if (redirect) {
            // Fallback: redirect using window.location
            window.location.href = '/login';
        }
    };

    /**
     * Handle authentication errors from API responses
     * This should be called when token is expired or invalid
     */
    const handleAuthError = () => {
        console.log('[AuthContext] Token expired or invalid. Logging out...');

        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear state
        setToken(null);
        setUser(null);

        // Redirect to login with message
        if (navigateRef.current) {
            navigateRef.current('/login', {
                state: {
                    message: 'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى',
                    type: 'warning'
                }
            });
        } else {
            // Fallback: redirect using window.location
            window.location.href = '/login';
        }
    };

    /**
     * Set the navigate function from a component inside Router
     * This should be called by NavigateSetter component
     */
    const setNavigate = (navigateFn) => {
        navigateRef.current = navigateFn;
    };

    const isAuthenticated = () => {
        return !!token && !!user;
    };

    const value = {
        user,
        token,
        login,
        logout,
        handleAuthError,
        setNavigate,
        isAuthenticated,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * NavigateSetter Component
 * This component must be rendered inside Router to provide navigate function to AuthContext
 * Add this component at the top level of your app inside BrowserRouter
 */
export const NavigateSetter = () => {
    const { setNavigate } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setNavigate(navigate);
    }, [navigate, setNavigate]);

    return null;
};
