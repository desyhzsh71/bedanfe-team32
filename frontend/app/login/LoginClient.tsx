'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../components/Logo';
import api from '../lib/api';
import { saveToken, saveUser } from '../lib/auth';

const REMEMBER_ME_KEY = 'rememberedEmail';
const DARK_MODE_KEY = 'darkMode';

export default function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const saved = localStorage.getItem(REMEMBER_ME_KEY);
        if (saved) {
            setFormData((prev) => ({ ...prev, email: saved }));
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            const errorMessages: Record<string, string> = {
                token_exchange_failed: 'Failed to exchange authorization code. Please try again.',
                user_info_failed: 'Failed to retrieve your Google account info. Please try again.',
                internal_error: 'Something went wrong during Google login. Please try again.',
            };
            setError(errorMessages[errorParam] || 'Google login failed. Please try again.');
            window.history.replaceState({}, '', '/login');
            return;
        }

        if (token) {
            const fullName = searchParams.get('fullName') || '';
            const email = searchParams.get('email') || '';
            const company = searchParams.get('company') || '';
            const job = searchParams.get('job') || '';
            const country = searchParams.get('country') || '';
            const userId = searchParams.get('userId') || '';

            saveToken(token);
            saveUser({
                id: userId,
                fullName,
                email,
                company,
                job,
                country,
            });

            window.history.replaceState({}, '', '/login');
            router.push('/dashboard');
        }
    }, [searchParams, router]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setRememberMe(checked);
        if (!checked) {
            localStorage.removeItem(REMEMBER_ME_KEY);
        }
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const response = await api.login(formData);

            if (response.token) {
                if (rememberMe) {
                    localStorage.setItem(REMEMBER_ME_KEY, formData.email);
                } else {
                    localStorage.removeItem(REMEMBER_ME_KEY);
                }

                saveToken(response.token);
                saveUser(response.user);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setLoading(true);
        setError('');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const callbackUrl = encodeURIComponent(`${window.location.origin}/login`);
        window.location.href = `${apiUrl}/auth/google?callback_url=${callbackUrl}`;
    };

    return (
        <div className="grid grid-cols-2 min-h-screen">
            {/* Left Side - Form */}
            <div
                className="relative p-8 flex items-center justify-center"
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
                    <h1
                        className="text-2xl font-semibold text-center mb-2"
                        style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                    >
                        Welcome Back!
                    </h1>

                    <p
                        className="text-center text-xs mb-6"
                        style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                    >
                        Sign in with your email and password to continue managing your projects.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div className="mb-4">
                        <label
                            className="block mb-2 text-sm font-medium"
                            style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="example@gmail.com"
                            className="border-2 rounded-lg block w-full px-4 py-3 transition focus:border-blue-500 focus:outline-none"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                color: darkMode ? '#E0E0E0' : '#111827',
                                borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                        <label
                            className="block mb-2 text-sm font-medium"
                            style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Input Password"
                                className="border-2 rounded-lg block w-full px-4 py-3 pr-12 transition focus:border-blue-500 focus:outline-none"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                    color: darkMode ? '#E0E0E0' : '#111827',
                                    borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={handleRememberMeChange}
                                className="w-5 h-5 accent-blue-600"
                            />
                            <span
                                className="text-sm"
                                style={{ color: darkMode ? '#94A3B8' : '#374151' }}
                            >
                                Remember Me
                            </span>
                        </label>

                        <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    {/* Login Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-lg text-white bg-[#3A7AC3] py-3 font-semibold hover:bg-[#2e5fa8] disabled:opacity-50 transition"
                    >
                        {loading ? 'Signing in...' : 'Login'}
                    </button>

                    {/* Register Link */}
                    <p className="px-8 text-sm text-center mb-4" style={{ color: darkMode ? '#64748B' : '#6B7280' }}>
                        Don't have an account?{' '}
                        <a href="/register" className="text-blue-600 hover:underline font-medium">Signup</a>.
                    </p>

                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border-2 py-3 disabled:opacity-50 transition"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                            color: darkMode ? '#E0E0E0' : '#374151',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#FFFFFF';
                        }}
                    >
                        <FcGoogle size={22} />
                        <span>Continue with Google</span>
                    </button>
                </div>
            </div>

            {/* Right Side - Logo */}
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    backgroundColor: darkMode ? '#2D2D3F' : '#3A7AC3',
                }}
            >
                <Logo size="large" variant={darkMode ? 'alt' : 'main'} />
            </div>
        </div>
    );
}