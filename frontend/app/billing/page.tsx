'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    LogOut, Building2, Users, Clock, Sun, Moon, CreditCard, Settings as SettingsIcon,
    ChevronDown, LayoutDashboard, GitPullRequest, Settings, FolderOpen, FileText, Layers,
    Image, Plug, Bell, Menu, X, Activity, TrendingUp, MapPin, Calendar, Download, Plus,
    Check, Package, Trash2, AlertCircle
} from 'lucide-react';
import { getUser, logout, validateAuth } from '../lib/auth';
import Logo from '../components/Logo';
import ProfilePhoto from '../components/ProfilePhoto';
import api from '../lib/api';
import type {
    Subscription,
    BillingAddress,
    PaymentMethod,
    BillingHistory as BillingHistoryType,
    UsageData,
    UsageItem,
} from './types';

interface Project {
    id: string;
    name: string;
    status?: string;
}


export default function BillingPage() {
    const router = useRouter();
    const profileRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingPersonalProjects, setLoadingPersonalProjects] = useState(false);
    const [loadingMediaAssets, setLoadingMediaAssets] = useState(false);
    const [loadingApiTokens, setLoadingApiTokens] = useState(false);
    const [loadingWorkflows, setLoadingWorkflows] = useState(false);

    const [darkMode, setDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Plan & Billing');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [billingHistory, setBillingHistory] = useState<BillingHistoryType[]>([]);
    const [usageData, setUsageData] = useState<UsageData | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [personalProjects, setPersonalProjects] = useState<any[]>([]);
    const [mediaAssets, setMediaAssets] = useState<any[]>([]);
    const [singlePages, setSinglePages] = useState<any[]>([]);
    const [multiplePages, setMultiplePages] = useState<any[]>([]);
    const [components, setComponents] = useState<any[]>([]);
    const [entries, setEntries] = useState<any[]>([]);
    const [apiTokens, setApiTokens] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);

    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [organizations, setOrganizations] = useState<any[]>([]);

    // Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const colors = {
        primary: '#3A7AC3',
        secondary: '#38C0A8',
        warning: '#FFC973',
        error: '#F93232',
        success: '#38C0A8',
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Organization Projects', path: '/organization-projects', icon: Building2 },
        { name: 'Personal Projects', path: '/personal-projects', icon: FolderOpen },
        { name: 'Plan & Billing', path: '/billing', icon: CreditCard },
        { name: 'Notification', path: '/invitations', icon: Bell },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    // Helper function to convert Rupiah to Dollar
    const convertToUSD = (rupiahAmount: number | string): string => {
        const amount = Number(rupiahAmount) || 0;
        return (amount / 10000).toFixed(2);
    };

    // Dark mode
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        applyDarkMode(savedDarkMode);
    }, []);

    const applyDarkMode = (isDark: boolean) => {
        const html = document.documentElement;
        isDark ? html.classList.add('dark') : html.classList.remove('dark');
    };

    const handleDarkModeToggle = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', String(newDarkMode));
        applyDarkMode(newDarkMode);
    };

    // Auth
    useEffect(() => {
        if (!validateAuth()) {
            router.push('/login');
            return;
        }
        const userData = getUser();
        if (userData) setUser(userData);
        setLoading(false);
    }, [router]);

    useEffect(() => {
        if (loading) return;
        fetchInitialData();
    }, [loading]);

    useEffect(() => {
        if (selectedOrgId) {
            console.log('\n🏢 Organization Changed:', selectedOrgId);
            fetchOrganizationData();
        }
    }, [selectedOrgId]);

    useEffect(() => {
        // Fetch content data after projects are loaded
        if (projects.length > 0) {
            const token = localStorage.getItem('token') || '';
            fetchContentData(token);
        }
    }, [projects]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token') || '';

            // Fetch organizations
            const orgsRes = await api.getOrganizations(token);
            const orgs = orgsRes?.data || [];
            setOrganizations(orgs);
            console.log('📋 Organizations loaded:', orgs);

            if (orgs.length > 0) {
                setSelectedOrgId(orgs[0].id);
                console.log('✅ Selected first organization:', orgs[0].id);
            }

            // Fetch billing address
            await fetchBillingAddress(token);

            // Fetch payment methods
            await fetchPaymentMethods(token);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };

    const fetchOrganizationData = async () => {
        console.log('\n🚀 === STARTING FETCH ORGANIZATION DATA ===');
        console.log('Selected Org ID:', selectedOrgId);

        try {
            const token = localStorage.getItem('token') || '';
            console.log('Token exists:', !!token);

            // Fetch semua data secara berurutan dengan logging
            console.log('\n1️⃣ Fetching subscription...');
            await fetchSubscription(selectedOrgId, token);

            console.log('\n2️⃣ Fetching usage...');
            await fetchUsage(selectedOrgId, token);

            console.log('\n3️⃣ Fetching billing history...');
            await fetchBillingHistory(selectedOrgId, token);

            console.log('\n4️⃣ Fetching projects...');
            await fetchProjects(selectedOrgId, token);

            console.log('\n6️⃣ Fetching personal projects...');
            await fetchPersonalProjects(token);

            console.log('\n7️⃣ Fetching media assets...');
            await fetchMediaAssets(selectedOrgId, token);

            console.log('\n8️⃣ Fetching API tokens...');
            await fetchApiTokens(selectedOrgId, token);

            console.log('\n9️⃣ Fetching workflows...');
            await fetchWorkflows(selectedOrgId, token);

            console.log('\n✅ === FETCH ORGANIZATION DATA COMPLETED ===\n');
        } catch (error) {
            console.error('\n❌ === FETCH ORGANIZATION DATA FAILED ===');
            console.error('Error:', error);
        }
    };

    const fetchSubscription = async (orgId: string, token: string) => {
        setLoadingSubscription(true);
        try {
            const res = await api.getCurrentSubscription(orgId, token);
            if (res.success && res.data) {
                setSubscription(res.data.subscription);
            } else {
                setSubscription(null);
            }
        } catch (error: any) {
            console.log('No active subscription');
            setSubscription(null);
        } finally {
            setLoadingSubscription(false);
        }
    };

    const fetchPaymentMethods = async (token: string) => {
        setLoadingPayments(true);
        try {
            const res = await api.getAllPaymentMethods(token);
            if (res.success && res.data) {
                setPaymentMethods(res.data);
            } else {
                setPaymentMethods([]);
            }
        } catch (error) {
            console.log('No payment methods yet');
            setPaymentMethods([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    const fetchBillingHistory = async (orgId: string, token: string) => {
        setLoadingHistory(true);
        try {
            const res = await api.getBillingHistory(orgId, token, { page: 1, limit: 10 });
            if (res.success && res.data) {
                setBillingHistory(res.data.billingHistories || []);
            } else {
                setBillingHistory([]);
            }
        } catch (error) {
            console.log('No billing history yet');
            setBillingHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchUsage = async (orgId: string, token: string) => {
        setLoadingUsage(true);
        try {
            const res = await api.getCurrentUsage(orgId, token);
            if (res.success && res.data) {
                const raw = res.data.usage;
                const sub = res.data.subscription;

                if (raw && sub) {
                    const createUsageItem = (
                        used: number,
                        limit: number | string | undefined
                    ): UsageItem => {
                        const numUsed = Number(used) || 0;
                        let finalLimit: number | 'unlimited';
                        if (limit === 'unlimited' || limit === -1 || limit === '-1') {
                            finalLimit = 'unlimited';
                        } else {
                            finalLimit = Number(limit) || 0;
                        }

                        const percentage = finalLimit === 'unlimited'
                            ? 0
                            : (numUsed / finalLimit) * 100;
                        const warning = finalLimit !== 'unlimited' && percentage >= 80;

                        return {
                            used: numUsed,
                            limit: finalLimit,
                            percentage,
                            warning
                        };
                    };

                    setUsageData({
                        bandwidth: createUsageItem(raw.bandwidth || 0, sub.bandwidthLimit),
                        apiCalls: createUsageItem(raw.apiCalls || 0, sub.apiCallLimit),
                        mediaAssets: createUsageItem(raw.mediaAssets || 0, sub.mediaAssetLimit),
                        projects: createUsageItem(raw.projects || 0, sub.projectLimit),
                        collaborators: createUsageItem(raw.collaborators || 0, sub.collaboratorLimit),
                    });
                }
            } else {
                setUsageData(null);
            }
        } catch (error) {
            console.log('No usage data yet');
            setUsageData(null);
        } finally {
            setLoadingUsage(false);
        }
    };

    const fetchProjects = async (orgId: string, token: string) => {
        setLoadingProjects(true);
        console.log('🔄 Fetching projects for org:', orgId);
        try {
            // HAPUS filter status biar semua projects keambil
            const res = await api.getProjectsByOrganization(orgId, token, {
                page: 1,
                limit: 1000
            });
            console.log('📦 Projects API Response:', res);

            if (res.success && res.data) {
                const allProjects = res.data.projects || res.data || [];
                console.log('✅ Projects extracted:', allProjects);
                console.log('📊 Projects count:', allProjects.length);
                setProjects(allProjects);
            } else {
                console.log('⚠️ No projects data in response');
                setProjects([]);
            }
        } catch (error) {
            console.error('❌ Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };


    const fetchPersonalProjects = async (token: string) => {
        setLoadingPersonalProjects(true);
        console.log('🔄 Fetching personal projects...');
        try {
            // HAPUS filter status biar yang archived juga keambil
            const res = await api.getPersonalProjects(token, {
                page: 1,
                limit: 1000
            });
            console.log('📦 Personal Projects API Response:', res);

            if (res.success && res.data) {
                const allPersonalProjects = res.data.projects || res.data || [];
                console.log('✅ Personal Projects extracted:', allPersonalProjects);
                console.log('📊 Personal Projects count:', allPersonalProjects.length);
                setPersonalProjects(allPersonalProjects);
            } else {
                console.log('⚠️ No personal projects data in response');
                setPersonalProjects([]);
            }
        } catch (error) {
            console.error('❌ Error fetching personal projects:', error);
            setPersonalProjects([]);
        } finally {
            setLoadingPersonalProjects(false);
        }
    };

    const fetchMediaAssets = async (orgId: string, token: string) => {
        setLoadingMediaAssets(true);
        console.log('🔄 Fetching media assets for org:', orgId);
        try {
            const res = await api.getAllMediaAssets(orgId, token, {
                page: 1,
                limit: 5000
            });
            console.log('📦 Media Assets API Response:', res);
            console.log('📦 Full Response JSON:', JSON.stringify(res, null, 2));

            // Coba berbagai kemungkinan struktur response
            let allAssets = [];

            if (res.success && res.data) {
                allAssets = res.data.mediaAssets
                    || res.data.assets
                    || res.data
                    || [];
            } else if (res.mediaAssets) {
                allAssets = res.mediaAssets;
            } else if (res.assets) {
                allAssets = res.assets;
            } else if (Array.isArray(res)) {
                allAssets = res;
            } else if (res.data && Array.isArray(res.data)) {
                allAssets = res.data;
            }

            console.log('✅ Media Assets extracted:', allAssets);
            console.log('📊 Media Assets count:', allAssets.length);
            setMediaAssets(allAssets);
        } catch (error) {
            console.error('❌ Error fetching media assets:', error);
            setMediaAssets([]);
        } finally {
            setLoadingMediaAssets(false);
        }
    };

    const fetchApiTokens = async (orgId: string, token: string) => {
        setLoadingApiTokens(true);
        try {
            const res = await api.getApiTokens(orgId, token);
            if (res.success && res.data) {
                setApiTokens(res.data.tokens || res.data || []);
            } else {
                setApiTokens([]);
            }
        } catch (error) {
            console.log('No API tokens yet');
            setApiTokens([]);
        } finally {
            setLoadingApiTokens(false);
        }
    };

    const fetchWorkflows = async (orgId: string, token: string) => {
        setLoadingWorkflows(true);
        try {
            const res = await api.getAllWorkflows(orgId, token);
            if (res.success && res.data) {
                setWorkflows(res.data.workflows || res.data || []);
            } else {
                setWorkflows([]);
            }
        } catch (error) {
            console.log('No workflows yet');
            setWorkflows([]);
        } finally {
            setLoadingWorkflows(false);
        }
    };

    const fetchContentData = async (token: string) => {
        try {
            // Fetch all content data from all projects
            let allSinglePages: any[] = [];
            let allMultiplePages: any[] = [];
            let allComponents: any[] = [];
            let allEntries: any[] = [];

            // Loop through all projects to get their content
            for (const project of projects) {
                try {
                    // Single Pages
                    const spRes = await api.getSinglePagesByProject(project.id, token);
                    if (spRes.success && spRes.data) {
                        allSinglePages = [...allSinglePages, ...(spRes.data.singlePages || spRes.data || [])];
                    }

                    // Multiple Pages
                    const mpRes = await api.getMultiplePagesByProject(project.id, token);
                    if (mpRes.success && mpRes.data) {
                        const multiplePagesList = mpRes.data.multiplePages || mpRes.data || [];
                        allMultiplePages = [...allMultiplePages, ...multiplePagesList];

                        // Get entries for each multiple page
                        for (const mp of multiplePagesList) {
                            try {
                                const entriesRes = await api.getEntriesByMultiplePage(mp.id, token);
                                if (entriesRes.success && entriesRes.data) {
                                    allEntries = [...allEntries, ...(entriesRes.data.entries || entriesRes.data || [])];
                                }
                            } catch (err) {
                                console.log('No entries for', mp.id);
                            }
                        }
                    }

                    // Components
                    const compRes = await api.getComponentsByProject(project.id, token);
                    if (compRes.success && compRes.data) {
                        allComponents = [...allComponents, ...(compRes.data.components || compRes.data || [])];
                    }
                } catch (err) {
                    console.log('Error fetching content for project', project.id);
                }
            }

            setSinglePages(allSinglePages);
            setMultiplePages(allMultiplePages);
            setComponents(allComponents);
            setEntries(allEntries);
        } catch (error) {
            console.log('Error fetching content data:', error);
        }
    };

    const fetchBillingAddress = async (token: string) => {
        try {
            const res = await api.getBillingAddress(token);
            if (res.success && res.data) {
                setBillingAddress(res.data);
            } else {
                setBillingAddress(null);
            }
        } catch (error: any) {
            console.log('No billing address yet');
            setBillingAddress(null);
        }
    };

    const handleUpgradePackage = () => {
        router.push('/billing/plans');
    };

    const handleCancelPackage = async () => {
        setCancelLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await api.cancelSubscription(selectedOrgId, token);

            if (res.success) {
                alert('Subscription cancelled successfully!');
                setShowCancelModal(false);
                await fetchSubscription(selectedOrgId, token);
            } else {
                alert(res.message || 'Failed to cancel subscription');
            }
        } catch (error: any) {
            console.error('Error cancelling subscription:', error);
            alert(error.message || 'Failed to cancel subscription');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleSetDefaultPayment = async (id: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await api.setDefaultPaymentMethod(id, token);

            if (res.success) {
                alert('Default payment method updated!');
                fetchPaymentMethods(token);
            } else {
                alert(res.message || 'Failed to set default payment method');
            }
        } catch (error: any) {
            console.error('Error setting default payment:', error);
            alert(error.message || 'Failed to set default payment method');
        }
    };

    const handleDeletePayment = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) return;

        try {
            const token = localStorage.getItem('token') || '';
            const res = await api.deletePaymentMethod(id, token);

            if (res.success) {
                alert('Payment method deleted!');
                fetchPaymentMethods(token);
            } else {
                alert(res.message || 'Failed to delete payment method');
            }
        } catch (error: any) {
            console.error('Error deleting payment:', error);
            alert(error.message || 'Failed to delete payment method');
        }
    };

    const handleDownloadInvoice = async (invoiceId: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await api.downloadInvoice(selectedOrgId, invoiceId, token);

            if (res.success && res.data?.invoice) {
                const invoice = res.data.invoice;
                alert(
                    `Invoice Details:\n\n` +
                    `Invoice Number: ${invoice.number}\n` +
                    `Plan: ${invoice.planName}\n` +
                    `Amount: $${convertToUSD(invoice.amount)}\n` +
                    `Status: ${invoice.status}\n` +
                    `Date: ${new Date(invoice.date).toLocaleDateString()}\n` +
                    `Payment Method: ${invoice.paymentMethod || 'N/A'}\n\n` +
                    `PDF generation will be available soon.`
                );
            } else {
                alert('Invoice data not available');
            }
        } catch (error: any) {
            console.error('Error getting invoice:', error);
            alert(error.message || 'Failed to get invoice');
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const getUsageStatus = () => {
        if (!usageData) return { status: 'Unknown', color: colors.warning };

        const allItems = Object.values(usageData);
        const hasWarning = allItems.some(item => item.warning);
        const avgPercentage = allItems.reduce((sum, item) => sum + item.percentage, 0) / allItems.length;

        if (hasWarning || avgPercentage >= 80) {
            return { status: 'High', color: colors.warning };
        } else if (avgPercentage >= 50) {
            return { status: 'Medium', color: colors.primary };
        } else {
            return { status: 'Good', color: colors.success };
        }
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

    const usageStatus = getUsageStatus();

    return (
        <div className="flex min-h-screen"
            style={{
                backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA',
                color: darkMode ? '#E0E0E0' : '#1E293B',
            }}>
            {/* Sidebar */}
            <div
                className="sticky top-0 h-screen overflow-y-auto transition-all duration-300"
                style={{
                    width: sidebarCollapsed ? '80px' : '260px',
                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    borderRight: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                }}>
                <div className="p-6 border-b sticky top-0 z-10"
                    style={{
                        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo size="small" variant={darkMode ? "alt" : "main"} />
                            {!sidebarCollapsed && (
                                <h1 className="text-xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    CMS
                                </h1>
                            )}
                        </div>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg hover:bg-opacity-10 transition-all"
                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    </div>
                </div>

                {/* Sidebar nav */}
                <nav className="p-4">
                    {menuItems.map((item) => {
                        const isActive = activeMenu === item.name;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.name}
                                onClick={() => { setActiveMenu(item.name); router.push(item.path); }}
                                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-left transition-all duration-200"
                                style={{
                                    backgroundColor: isActive ? colors.primary : 'transparent',
                                    color: isActive ? '#FFFFFF' : darkMode ? '#94A3B8' : '#64748B',
                                    fontWeight: isActive ? '600' : '400',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                <Icon size={20} />
                                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
                            </button>
                        );
                    })}

                    {/* Divider + Info */}
                    {!sidebarCollapsed && (
                        <div className="mt-6 mb-4 px-4">
                            <div className="border-t pt-4" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    PROJECT TOOLS
                                </p>
                                <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Enter a project to access Content Builder, Workflow, and other tools
                                </p>
                            </div>
                        </div>
                    )}
                </nav>

                {!sidebarCollapsed && (
                    <div className="absolute bottom-0 w-full p-4 border-t"
                        style={{
                            borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        }}>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200"
                            style={{ color: colors.error }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                            <LogOut size={20} />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b transition-colors duration-300"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                    }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Pages / Plan & Billing
                            </p>
                            <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Plan and Billing
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDarkModeToggle}
                                className="p-2.5 rounded-lg transition-all duration-200"
                                style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                    color: darkMode ? '#E0E0E0' : '#64748B',
                                }}
                                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    <ProfilePhoto size="small" primaryColor={colors.primary} />
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            Welcome back
                                        </span>
                                        <span className="font-semibold text-sm">{user?.fullName}</span>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        style={{
                                            color: darkMode ? '#64748B' : '#94A3B8',
                                            transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s'
                                        }}
                                    />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50"
                                        style={{
                                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                            borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                        }}>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setActiveMenu('Plan & Billing'); router.push('/billing'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <CreditCard
                                                size={18}
                                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                            />
                                            <span className="text-sm">Plan and Billing</span>
                                        </button>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setActiveMenu('Settings'); router.push('/settings'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <SettingsIcon size={18} />
                                            <span className="text-sm">Settings</span>
                                        </button>
                                        <div className="border-t mt-2 pt-2"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            <button
                                                onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                                                style={{ color: colors.error }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}>
                                                <LogOut size={18} />
                                                <span className="text-sm font-medium">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* Organization Selector */}
                    {organizations.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <Building2 size={20} style={{ color: colors.primary }} />
                                <select
                                    value={selectedOrgId}
                                    onChange={(e) => {
                                        const newOrgId = e.target.value;
                                        console.log('🔄 Switching to organization:', newOrgId);
                                        setSelectedOrgId(newOrgId);
                                    }}
                                    className="px-4 py-2.5 rounded-lg border font-medium transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Top Row: Package Info + Usage Overview */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* Information Package - 2 columns */}
                        <div
                            className="col-span-2 rounded-xl p-6 transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="flex items-center gap-2 mb-6">
                                <Package size={24} style={{ color: colors.primary }} />
                                <h2 className="text-xl font-semibold">Current Plan</h2>
                            </div>

                            {loadingSubscription ? (
                                <div className="text-center py-8">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                                        style={{ borderColor: colors.primary }}></div>
                                </div>
                            ) : subscription ? (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-bold">{subscription.planName || subscription.plan?.name || 'N/A'}</h3>
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: subscription.status === 'ACTIVE' ? `${colors.success}20` : `${colors.warning}20`,
                                                    color: subscription.status === 'ACTIVE' ? colors.success : colors.warning,
                                                }}>
                                                {subscription.status}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                Subscription ends
                                            </p>
                                            <p className="font-semibold text-lg">
                                                {subscription.endDate
                                                    ? new Date(subscription.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg p-4 mb-6"
                                        style={{
                                            backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                            border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                        }}>
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={subscription.autoRenew || false}
                                                disabled
                                                className="mt-1 w-4 h-4"
                                            />
                                            <div>
                                                <p className="font-semibold mb-1">Auto Renewal</p>
                                                <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                    Automatically renew your subscription at the end of each billing cycle using your saved payment method
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between mb-6">
                                        <div>
                                            <p className="text-sm mb-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                Monthly Price
                                            </p>
                                            <div className="flex items-baseline">
                                                <span className="text-5xl font-bold">
                                                    ${convertToUSD(subscription.price || subscription.plan?.price || 0)}
                                                </span>
                                                <span className="text-2xl ml-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>/month</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleUpgradePackage}
                                            className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                            style={{
                                                backgroundColor: colors.secondary,
                                                color: '#FFFFFF',
                                            }}>
                                            Upgrade Plan
                                        </button>
                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                            style={{
                                                backgroundColor: colors.error,
                                                color: '#FFFFFF',
                                            }}>
                                            Cancel Plan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 rounded-full mb-4 mx-auto flex items-center justify-center"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                        <Package size={48} style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                                    </div>
                                    <p className="font-semibold text-lg mb-2">No Active Subscription</p>
                                    <p className="text-sm mb-6" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Subscribe to a plan to unlock premium features
                                    </p>
                                    <button
                                        onClick={() => router.push('/billing/plans')}
                                        className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                        style={{
                                            backgroundColor: colors.primary,
                                            color: '#FFFFFF',
                                        }}>
                                        Browse Available Plans
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* System Usage Overview - 1 column */}
                        <div
                            className="rounded-xl p-6 transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="flex items-center gap-2 mb-6">
                                <Activity size={24} style={{ color: colors.secondary }} />
                                <h2 className="text-xl font-semibold">Usage</h2>
                            </div>

                            {loadingUsage ? (
                                <div className="text-center py-8">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                                        style={{ borderColor: colors.primary }}></div>
                                </div>
                            ) : usageData ? (
                                <div className="space-y-6">
                                    {/* Status Circle */}
                                    <div className="flex flex-col items-center mb-6">
                                        <div
                                            className="w-32 h-32 rounded-full mb-4 flex items-center justify-center"
                                            style={{
                                                backgroundColor: `${usageStatus.color}15`,
                                                border: `4px solid ${usageStatus.color}`,
                                            }}>
                                            <span className="text-2xl font-bold" style={{ color: usageStatus.color }}>
                                                {Math.round(Object.values(usageData).reduce((sum, item) => sum + item.percentage, 0) / Object.values(usageData).length)}%
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs mb-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                Overall Status
                                            </p>
                                            <span
                                                className="px-4 py-1.5 rounded-full text-sm font-semibold"
                                                style={{
                                                    backgroundColor: usageStatus.color,
                                                    color: '#FFFFFF',
                                                }}>
                                                {usageStatus.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Usage Items */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-sm">Bandwidth</span>
                                                <span className="text-xs font-semibold">
                                                    {usageData.bandwidth.used} / {usageData.bandwidth.limit === 'unlimited' ? '∞' : usageData.bandwidth.limit} GB
                                                </span>
                                            </div>
                                            {usageData.bandwidth.limit !== 'unlimited' && (
                                                <div className="w-full h-2 rounded-full overflow-hidden"
                                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(usageData.bandwidth.percentage, 100)}%`,
                                                            backgroundColor: usageData.bandwidth.warning ? colors.warning : colors.primary,
                                                        }}>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-sm">API Calls</span>
                                                <span className="text-xs font-semibold">
                                                    {usageData.apiCalls.used}k / {usageData.apiCalls.limit === 'unlimited' ? '∞' : `${usageData.apiCalls.limit}k`}
                                                </span>
                                            </div>
                                            {usageData.apiCalls.limit !== 'unlimited' && (
                                                <div className="w-full h-2 rounded-full overflow-hidden"
                                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(usageData.apiCalls.percentage, 100)}%`,
                                                            backgroundColor: usageData.apiCalls.warning ? colors.warning : colors.primary,
                                                        }}>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-sm">Media Assets</span>
                                                <span className="text-xs font-semibold">
                                                    {usageData.mediaAssets.used} / {usageData.mediaAssets.limit === 'unlimited' ? '∞' : usageData.mediaAssets.limit}
                                                </span>
                                            </div>
                                            {usageData.mediaAssets.limit !== 'unlimited' && (
                                                <div className="w-full h-2 rounded-full overflow-hidden"
                                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(usageData.mediaAssets.percentage, 100)}%`,
                                                            backgroundColor: usageData.mediaAssets.warning ? colors.warning : colors.primary,
                                                        }}>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity size={32} style={{ color: darkMode ? '#3F3F52' : '#E2E8F0' }} />
                                    <p className="text-sm mt-3" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        No usage data available
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div
                        className="rounded-xl p-6 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin size={24} style={{ color: colors.primary }} />
                            <h2 className="text-xl font-semibold">Billing Address</h2>
                        </div>

                        {billingAddress ? (
                            <>
                                <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Full Name</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.fullName}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>ZIP Code</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.zipCode || '-'}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Billing Email</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.email}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Address</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.address}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Country</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.country}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Company</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.company || '-'}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>City</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.city}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="font-medium min-w-35" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>State / Province</span>
                                        <span className="font-semibold">:</span>
                                        <span>{billingAddress.state}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/billing/address')}
                                    className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        color: '#FFFFFF',
                                    }}>
                                    Update Address
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full mb-4 mx-auto flex items-center justify-center"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                    <MapPin size={32} style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                                </div>
                                <p className="font-medium mb-2">No Billing Address</p>
                                <p className="text-sm mb-4" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Add your billing address to complete your profile
                                </p>
                                <button
                                    onClick={() => router.push('/billing/address')}
                                    className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                    style={{
                                        backgroundColor: colors.primary,
                                        color: '#FFFFFF',
                                    }}>
                                    Add Address
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Payment Methods */}
                    <div
                        className="rounded-xl p-6 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <CreditCard size={24} style={{ color: colors.secondary }} />
                                <h2 className="text-xl font-semibold">Payment Methods</h2>
                            </div>
                            <button
                                onClick={() => router.push('/billing/payment-methods/add')}
                                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: colors.primary,
                                    color: '#FFFFFF',
                                }}>
                                <Plus size={18} />
                                Add Method
                            </button>
                        </div>

                        {loadingPayments ? (
                            <div className="text-center py-8">
                                <div
                                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                                    style={{ borderColor: colors.primary }}></div>
                            </div>
                        ) : paymentMethods.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                                        style={{
                                            backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                            borderColor: method.isDefault ? colors.primary : darkMode ? '#4A4A5E' : '#E2E8F0',
                                            borderWidth: method.isDefault ? '2px' : '1px',
                                        }}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                                                <CreditCard size={24} style={{ color: colors.primary }} />
                                            </div>
                                            <div>
                                                <p className="font-semibold mb-1">
                                                    {method.type === 'CREDIT_CARD'
                                                        ? `${method.cardBrand} •••• ${method.cardLastFour}`
                                                        : `${method.walletProvider} - ${method.walletPhone}`}
                                                </p>
                                                {method.isDefault && (
                                                    <span
                                                        className="text-xs px-2 py-1 rounded-full inline-flex items-center gap-1"
                                                        style={{
                                                            backgroundColor: `${colors.success}20`,
                                                            color: colors.success,
                                                        }}>
                                                        <Check size={12} />
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!method.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefaultPayment(method.id)}
                                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                                                    style={{
                                                        color: colors.primary,
                                                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                                    }}>
                                                    Set Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeletePayment(method.id)}
                                                className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                                                style={{ color: colors.error }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full mb-4 mx-auto flex items-center justify-center"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                    <CreditCard size={32} style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                                </div>
                                <p className="font-medium mb-2">No Payment Methods</p>
                                <p className="text-sm mb-4" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Add a payment method to enable auto-renewal
                                </p>
                                <button
                                    onClick={() => router.push('/billing/payment-methods/add')}
                                    className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                    style={{
                                        backgroundColor: colors.primary,
                                        color: '#FFFFFF',
                                    }}>
                                    Add Payment Method
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Detail Resource Usage */}
                    {subscription && (
                        <div
                            className="rounded-xl p-6 mb-6 transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp size={24} style={{ color: colors.primary }} />
                                <h2 className="text-xl font-semibold">Resource Usage Details</h2>
                            </div>


                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {/* Organization Projects */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FolderOpen size={18} style={{ color: colors.primary }} />
                                        <span className="font-semibold text-sm">Org Projects</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                                        {projects.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        of {usageData?.projects.limit === 'unlimited' ? '∞' : usageData?.projects.limit || 0}
                                    </p>
                                </div>

                                {/* Personal Projects */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={18} style={{ color: colors.secondary }} />
                                        <span className="font-semibold text-sm">Personal Projects</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.secondary }}>
                                        {personalProjects.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Total
                                    </p>
                                </div>

                                {/* Media Assets */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image size={18} style={{ color: colors.success }} />
                                        <span className="font-semibold text-sm">Media Assets</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.success }}>
                                        {mediaAssets.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        of {usageData?.mediaAssets.limit === 'unlimited' ? '∞' : usageData?.mediaAssets.limit || 0}
                                    </p>
                                </div>

                                {/* Single Pages */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={18} style={{ color: colors.primary }} />
                                        <span className="font-semibold text-sm">Single Pages</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                                        {singlePages.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Total created
                                    </p>
                                </div>

                                {/* Multiple Pages */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Layers size={18} style={{ color: colors.secondary }} />
                                        <span className="font-semibold text-sm">Multiple Pages</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.secondary }}>
                                        {multiplePages.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Total created
                                    </p>
                                </div>

                                {/* Components */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package size={18} style={{ color: colors.warning }} />
                                        <span className="font-semibold text-sm">Components</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.warning }}>
                                        {components.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Reusable
                                    </p>
                                </div>

                                {/* Entries */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={18} style={{ color: colors.success }} />
                                        <span className="font-semibold text-sm">Entries</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.success }}>
                                        {entries.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Content items
                                    </p>
                                </div>

                                {/* API Tokens */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Plug size={18} style={{ color: colors.primary }} />
                                        <span className="font-semibold text-sm">API Tokens</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                                        {apiTokens.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Active tokens
                                    </p>
                                </div>

                                {/* Workflows */}
                                <div className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
                                        border: `1px solid ${darkMode ? '#4A4A5E' : '#E2E8F0'}`,
                                    }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <GitPullRequest size={18} style={{ color: colors.secondary }} />
                                        <span className="font-semibold text-sm">Workflows</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-1" style={{ color: colors.secondary }}>
                                        {workflows.length}
                                    </p>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Configured
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing History */}
                    {subscription && (
                        <div
                            className="rounded-xl p-6 transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar size={24} style={{ color: colors.primary }} />
                                <h2 className="text-xl font-semibold">Billing History</h2>
                            </div>

                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                                        style={{ borderColor: colors.primary }}></div>
                                </div>
                            ) : billingHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr
                                                className="border-b"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <th className="text-left py-3 px-4 font-semibold">Plan</th>
                                                <th className="text-left py-3 px-4 font-semibold">Date</th>
                                                <th className="text-left py-3 px-4 font-semibold">Amount</th>
                                                <th className="text-left py-3 px-4 font-semibold">Status</th>
                                                <th className="text-left py-3 px-4 font-semibold">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billingHistory.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b transition-colors duration-200"
                                                    style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                    <td className="py-4 px-4 font-medium">{item.planName}</td>
                                                    <td className="py-4 px-4" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                        {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-4 px-4 font-bold">${convertToUSD(item.amount)}</td>
                                                    <td className="py-4 px-4">
                                                        <span
                                                            className="px-3 py-1 rounded-full text-xs font-semibold"
                                                            style={{
                                                                backgroundColor:
                                                                    item.status === 'PAID'
                                                                        ? `${colors.success}20`
                                                                        : item.status === 'PENDING'
                                                                            ? `${colors.warning}20`
                                                                            : `${colors.primary}20`,
                                                                color:
                                                                    item.status === 'PAID'
                                                                        ? colors.success
                                                                        : item.status === 'PENDING'
                                                                            ? colors.warning
                                                                            : colors.primary,
                                                            }}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => handleDownloadInvoice(item.id)}
                                                            className="flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:opacity-70"
                                                            style={{ color: colors.primary }}>
                                                            <Download size={16} />
                                                            Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full mb-4 mx-auto flex items-center justify-center"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                        <Calendar size={32} style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                                    </div>
                                    <p className="font-medium mb-2">No Billing History</p>
                                    <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Your transaction history will appear here
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Package Modal */}
            {showCancelModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowCancelModal(false)}>
                    <div
                        className="rounded-xl p-6 max-w-md w-full mx-4"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Cancel Subscription</h3>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="p-1 hover:opacity-70 transition-opacity">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-6 p-4 rounded-lg"
                            style={{
                                backgroundColor: `${colors.error}10`,
                                border: `1px solid ${colors.error}30`,
                            }}>
                            <div className="flex items-start gap-3">
                                <AlertCircle size={20} style={{ color: colors.error, marginTop: '2px' }} />
                                <p className="text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Are you sure you want to cancel your subscription? You will lose access to all premium features at the end of your current billing period.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                    color: darkMode ? '#E0E0E0' : '#1E293B',
                                }}>
                                Keep Subscription
                            </button>
                            <button
                                onClick={handleCancelPackage}
                                disabled={cancelLoading}
                                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: colors.error,
                                    color: '#FFFFFF',
                                    opacity: cancelLoading ? 0.5 : 1,
                                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                                }}>
                                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}