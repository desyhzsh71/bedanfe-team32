'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);
    const [darkMode, setDarkMode] = useState(false);

    const colors = {
        success: '#38C0A8',
        primary: '#3A7AC3',
    };

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/billing');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div
            className="min-h-screen flex items-center justify-center p-8"
            style={{
                backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA',
                color: darkMode ? '#E0E0E0' : '#1E293B',
            }}>
            <div
                className="max-w-md w-full rounded-xl p-8 text-center"
                style={{
                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                }}>
                {/* Success Icon */}
                <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: `${colors.success}20` }}>
                    <CheckCircle size={48} style={{ color: colors.success }} />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4" style={{ color: colors.success }}>
                    Payment Successful!
                </h1>

                {/* Message */}
                <p className="text-lg mb-6" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                    Your subscription has been activated successfully. Thank you for your payment!
                </p>

                {/* Info */}
                <div
                    className="rounded-lg p-4 mb-6"
                    style={{
                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                    }}>
                    <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                        You will be redirected to the billing page in
                    </p>
                    <p className="text-4xl font-bold mt-2" style={{ color: colors.success }}>
                        {countdown}s
                    </p>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/billing')}
                        className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: colors.primary,
                            color: '#FFFFFF',
                        }}>
                        Go to Billing Now
                        <ArrowRight size={18} />
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 rounded-lg font-medium"
                        style={{
                            backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                            color: darkMode ? '#E0E0E0' : '#1E293B',
                        }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}