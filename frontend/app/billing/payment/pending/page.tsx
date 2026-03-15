'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ArrowRight } from 'lucide-react';

export default function PaymentPendingPage() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);

    const colors = {
        warning: '#FFC973',
        primary: '#3A7AC3',
    };

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
    }, []);

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
                {/* Pending Icon */}
                <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: `${colors.warning}20` }}>
                    <Clock size={48} style={{ color: colors.warning }} />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4" style={{ color: colors.warning }}>
                    Payment Pending
                </h1>

                {/* Message */}
                <p className="text-lg mb-6" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                    Your payment is being processed. This may take a few moments.
                </p>

                {/* Info */}
                <div
                    className="rounded-lg p-4 mb-6 text-left"
                    style={{
                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                    }}>
                    <p className="text-sm font-semibold mb-2">What's next?</p>
                    <ul className="text-sm space-y-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                        <li>• Your payment is being verified</li>
                        <li>• You will receive a notification once completed</li>
                        <li>• Check your email for updates</li>
                        <li>• Your subscription will be activated automatically</li>
                    </ul>
                </div>

                {/* Status Check */}
                <div
                    className="rounded-lg p-4 mb-6 border"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                    }}>
                    <p className="text-sm mb-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                        You can check your payment status in:
                    </p>
                    <button
                        onClick={() => router.push('/billing')}
                        className="text-sm font-semibold flex items-center justify-center gap-1 mx-auto"
                        style={{ color: colors.primary }}>
                        Billing History
                        <ArrowRight size={14} />
                    </button>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/billing')}
                        className="w-full py-3 rounded-lg font-semibold"
                        style={{
                            backgroundColor: colors.primary,
                            color: '#FFFFFF',
                        }}>
                        Go to Billing
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

                {/* Help */}
                <p className="text-xs mt-6" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                    Having issues? Contact our support team for assistance.
                </p>
            </div>
        </div>
    );
}