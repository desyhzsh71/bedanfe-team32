'use client';

import { useRouter } from 'next/navigation';

interface UsageIndicatorProps {
    label: string;
    current: number;
    limit: string | number;
    unit?: string;
    darkMode?: boolean;
    colors: {
        warning: string;
        secondary: string;
    };
    className?: string;
}

export default function UsageIndicator({
    label,
    current,
    limit,
    unit = '',
    darkMode = false,
    colors,
    className = '',
}: UsageIndicatorProps) {
    const router = useRouter();

    if (!limit && limit !== 0) {
        return null;
    }

    const isUnlimited = limit === 'unlimited';
    const limitNum = isUnlimited ? Infinity : (typeof limit === 'number' ? limit : parseInt(limit) || 0);
    const percentage = isUnlimited ? 0 : (current / limitNum) * 100;
    const isWarning = percentage >= 80;

    return (
        <div
            className={`p-4 rounded-lg transition-all duration-300 ${className}`}
            style={{
                backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                border: `1px solid ${darkMode ? '#4A5568' : '#E2E8F0'}`,
            }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium"
                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                    {label}
                </span>
                <span className="text-sm font-mono"
                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                    {/* Fix: Only show unit once */}
                    {current} / {isUnlimited ? '∞' : limit} {unit}
                </span>
            </div>

            {/* Progress Bar (cuma untuk limited plans) */}
            {!isUnlimited && (
                <>
                    <div className="w-full h-2 rounded-full overflow-hidden mb-2"
                        style={{ backgroundColor: darkMode ? '#1E1E2E' : '#E5E7EB' }}>
                        <div
                            className="h-full transition-all duration-300"
                            style={{
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: isWarning ? colors.warning : colors.secondary,
                            }}></div>
                    </div>

                    {/* Warning Message */}
                    {isWarning && (
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs" style={{ color: colors.warning }}>
                                ⚠️ {percentage.toFixed(0)}% used - approaching limit
                            </p>
                            <button
                                onClick={() => router.push('/billing/plans')}
                                className="text-xs font-medium underline transition-opacity hover:opacity-70"
                                style={{ color: colors.warning }}>
                                Upgrade
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}