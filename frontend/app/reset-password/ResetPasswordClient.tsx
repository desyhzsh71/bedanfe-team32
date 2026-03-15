'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { IoMdArrowBack } from 'react-icons/io';
import Logo from '../components/Logo';
import api from '../lib/api';

const DARK_MODE_KEY = 'darkMode';

export default function ResetPasswordClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link');
            setVerifying(false);
            return;
        }
        verifyToken();
    }, [token]);

    const toggleTheme = () => {
        const isDark = !darkMode;
        setDarkMode(isDark);
        localStorage.setItem(DARK_MODE_KEY, String(isDark));

        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const verifyToken = async () => {
        try {
            await api.verifyResetToken(token!);
            setTokenValid(true);
        } catch (err: any) {
            setError(err.message || 'Invalid or expired reset link');
            setTokenValid(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.resetPassword({
                token: token!,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    backgroundColor: darkMode ? '#2D2D3F' : '#3A7AC3',
                }}
            >
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Verifying reset link...</p>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="grid grid-cols-2 min-h-screen">
                <div
                    className="p-8 flex items-center justify-center"
                    style={{
                        backgroundColor: darkMode ? '#1E1E2E' : '#FFFFFF',
                    }}
                >
                    <div className="w-full max-w-md text-center">
                        <p
                            className="text-2xl mb-2 font-semibold text-red-600"
                        >
                            Invalid Reset Link
                        </p>
                        <p
                            className="text-xs mb-6"
                            style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                        >
                            {error}
                        </p>
                        <a
                            href="/forgot-password"
                            className="block w-full rounded-md text-center text-white bg-[#F93232] p-3 font-medium hover:bg-[#d62828] transition"
                        >
                            Request New Link
                        </a>
                    </div>
                </div>
                <div
                    className="min-h-screen flex items-center justify-center"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#3A7AC3',
                    }}
                >
                    <Logo size="large" variant={darkMode ? "alt" : "main"} />
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="grid grid-cols-2 min-h-screen">
                <div
                    className="p-8 flex items-center justify-center"
                    style={{
                        backgroundColor: darkMode ? '#1E1E2E' : '#FFFFFF',
                    }}
                >
                    <div className="w-full max-w-md">
                        <p
                            className="text-2xl text-center mb-2 font-semibold"
                            style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                        >
                            Password Updated Successfully!
                        </p>
                        <p
                            className="text-center text-xs mb-6"
                            style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                        >
                            You're all set - log in with your new password. Need help? Our support team is ready to assist.
                        </p>
                        <div className="mb-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="block w-full rounded-md text-center text-white bg-[#F93232] p-3 font-medium hover:bg-[#d62828] transition"
                            >
                                Login Now
                            </button>
                        </div>
                        <div>
                            <a
                                href="/login"
                                className="flex items-center justify-center gap-2 rounded-lg text-center py-3 px-4 transition font-medium"
                                style={{
                                    color: darkMode ? '#94A3B8' : '#374151',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F9FAFB';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <IoMdArrowBack size={20} />
                                <span>Back to log in</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div
                    className="min-h-screen flex items-center justify-center"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#3A7AC3',
                    }}
                >
                    <Logo size="large" variant={darkMode ? "alt" : "main"} />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 min-h-screen">
            {/* Left Side - Form */}
            <div
                className="p-8 flex items-center justify-center relative"
                style={{
                    backgroundColor: darkMode ? '#1E1E2E' : '#FFFFFF',
                }}
            >
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 left-6 p-2 rounded-full border transition"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                        color: darkMode ? '#E0E0E0' : '#374151',
                    }}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="w-full max-w-md">
                    <p
                        className="text-2xl text-center mb-2 font-semibold"
                        style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                    >
                        Create a New Password
                    </p>
                    <p
                        className="text-center text-xs mb-6"
                        style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                    >
                        Pick something strong and memorable. Make sure it's unique to keep your account safe.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        {/* New Password */}
                        <div className="mb-4">
                            <label
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="border-2 rounded-lg block w-full px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                        color: darkMode ? '#E0E0E0' : '#111827',
                                        borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                    }}
                                    placeholder="Enter your password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-6">
                            <label
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="border-2 rounded-lg block w-full px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                        color: darkMode ? '#E0E0E0' : '#111827',
                                        borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                    }}
                                    placeholder="Enter your password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="block w-full rounded-lg text-center text-white bg-[#F93232] py-3 px-4 font-semibold hover:bg-[#d62828] disabled:opacity-50 transition shadow-sm"
                            >
                                {loading ? 'Resetting...' : 'Reset password'}
                            </button>
                        </div>

                        <div>
                            <a
                                href="/login"
                                className="flex items-center justify-center gap-2 rounded-full text-center p-3 transition"
                                style={{
                                    color: darkMode ? '#94A3B8' : '#374151',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F9FAFB';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <IoMdArrowBack size={20} />
                                <span>Back to log in</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Logo */}
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    backgroundColor: darkMode ? '#2D2D3F' : '#3A7AC3',
                }}
            >
                <Logo size="large" variant={darkMode ? "alt" : "main"} />
            </div>
        </div>
    );
}