'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    LogOut, Building2, Users, Sun, Moon, CreditCard, Settings as SettingsIcon,
    ChevronDown, LayoutDashboard, Settings, FolderOpen, Bell, Menu, X,
    ArrowLeft, Package, Check
} from 'lucide-react';
import { getUser, logout, validateAuth } from '../../lib/auth';
import Logo from '../../components/Logo';
import ProfilePhoto from '../../components/ProfilePhoto';
import api from '../../lib/api';
import type { Plan } from '../types';

export default function PlansPage() {
    const router = useRouter();
    const profileRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Plan & Billing');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [organizations, setOrganizations] = useState<any[]>([]);

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

    const convertToUSD = (rupiahAmount: number | string): string => {
        const amount = Number(rupiahAmount) || 0;
        return (amount / 10000).toFixed(2);
    };

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
        if (!loading) {
            fetchData();
        }
    }, [loading]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token') || '';

            const orgsRes = await api.getOrganizations(token);
            const orgs = orgsRes?.data || [];
            setOrganizations(orgs);
            if (orgs.length > 0) {
                setSelectedOrgId(orgs[0].id);
            }

            const plansRes = await api.getAllPlans(true);
            if (plansRes.success && plansRes.data) {
                const sortedPlans = plansRes.data.sort(
                    (a: Plan, b: Plan) => parseFloat(a.price) - parseFloat(b.price)
                );
                setPlans(sortedPlans);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const handleSelectPlan = (planId: string) => {
        if (!selectedOrgId) {
            alert('Please select an organization first');
            return;
        }
        router.push(`/billing/checkout?planId=${planId}&orgId=${selectedOrgId}`);
    };

    const handleBack = () => {
        router.push('/billing');
    };

    // ✅ Format complete feature text exactly like the UI design
    const formatFeatureText = (key: string, value: any, planName?: string): string => {
        // Handle unlimited values
        if (value === 'unlimited' || value === -1 || value === '-1') {
            if (key === 'personalProjectLimit') return 'Unlimited Personal Projects';
            if (key === 'projectLimit') return 'Unlimited Organization Projects';
            if (key === 'mediaAssetLimit') return 'unlimited file media assets';
            return 'Unlimited';
        }

        const numValue = Number(value);

        // Format based on specific keys - EXACTLY like the UI
        switch (key) {
            case 'userLimit':
                // For Free plan: "1 User"
                return `${numValue} User`;

            case 'personalProjectLimit':
                return `${numValue} Personal Projects`;

            case 'projectLimit':
                // "10 Organization (20 Projects)" - each org unit = 2 projects
                const totalProjects = numValue * 2;
                return `${numValue} Organization (${totalProjects} Projects)`;

            case 'collaboratorLimit':
                // Different text based on plan type
                if (planName?.toLowerCase().includes('professional')) {
                    return `${numValue} User for organization (must Pro)`;
                } else if (planName?.toLowerCase().includes('enterprise')) {
                    return `${numValue} User for organization (all users)`;
                }
                return `${numValue} User for organization`;

            case 'apiCallLimit':
                // Convert to readable format (K for thousands, Million for millions)
                if (numValue >= 1000000) {
                    return `${numValue / 1000000} Million / month API calls`;
                } else if (numValue >= 1000) {
                    return `${numValue / 1000}K / month API calls`;
                }
                return `${numValue} / month API calls`;

            case 'mediaAssetLimit':
                return `${numValue} file media assets`;

            case 'bandwidthLimit':
                return `${numValue} GB / month`;

            default:
                // Generic formatting
                let label = key.replace(/Limit$/, '');
                label = label.replace(/([A-Z])/g, ' $1').trim();
                label = label.charAt(0).toUpperCase() + label.slice(1);
                return `${numValue} ${label}`;
        }
    };

    // ✅ Format boolean feature names
    const formatBooleanFeatureName = (key: string): string => {
        const featureNames: { [key: string]: string } = {
            'seoIntegrated': 'SEO Integrated',
            'aiAssistance': 'AI Assistance',
            'customDomain': 'Custom Domain',
            'fullSourceCodeAccess': 'Full Source Code Access',
            'fullyConfigurableModules': 'Fully Configurable Modules',
            'customBranding': 'Custom Branding',
            'cmsOwnership': 'CMS Ownership',
            'lifetimeLicence': 'Lifetime licence'
        };

        if (featureNames[key]) {
            return featureNames[key];
        }

        // Default formatting
        let name = key.replace(/([A-Z])/g, ' $1').trim();
        return name.charAt(0).toUpperCase() + name.slice(1);
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
                                Pages / Plan & Billing / Plans
                            </p>
                            <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Choose Your Plan
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
                                            <CreditCard size={18} />
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
                    {/* Back Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                            style={{
                                backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                color: darkMode ? '#E0E0E0' : '#1E293B',
                            }}>
                            <ArrowLeft size={18} />
                            Back to Billing
                        </button>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Choose Plan</h1>
                        <p className="text-base" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            Choose a plan that suits your project
                        </p>
                    </div>

                    {/* Organization Selector */}
                    {organizations.length > 0 && (
                        <div className="max-w-md mx-auto mb-8">
                            <label className="block text-sm font-medium mb-2">Select Organization</label>
                            <div className="flex items-center gap-3">
                                <Building2 size={20} style={{ color: colors.primary }} />
                                <select
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border transition-all duration-200"
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

                    {/* Plans Grid */}
                    {plans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                            {plans.map((plan) => {
                                const isFree = parseFloat(plan.price) === 0;
                                const priceInUSD = convertToUSD(plan.price);

                                const getButtonText = () => {
                                    if (plan.name.toLowerCase().includes('white label')) {
                                        return 'Contact us';
                                    }
                                    if (isFree) {
                                        return 'Get Started';
                                    }
                                    return 'Purchase';
                                };

                                const getButtonColor = () => {
                                    if (plan.name.toLowerCase().includes('white label')) {
                                        return colors.warning;
                                    }
                                    return colors.primary;
                                };

                                return (
                                    <div
                                        key={plan.id}
                                        className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg"
                                        style={{
                                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        }}>
                                        {/* Plan Name */}
                                        <h3 className="text-xl font-bold mb-3">{plan.name}</h3>

                                        {/* Price */}
                                        <div className="mb-3">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold">${priceInUSD}</span>
                                                <span className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                    / month
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {plan.description && (
                                            <p
                                                className="text-sm mb-6"
                                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                {plan.description}
                                            </p>
                                        )}

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => handleSelectPlan(plan.id)}
                                            className="w-full py-2.5 rounded-lg font-semibold mb-6 transition-all duration-200 hover:opacity-90"
                                            style={{
                                                backgroundColor: getButtonColor(),
                                                color: '#FFFFFF',
                                            }}>
                                            {getButtonText()}
                                        </button>

                                        {/* Included Features - HARDCODED TO MATCH UI EXACTLY */}
                                        <div>
                                            <p className="text-sm font-semibold mb-3">Included Features</p>
                                            <div className="space-y-1.5">
                                                {/* FREE/DEMO PLAN */}
                                                {plan.name.toLowerCase().includes('free') || plan.name.toLowerCase().includes('demo') ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>1 User</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>5 Personal Projects</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>500K / month API calls</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>100 file media assets</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>SEO Integrated</span>
                                                        </div>
                                                    </>
                                                ) : null}

                                                {/* PROFESSIONAL PLAN */}
                                                {plan.name.toLowerCase().includes('professional') ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>10 User for organization (must Pro)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>50 Personal Projects</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>10 Organization (20 Projects)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>5 Million / month API calls</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>5000 file media assets</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>SEO Integrated</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>AI Assistance</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Custom Domain</span>
                                                        </div>
                                                    </>
                                                ) : null}

                                                {/* ENTERPRISE PLAN */}
                                                {plan.name.toLowerCase().includes('enterprise') ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>50 User for organization (all users)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Unlimited Personal Projects</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>50 Organization (100 Projects)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>10 Million / month API calls</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>unlimited file media assets</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>SEO Integrated</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>AI Assistance</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Custom Domain</span>
                                                        </div>
                                                    </>
                                                ) : null}

                                                {/* WHITE LABEL PLAN */}
                                                {plan.name.toLowerCase().includes('white label') ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Full Source Code Access</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Fully Configurable Modules</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Custom Branding</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>CMS Ownership</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Check size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                                                            <span className="text-xs" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Lifetime licence</span>
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>

                                        {/* Read All Details Link */}
                                        <button
                                            className="text-sm font-medium mt-6 hover:opacity-70 transition-opacity flex items-center gap-1"
                                            style={{ color: colors.primary }}>
                                            Read all details →
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div
                            className="rounded-xl p-12 text-center max-w-md mx-auto"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <Package size={48} className="mx-auto mb-4" style={{ color: darkMode ? '#3F3F52' : '#E2E8F0' }} />
                            <p className="font-medium mb-2">No Plans Available</p>
                            <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Please contact support for assistance
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}