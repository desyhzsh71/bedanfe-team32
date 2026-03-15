'use client';

import { useState, useEffect } from 'react';
import { IoMdArrowBack } from 'react-icons/io';
import { Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo';
import api from '../lib/api';

const DARK_MODE_KEY = 'darkMode';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="grid grid-cols-2 min-h-screen">
        {/* Left Side - Success Message */}
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
              Check Your Inbox!
            </p>
            <p
              className="text-center text-xs mb-6"
              style={{ color: darkMode ? '#64748B' : '#6B7280' }}
            >
              We've sent a password reset link to ({email}) - it's valid for 24 hours. Don't forget to check spam too!
            </p>
            <div className="mb-4">
              <button
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="block w-full rounded-md text-center text-white bg-[#F93232] p-3 font-medium hover:bg-[#d62828] transition"
              >
                Open Gmail
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
            Forgot Your Password?
          </p>
          <p
            className="text-center text-xs mb-6"
            style={{ color: darkMode ? '#64748B' : '#6B7280' }}
          >
            No stress — just enter your email below, and we'll send you a secure link to reset it.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div>
            <div className="mb-6">
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: darkMode ? '#E0E0E0' : '#111827' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 rounded-lg block w-full px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                style={{
                  backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB',
                  color: darkMode ? '#E0E0E0' : '#111827',
                  borderColor: darkMode ? '#3F3F52' : '#D1D5DB',
                }}
                placeholder="example@gmail.com"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="block w-full rounded-lg text-center text-white bg-[#F93232] py-3 px-4 font-semibold hover:bg-[#d62828] disabled:opacity-50 transition shadow-sm"
              >
                {loading ? 'Sending...' : 'Reset password'}
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