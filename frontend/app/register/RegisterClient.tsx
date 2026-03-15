'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../components/Logo';
import api from '../lib/api';
import { saveToken, saveUser } from '../lib/auth';

const DARK_MODE_KEY = 'darkMode';

export default function RegisterClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        company: '',
        job: '',
        country: ''
    });

    const [countries, setCountries] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
        const fetchCountries = async () => {
            try {
                const response = await api.getCountries();
                if (response.success && Array.isArray(response.data)) {
                    setCountries(response.data);
                }
            } catch (err) {
                console.error('Error fetching countries:', err);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            const errorMessages: Record<string, string> = {
                token_exchange_failed: 'Failed to exchange authorization code. Please try again.',
                user_info_failed: 'Failed to retrieve your Google account info. Please try again.',
                internal_error: 'Something went wrong during Google sign up. Please try again.',
            };
            setError(errorMessages[errorParam] || 'Google sign up failed. Please try again.');
            window.history.replaceState({}, '', '/register');
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
            saveUser({ id: userId, fullName, email, company, job, country });

            window.history.replaceState({}, '', '/register');
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        setError('');
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!formData.fullName || !formData.email || !formData.password ||
            !formData.company || !formData.job || !formData.country) {
            setError('All fields are required');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!agreeTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy');
            return;
        }

        setLoading(true);

        try {
            await api.register(formData);
            setSuccess('Account created successfully! Redirecting to login...');
            setFormData({
                fullName: '',
                email: '',
                password: '',
                company: '',
                job: '',
                country: ''
            });
            setAgreeTerms(false);

            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = () => {
        setLoading(true);
        setError('');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const callbackUrl = encodeURIComponent(`${window.location.origin}/register`);
        window.location.href = `${apiUrl}/auth/google?callback_url=${callbackUrl}`;
    };

    return (
        <div className="grid grid-cols-2 min-h-screen">
            {/* Left Side - Logo */}
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    backgroundColor: darkMode ? '#2D2D3F' : '#3A7AC3',
                }}
            >
                <Logo size="large" variant={darkMode ? "alt" : "main"} />
            </div>

            {/* Right Side - Form */}
            <div
                className="p-8 overflow-y-auto relative"
                style={{
                    backgroundColor: darkMode ? '#1E1E2E' : '#FFFFFF',
                }}
            >
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 p-2 rounded-full border transition"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                        color: darkMode ? '#E0E0E0' : '#374151',
                    }}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <p
                    className="text-2xl text-center mb-2 font-semibold"
                    style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                >
                    Start Your Journey
                </p>
                <p
                    className="text-center text-xs mb-1"
                    style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                >
                    Create your account in seconds - no hassle
                </p>
                <p
                    className="text-center text-xs mb-6"
                    style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                >
                    just your email and a secure password. Let's get you set up!
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                <div>
                    {/* Full Name */}
                    <div className="mb-4">
                        <label
                            htmlFor="fullName"
                            className="block mb-2 text-sm font-medium"
                            style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                        >
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="border-2 rounded-lg block w-full px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                color: darkMode ? '#E0E0E0' : '#111827',
                                borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                            }}
                            placeholder="Input your full name"
                            disabled={loading}
                        />
                    </div>

                    {/* Email & Password */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label
                                htmlFor="email"
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="border-2 rounded-lg block w-full px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                    color: darkMode ? '#E0E0E0' : '#111827',
                                    borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                }}
                                placeholder="Input your email"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex-1">
                            <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="border-2 rounded-lg block w-full px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                        color: darkMode ? '#E0E0E0' : '#111827',
                                        borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                    }}
                                    placeholder="Input your password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Company, Job, Country */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label
                                htmlFor="company"
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                Company
                            </label>
                            <input
                                type="text"
                                id="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="border-2 rounded-lg block w-full px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                    color: darkMode ? '#E0E0E0' : '#111827',
                                    borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                }}
                                placeholder="Input your company"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex-1">
                            <label
                                htmlFor="job"
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                Job
                            </label>
                            <input
                                type="text"
                                id="job"
                                value={formData.job}
                                onChange={handleChange}
                                className="border-2 rounded-lg block w-full px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                    color: darkMode ? '#E0E0E0' : '#111827',
                                    borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                }}
                                placeholder="Input your job"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex-1">
                            <label
                                htmlFor="country"
                                className="block mb-2 text-sm font-medium"
                                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
                            >
                                Country
                            </label>
                            <select
                                id="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="border-2 rounded-lg block w-full px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                                    color: darkMode ? '#E0E0E0' : '#111827',
                                    borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                }}
                                disabled={loading}
                            >
                                <option value="">Select a country</option>
                                {countries.map((country) => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="w-5 h-5 border-2 rounded accent-blue-600"
                                style={{
                                    borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                                }}
                                disabled={loading}
                            />
                            <span
                                className="text-sm"
                                style={{ color: darkMode ? '#94A3B8' : '#374151' }}
                            >
                                I agree to CMS and{' '}
                                <a href="#" className="text-blue-600 hover:underline font-medium">
                                    Terms of Service and Privacy Policy
                                </a>
                            </span>
                        </label>
                    </div>

                    {/* Sign Up Button */}
                    <div className="mb-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full rounded-lg text-center text-white bg-[#3A7AC3] py-3 px-4 font-semibold hover:bg-[#2e5fa8] disabled:opacity-50 transition shadow-sm"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>

                    {/* Login Link */}
                    <p
                        className="text-sm text-center mb-4"
                        style={{ color: darkMode ? '#64748B' : '#6B7280' }}
                    >
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-600 hover:underline font-medium">
                            Login
                        </a>
                    </p>

                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={handleGoogleRegister}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 rounded-lg border-2 py-3 px-4 disabled:opacity-50 transition font-medium"
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
        </div>
    );
}