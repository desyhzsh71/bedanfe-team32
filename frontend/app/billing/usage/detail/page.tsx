'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Info, TrendingUp } from 'lucide-react';
import { validateAuth } from '../../../lib/auth';
import api from '../../../lib/api';

type SimpleUsage = {
    projects: number;
    collaborators: number;
    apiCalls: number;
    bandwidth: number;
    mediaAssets: number;
    webhooks: number;
};

interface UsageItemDisplay {
    label: string;
    current: number;
    limit: number | string;
    unit?: string;
    description: string;
    category: 'basic' | 'advanced';
}

function DetailUsagePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgId = searchParams.get('orgId');

    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [usageData, setUsageData] = useState<SimpleUsage | null>(null);
    const [subscription, setSubscription] = useState<any>(null);

    const colors = {
        primary: '#3A7AC3',
        secondary: '#38C0A8',
        warning: '#FFC973',
        success: '#38C0A8',
        info: '#3A7AC3',
    };

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
    }, []);

    useEffect(() => {
        if (!validateAuth()) {
            router.push('/login');
            return;
        }

        if (!orgId) {
            router.push('/billing');
            return;
        }

        fetchUsageData();
    }, [router, orgId]);

    const fetchUsageData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await api.getCurrentUsage(orgId!, token);

            if (res.success && res.data) {
                const raw = res.data.usage;
                setUsageData({
                    projects: raw.projects || 0,
                    collaborators: raw.collaborators || 0,
                    apiCalls: raw.apiCalls || 0,
                    bandwidth: raw.bandwidth || 0,
                    mediaAssets: raw.mediaAssets || 0,
                    webhooks: raw.webhooks || 0,
                });
                setSubscription(res.data.subscription);
            }
        } catch (err) {
            console.error('Failed to fetch usage:', err);
        } finally {
            setLoading(false);
        }
    };

    const usageDescriptions: Record<string, { desc: string; category: 'basic' | 'advanced' }> = {
        projects: { desc: 'Number of projects you can create and manage in your organization', category: 'basic' },
        collaborators: { desc: 'Total team members that can be invited to your organization', category: 'basic' },
        apiCalls: { desc: 'Monthly API requests limit for your applications and integrations', category: 'advanced' },
        bandwidth: { desc: 'Monthly data transfer limit for your published content and assets', category: 'advanced' },
        mediaAssets: { desc: 'Maximum number of media files you can upload and store', category: 'basic' },
        webhooks: { desc: 'Number of webhook endpoints for real-time event notifications', category: 'advanced' },
    };

    const getUsageItems = (): UsageItemDisplay[] => {
        if (!usageData || !subscription) return [];

        return [
            {
                label: 'Projects',
                current: usageData.projects,
                limit: subscription.projectLimit,
                description: usageDescriptions.projects.desc,
                category: usageDescriptions.projects.category,
            },
            {
                label: 'Roles',
                current: 0,
                limit: 3,
                description: 'Different access levels you can assign to team members',
                category: 'basic',
            },
            {
                label: 'Webhooks',
                current: usageData.webhooks,
                limit: subscription.webhookLimit,
                description: usageDescriptions.webhooks.desc,
                category: 'advanced',
            },
            {
                label: 'Locales',
                current: 0,
                limit: 10,
                description: 'Number of languages/locales for multilingual content',
                category: 'advanced',
            },
            {
                label: 'Collaborators',
                current: usageData.collaborators,
                limit: subscription.collaboratorLimit,
                description: usageDescriptions.collaborators.desc,
                category: 'basic',
            },
            {
                label: 'Models',
                current: 0,
                limit: 60,
                description: 'Content type definitions for structured content',
                category: 'advanced',
            },
            {
                label: 'Records',
                current: 0,
                limit: 300,
                description: 'Total content entries across all models',
                category: 'advanced',
            },
        ];
    };

    const calculatePercentage = (current: number, limit: number | string) => {
        if (limit === 'unlimited' || limit === -1) return 0;
        const numLimit = typeof limit === 'string' ? parseInt(limit) : limit;
        return Math.min((current / numLimit) * 100, 100);
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colors.primary }}></div>
                    <p style={{ color: darkMode ? '#E0E0E0' : '#64748B' }}>Loading...</p>
                </div>
            </div>
        );
    }

    const usageItems = getUsageItems();
    const basicItems = usageItems.filter(item => item.category === 'basic');
    const advancedItems = usageItems.filter(item => item.category === 'advanced');

    return (
        <div
            className="min-h-screen p-8"
            style={{
                backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA',
                color: darkMode ? '#E0E0E0' : '#1E293B',
            }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mb-4 text-sm font-medium hover:opacity-70 transition-opacity"
                        style={{ color: colors.primary }}>
                        <ArrowLeft size={18} />
                        Back to Billing
                    </button>
                    <p className="text-sm mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                        Dashboard / Pages / Plan and Billing / Detail Project Usage
                    </p>
                    <h1 className="text-3xl font-bold">Detail Project Usage</h1>
                </div>

                {!usageData || !subscription ? (
                    <div
                        className="rounded-xl p-12 text-center border"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                        }}>
                        <TrendingUp size={48} className="mx-auto mb-4" style={{ color: darkMode ? '#3F3F52' : '#E2E8F0' }} />
                        <p className="font-medium mb-2">No usage data available</p>
                        <p style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                            Try again later or contact support
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Basic Usage Section */}
                        <div
                            className="rounded-xl p-6 border"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                            }}>
                            <div className="grid grid-cols-2 gap-8">
                                {basicItems.map((item, index) => {
                                    const percentage = calculatePercentage(item.current, item.limit);
                                    const limitDisplay = item.limit === 'unlimited' ? '∞' : item.limit;

                                    return (
                                        <div key={index}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{item.label}</h3>
                                                    <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                        Included in the plan
                                                    </p>
                                                </div>
                                                <span className="font-semibold">
                                                    {item.current} {item.label.toLowerCase() === 'projects' ? 'active' : `/${item.label.toLowerCase()} included`}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {/* Example project breakdown - you can customize this based on actual data */}
                                                {item.label === 'Projects' || item.label === 'Roles' || item.label === 'Collaborators' ? (
                                                    <>
                                                        <div className="flex justify-between text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                            <span>Marketing Website</span>
                                                            <span>-/{limitDisplay}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                            <span>Marketing Website</span>
                                                            <span>-/{limitDisplay}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                            <span>blank</span>
                                                            <span>-/{limitDisplay}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-right text-sm font-medium" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                        {item.current}/{limitDisplay}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Advanced Usage Section */}
                        {advancedItems.length > 0 && (
                            <div
                                className="rounded-xl p-6 border"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                    borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                }}>
                                <div className="grid grid-cols-2 gap-8">
                                    {advancedItems.map((item, index) => {
                                        const percentage = calculatePercentage(item.current, item.limit);
                                        const limitDisplay = item.limit === 'unlimited' ? '∞' : item.limit;

                                        return (
                                            <div key={index}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{item.label}</h3>
                                                        <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                            {item.current}/{item.label.toLowerCase()} included
                                                        </p>
                                                    </div>
                                                    <span className="font-semibold">
                                                        {item.label === 'Models' ? `${item.current}/environment included` : `${item.current}/${limitDisplay}`}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                    <div className="flex justify-between">
                                                        <span>Marketing Website</span>
                                                        <span>-/{item.label === 'Models' ? '60' : limitDisplay}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Marketing Website</span>
                                                        <span>-/{item.label === 'Models' ? '60' : limitDisplay}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>blank</span>
                                                        <span>-/{item.label === 'Models' ? '60' : limitDisplay}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Plan Summary */}
                        <div
                            className="rounded-xl p-6 border"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                            }}>
                            <h3 className="text-lg font-semibold mb-4">Current Plan Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                    <p className="text-sm mb-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Plan Name
                                    </p>
                                    <p className="font-bold">{subscription.planName}</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                    <p className="text-sm mb-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Price
                                    </p>
                                    <p className="font-bold">${subscription.price}/month</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                    <p className="text-sm mb-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Status
                                    </p>
                                    <p className="font-bold" style={{ color: subscription.status === 'ACTIVE' ? colors.success : colors.warning }}>
                                        {subscription.status}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                    <p className="text-sm mb-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Renewal Date
                                    </p>
                                    <p className="font-bold text-sm">
                                        {subscription.endDate
                                            ? new Date(subscription.endDate).toLocaleDateString()
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div
                            className="rounded-xl p-4 border-l-4 flex gap-3"
                            style={{
                                backgroundColor: darkMode ? '#3F3F5220' : '#EBF8FF',
                                borderLeftColor: colors.info,
                            }}>
                            <Info size={20} style={{ color: colors.info, flexShrink: 0 }} />
                            <div>
                                <p className="font-medium text-sm">Need more resources?</p>
                                <p className="text-sm mt-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    You can upgrade your plan anytime to get more usage limits and features. Visit your billing page to explore other plans.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DetailUsagePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DetailUsagePageContent />
        </Suspense>
    );
}