'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    LogOut, Building2, Sun, Moon, CreditCard, Settings as SettingsIcon,
    ChevronDown, LayoutDashboard, Settings, FolderOpen, Bell, Menu, X,
    Smartphone, ArrowLeft
} from 'lucide-react';
import { getUser, logout, validateAuth } from '../../../lib/auth';
import Logo from '../../../components/Logo';
import ProfilePhoto from '../../../components/ProfilePhoto';
import api from '../../../lib/api';

export default function AddPaymentMethodPage() {
    const router = useRouter();
    const profileRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Plan & Billing');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [paymentType, setPaymentType] = useState<'CREDIT_CARD' | 'EWALLET'>('CREDIT_CARD');

    const [formData, setFormData] = useState({
        cardLastFour: '',
        cardBrand: 'Visa',
        walletProvider: 'Dana',
        walletPhone: '',
        isDefault: false,
    });

    const colors = {
        primary: '#3A7AC3',
        secondary: '#38C0A8',
        error: '#F93232',
        info: '#3A7AC3',
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Organization Projects', path: '/organization-projects', icon: Building2 },
        { name: 'Personal Projects', path: '/personal-projects', icon: FolderOpen },
        { name: 'Plan & Billing', path: '/billing', icon: CreditCard },
        { name: 'Notification', path: '/invitations', icon: Bell },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        const html = document.documentElement;
        savedDarkMode ? html.classList.add('dark') : html.classList.remove('dark');
    }, []);

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
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDarkModeToggle = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', String(newDarkMode));
        const html = document.documentElement;
        newDarkMode ? html.classList.add('dark') : html.classList.remove('dark');
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token') || '';
            const payload: any = {
                type: paymentType,
                isDefault: formData.isDefault,
            };

            if (paymentType === 'CREDIT_CARD') {
                if (!formData.cardLastFour || !formData.cardBrand) {
                    alert('Please fill in all credit card fields');
                    setSaving(false);
                    return;
                }
                payload.cardLastFour = formData.cardLastFour;
                payload.cardBrand = formData.cardBrand;
            } else {
                if (!formData.walletProvider || !formData.walletPhone) {
                    alert('Please fill in all e-wallet fields');
                    setSaving(false);
                    return;
                }
                payload.walletProvider = formData.walletProvider;
                payload.walletPhone = formData.walletPhone;
            }

            const res = await api.addPaymentMethod(payload, token);
            if (res.success) {
                alert('Payment method added successfully!');
                router.push('/billing');
            } else {
                alert(res.message || 'Failed to add payment method');
            }
        } catch (error: any) {
            alert(error.message || 'Failed to add payment method');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colors.primary }}></div>
                    <p style={{ color: darkMode ? '#E0E0E0' : '#64748B' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen"
            style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA', color: darkMode ? '#E0E0E0' : '#1E293B' }}>
            {/* Sidebar */}
            <div className="sticky top-0 h-screen overflow-y-auto transition-all duration-300"
                style={{
                    width: sidebarCollapsed ? '80px' : '260px',
                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    borderRight: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                }}>
                <div className="p-6 border-b sticky top-0 z-10"
                    style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo size="small" variant={darkMode ? "alt" : "main"} />
                            {!sidebarCollapsed && <h1 className="text-xl font-bold">CMS</h1>}
                        </div>
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg">
                            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    </div>
                </div>
                <nav className="p-4">
                    {menuItems.map((item) => {
                        const isActive = activeMenu === item.name;
                        const Icon = item.icon;
                        return (
                            <button key={item.name} onClick={() => { setActiveMenu(item.name); router.push(item.path); }}
                                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-left transition-all duration-200"
                                style={{
                                    backgroundColor: isActive ? colors.primary : 'transparent',
                                    color: isActive ? '#FFFFFF' : darkMode ? '#94A3B8' : '#64748B',
                                    fontWeight: isActive ? '600' : '400',
                                }}>
                                <Icon size={20} />
                                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>
                {!sidebarCollapsed && (
                    <div className="absolute bottom-0 w-full p-4 border-t"
                        style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left"
                            style={{ color: colors.error }}>
                            <LogOut size={20} />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b"
                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Pages / Plan & Billing / Add Payment Method
                            </p>
                            <h2 className="text-2xl font-bold">Add Payment Method</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleDarkModeToggle} className="p-2.5 rounded-lg"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div className="relative" ref={profileRef}>
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                    <ProfilePhoto size="small" primaryColor={colors.primary} />
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Welcome back</span>
                                        <span className="font-semibold text-sm">{user?.fullName}</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </button>
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50"
                                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        <button onClick={() => { setShowProfileMenu(false); router.push('/billing'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left">
                                            <CreditCard size={18} />
                                            <span className="text-sm">Plan and Billing</span>
                                        </button>
                                        <button onClick={() => { setShowProfileMenu(false); router.push('/settings'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left">
                                            <SettingsIcon size={18} />
                                            <span className="text-sm">Settings</span>
                                        </button>
                                        <div className="border-t mt-2 pt-2" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                                                style={{ color: colors.error }}>
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

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-sm font-medium"
                        style={{ color: colors.primary }}>
                        <ArrowLeft size={18} />
                        Back to Billing
                    </button>

                    <div className="max-w-2xl mx-auto">
                        {/* Payment Type Selector */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button onClick={() => setPaymentType('CREDIT_CARD')}
                                className="p-6 rounded-xl border-2 transition-all duration-200"
                                style={{
                                    backgroundColor: paymentType === 'CREDIT_CARD' ? darkMode ? '#2D2D3F' : '#FFFFFF' : 'transparent',
                                    borderColor: paymentType === 'CREDIT_CARD' ? colors.primary : darkMode ? '#3F3F52' : '#E2E8F0',
                                }}>
                                <CreditCard size={32} style={{ color: colors.primary }} className="mx-auto mb-3" />
                                <p className="font-semibold">Credit Card</p>
                            </button>
                            <button onClick={() => setPaymentType('EWALLET')}
                                className="p-6 rounded-xl border-2 transition-all duration-200"
                                style={{
                                    backgroundColor: paymentType === 'EWALLET' ? darkMode ? '#2D2D3F' : '#FFFFFF' : 'transparent',
                                    borderColor: paymentType === 'EWALLET' ? colors.primary : darkMode ? '#3F3F52' : '#E2E8F0',
                                }}>
                                <Smartphone size={32} style={{ color: colors.secondary }} className="mx-auto mb-3" />
                                <p className="font-semibold">E-Wallet</p>
                            </button>
                        </div>

                        {/* Form */}
                        <div className="rounded-xl p-6"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}` }}>
                            {paymentType === 'CREDIT_CARD' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Card Brand</label>
                                        <select value={formData.cardBrand}
                                            onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}>
                                            <option value="Visa">Visa</option>
                                            <option value="Mastercard">Mastercard</option>
                                            <option value="American Express">American Express</option>
                                            <option value="JCB">JCB</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Last 4 Digits</label>
                                        <input type="text" value={formData.cardLastFour}
                                            onChange={(e) => setFormData({ ...formData, cardLastFour: e.target.value })}
                                            maxLength={4} placeholder="1234" className="w-full px-4 py-2 rounded-lg border"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">E-Wallet Provider</label>
                                        <select value={formData.walletProvider}
                                            onChange={(e) => setFormData({ ...formData, walletProvider: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}>
                                            <option value="Dana">Dana</option>
                                            <option value="GoPay">GoPay</option>
                                            <option value="OVO">OVO</option>
                                            <option value="LinkAja">LinkAja</option>
                                            <option value="ShopeePay">ShopeePay</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone Number</label>
                                        <input type="text" value={formData.walletPhone}
                                            onChange={(e) => setFormData({ ...formData, walletPhone: e.target.value })}
                                            placeholder="089123456789" className="w-full px-4 py-2 rounded-lg border"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-2 mt-6 cursor-pointer">
                                <input type="checkbox" checked={formData.isDefault}
                                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} />
                                <span className="text-sm">Set as default payment method</span>
                            </label>

                            <button onClick={handleSubmit} disabled={saving}
                                className="w-full py-3 rounded-lg font-semibold mt-6"
                                style={{ backgroundColor: colors.primary, color: '#FFFFFF', opacity: saving ? 0.5 : 1 }}>
                                {saving ? 'Adding...' : 'Add Payment Method'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}