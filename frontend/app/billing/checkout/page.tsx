'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    LogOut, Building2, Sun, Moon, CreditCard, Settings as SettingsIcon,
    ChevronDown, LayoutDashboard, Settings, FolderOpen, Bell, Menu, X,
    Calendar, Check, AlertCircle, Loader, ArrowLeft
} from 'lucide-react';
import api from '../../lib/api';
import { getUser, logout, validateAuth } from '../../lib/auth';
import Logo from '../../components/Logo';
import ProfilePhoto from '../../components/ProfilePhoto';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
}

interface BillingAddress {
    fullName: string;
    email: string;
    country: string;
    city: string;
    zipCode?: string;
    state: string;
    address: string;
    company?: string;
}

function CheckoutPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const profileRef = useRef<HTMLDivElement>(null);

    const planId = searchParams.get('planId');
    const orgId = searchParams.get('orgId');

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Plan & Billing');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [plan, setPlan] = useState<Plan | null>(null);
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [monthQuantity, setMonthQuantity] = useState(1);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const [billingAddress, setBillingAddress] = useState<BillingAddress>({
        fullName: '',
        email: '',
        country: '',
        city: '',
        zipCode: '',
        state: '',
        address: '',
        company: '',
    });

    const colors = {
        primary: '#3A7AC3',
        secondary: '#38C0A8',
        warning: '#FFC973',
        error: '#F93232',
        success: '#38C0A8',
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

        if (!planId || !orgId) {
            alert('❌ Missing plan or organization ID');
            router.push('/billing/plans');
            return;
        }

        const userData = getUser();
        if (userData) setUser(userData);

        fetchData();
    }, [planId, orgId, router]);

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';

            const planRes = await api.getPlanById(planId!);
            if (planRes.success && planRes.data) {
                setPlan(planRes.data);
            } else {
                alert('Plan not found');
                router.push('/billing/plans');
                return;
            }

            const addressRes = await api.getBillingAddress(token);
            if (addressRes.success && addressRes.data) {
                setBillingAddress(addressRes.data);
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!plan) return 0;

        const basePrice = plan.price;

        if (billingCycle === 'YEARLY') {
            const yearlyPrice = basePrice * 12;
            return yearlyPrice * 0.9;
        } else {
            return basePrice * monthQuantity;
        }
    };

    const handlePurchase = async () => {
        if (!acceptTerms) {
            alert('⚠️ Please accept the terms and conditions');
            return;
        }

        if (!billingAddress.fullName || !billingAddress.email || !billingAddress.country ||
            !billingAddress.city || !billingAddress.state || !billingAddress.address) {
            alert('⚠️ Please fill in all required billing information');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(billingAddress.email)) {
            alert('⚠️ Please enter a valid email address');
            return;
        }

        setPurchasing(true);

        try {
            const token = localStorage.getItem('token') || '';

            console.log('Saving billing address...');
            const addressRes = await api.createOrUpdateBillingAddress(billingAddress, token);

            if (!addressRes.success) {
                throw new Error(addressRes.message || 'Failed to save billing address');
            }

            console.log('Billing address saved!');
            console.log('Creating subscription...');

            const subscriptionRes = await api.createSubscription(
                {
                    organizationId: orgId!,
                    planId: planId!,
                    billingCycle: billingCycle,
                },
                token
            );

            if (!subscriptionRes.success) {
                throw new Error(subscriptionRes.message || 'Failed to create subscription');
            }

            const { subscription, paymentUrl, transactionId } = subscriptionRes.data;

            console.log('Subscription created:', subscription.id);
            console.log('Transaction ID:', transactionId);

            if (plan?.price === 0 || !paymentUrl) {
                console.log('Free plan activated!');
                alert('Subscription activated successfully!');
                router.push('/billing');
                return;
            }

            console.log('Redirecting to Midtrans payment page...');
            localStorage.setItem('pending_transaction', transactionId);
            window.location.href = paymentUrl;

        } catch (error: any) {
            console.error('Purchase error:', error);
            alert(`Purchase failed: ${error.message || 'Unknown error'}`);
            setPurchasing(false);
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

    if (!plan) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4" style={{ color: colors.error }} />
                    <p className="font-semibold mb-2">Plan not found</p>
                    <button onClick={() => router.push('/billing/plans')}
                        className="px-6 py-2 rounded-lg font-medium"
                        style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}>
                        Back to Plans
                    </button>
                </div>
            </div>
        );
    }

    const subtotal = calculateTotal();
    const total = subtotal;

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
                                Pages / Plan & Billing / Checkout
                            </p>
                            <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
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
                        Back to Plans
                    </button>

                    <div className="grid grid-cols-3 gap-8">
                        {/* Left: Billing Form */}
                        <div className="col-span-2 space-y-6">
                            {/* Billing Address */}
                            <div className="rounded-xl p-6 border"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                    borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                }}>
                                <h2 className="text-xl font-semibold mb-6">Billing Information</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Full Name <span style={{ color: colors.error }}>*</span>
                                        </label>
                                        <input type="text" value={billingAddress.fullName}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, fullName: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="John Doe"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Email <span style={{ color: colors.error }}>*</span>
                                        </label>
                                        <input type="email" value={billingAddress.email}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="john@example.com"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Country <span style={{ color: colors.error }}>*</span>
                                        </label>
                                        <input type="text" value={billingAddress.country}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="Indonesia"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            City <span style={{ color: colors.error }}>*</span>
                                        </label>
                                        <input type="text" value={billingAddress.city}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="Jakarta"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">ZIP Code</label>
                                        <input type="text" value={billingAddress.zipCode}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, zipCode: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="12345"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            State/Province <span style={{ color: colors.error }}>*</span>
                                        </label>
                                        <input type="text" value={billingAddress.state}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="DKI Jakarta"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Address <span style={{ color: colors.error }}>*</span>
                                        </label>
                                        <textarea value={billingAddress.address}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                                            rows={3} className="w-full px-4 py-2 rounded-lg border resize-none"
                                            placeholder="Jl. Sudirman No. 123"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-2">Company (Optional)</label>
                                        <input type="text" value={billingAddress.company}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, company: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border" placeholder="Acme Corp"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Billing Cycle */}
                            <div className="rounded-xl p-6 border"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                    borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                }}>
                                <h2 className="text-xl font-semibold mb-4">Billing Cycle</h2>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <button onClick={() => setBillingCycle('MONTHLY')}
                                        className="p-4 rounded-lg border-2 text-left transition-all"
                                        style={{
                                            borderColor: billingCycle === 'MONTHLY' ? colors.primary : darkMode ? '#3F3F52' : '#E2E8F0',
                                            backgroundColor: billingCycle === 'MONTHLY' ? `${colors.primary}10` : 'transparent',
                                        }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold">Monthly</span>
                                            {billingCycle === 'MONTHLY' && (
                                                <Check size={20} style={{ color: colors.primary }} />
                                            )}
                                        </div>
                                        <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            ${plan.price} per month
                                        </p>
                                    </button>

                                    <button onClick={() => setBillingCycle('YEARLY')}
                                        className="p-4 rounded-lg border-2 text-left relative transition-all"
                                        style={{
                                            borderColor: billingCycle === 'YEARLY' ? colors.primary : darkMode ? '#3F3F52' : '#E2E8F0',
                                            backgroundColor: billingCycle === 'YEARLY' ? `${colors.primary}10` : 'transparent',
                                        }}>
                                        <span className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold"
                                            style={{ backgroundColor: colors.success, color: '#FFFFFF' }}>
                                            Save 10%
                                        </span>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold">Yearly</span>
                                            {billingCycle === 'YEARLY' && (
                                                <Check size={20} style={{ color: colors.primary }} />
                                            )}
                                        </div>
                                        <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            ${(plan.price * 12 * 0.9).toFixed(2)} per year
                                        </p>
                                    </button>
                                </div>

                                {billingCycle === 'MONTHLY' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Number of Months</label>
                                        <input type="number" min="1" max="12" value={monthQuantity}
                                            onChange={(e) => setMonthQuantity(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                                            className="w-full px-4 py-2 rounded-lg border"
                                            style={{
                                                backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
                                                borderColor: darkMode ? '#4A4A5E' : '#E2E8F0',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Order Summary */}
                        <div>
                            <div className="rounded-xl p-6 border sticky top-8"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                    borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                }}>
                                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <p className="font-semibold text-lg">{plan.name}</p>
                                        <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="flex justify-between py-3 border-t" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        <span>Billing Cycle</span>
                                        <span className="font-medium">
                                            {billingCycle === 'YEARLY' ? 'Yearly' : `${monthQuantity} Month${monthQuantity > 1 ? 's' : ''}`}
                                        </span>
                                    </div>

                                    <div className="flex justify-between py-3 border-t" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        <span>Subtotal</span>
                                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                                    </div>

                                    {billingCycle === 'YEARLY' && (
                                        <div className="flex justify-between py-2 text-sm" style={{ color: colors.success }}>
                                            <span>Yearly Discount (10%)</span>
                                            <span>-${((plan.price * 12) - subtotal).toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between py-3 border-t text-lg font-bold" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                            className="mt-1"
                                        />
                                        <span className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            I agree to the{' '}
                                            <a href="#" className="underline" style={{ color: colors.primary }}>
                                                Terms and Conditions
                                            </a>{' '}
                                            and{' '}
                                            <a href="#" className="underline" style={{ color: colors.primary }}>
                                                Privacy Policy
                                            </a>
                                        </span>
                                    </label>
                                </div>

                                <button onClick={handlePurchase} disabled={purchasing}
                                    className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                                    style={{
                                        backgroundColor: purchasing ? darkMode ? '#3F3F52' : '#E2E8F0' : colors.primary,
                                        color: purchasing ? darkMode ? '#94A3B8' : '#64748B' : '#FFFFFF',
                                        cursor: purchasing ? 'not-allowed' : 'pointer',
                                    }}>
                                    {purchasing ? (
                                        <>
                                            <Loader className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Complete Purchase
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-center mt-4" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Secure payment powered by Midtrans
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutPageContent />
        </Suspense>
    );
}