'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function PaymentErrorPage() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);

    const colors = {
        error: '#F93232',
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
                {/* Error Icon */}
                <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: `${colors.error}20` }}>
                    <XCircle size={48} style={{ color: colors.error }} />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4" style={{ color: colors.error }}>
                    Payment Failed
                </h1>

                {/* Message */}
                <p className="text-lg mb-6" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                    Unfortunately, your payment could not be processed. Please try again or contact support.
                </p>

                {/* Possible Reasons */}
                <div
                    className="rounded-lg p-4 mb-6 text-left"
                    style={{
                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                    }}>
                    <p className="text-sm font-semibold mb-2">Possible reasons:</p>
                    <ul className="text-sm space-y-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                        <li>• Insufficient balance</li>
                        <li>• Payment method declined</li>
                        <li>• Network connection issue</li>
                        <li>• Transaction timeout</li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/billing/plans')}
                        className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: colors.primary,
                            color: '#FFFFFF',
                        }}>
                        <RefreshCw size={18} />
                        Try Again
                    </button>

                    <button
                        onClick={() => router.push('/billing')}
                        className="w-full py-3 rounded-lg font-medium"
                        style={{
                            backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                            color: darkMode ? '#E0E0E0' : '#1E293B',
                        }}>
                        Back to Billing
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        style={{
                            color: darkMode ? '#94A3B8' : '#64748B',
                        }}>
                        Back to Dashboard
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}