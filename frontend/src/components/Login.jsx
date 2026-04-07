import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phoneNumber || !password) {
        setError('يرجى ملء جميع الحقول');
        setLoading(false);
        return;
    }

    try {
        const result = await login(phoneNumber, password);
        
        console.log("RESULT:", result); // باش نشوفو

        if (!result.success) {
            setError(result.error);
        } else {
            navigate("/");
        }

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        setError("خطأ غير متوقع");
    } finally {
        // 🔥 مهم جدا
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-teal-600">
                        <span className="text-white text-2xl font-bold">LOGO</span>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        تسجيل الدخول
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        أدخل بياناتك للوصول إلى لوحة التحكم
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="phoneNumber" className="sr-only">
                                رقم الهاتف
                            </label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm text-right"
                                placeholder="رقم الهاتف"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                dir="rtl"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                كلمة المرور
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm text-right"
                                placeholder="كلمة المرور"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري تسجيل الدخول...
                                </div>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            مرحباً بك في نظام إدارة شفاء
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
