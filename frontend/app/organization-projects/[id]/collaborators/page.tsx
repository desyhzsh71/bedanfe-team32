'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Search, Plus, Trash2, X, Sun, Moon, ChevronDown, LogOut, CreditCard,
    Settings, Mail, UserPlus, Shield, CheckCircle, Clock, XCircle, LayoutDashboard,
    Building2, FolderOpen, FileText, Layers, GitPullRequest, Image, Plug, Bell, Menu,
    Settings as SettingsIcon } from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../../../lib/auth';
import { api } from '../../../lib/api';
import Logo from '../../../components/Logo';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import CollaboratorAvatar from '@/app/components/CollaboratorAvatar';
import UsageIndicator from '@/app/components/UsageIndicator';

interface Member {
    id: string;
    userId: number;
    role: string;
    status: string;
    joinedAt: string;
    user: {
        id: number;
        fullName: string;
        email: string;
        company?: string;
        job?: string;
        photoUrl?: string;
    };
}

interface CollaboratorsData {
    all: Member[];
    active: Member[];
    pending: Member[];
    inactive: Member[];
}

export default function OrganizationCollaboratorsPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params?.id as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState<CollaboratorsData>({
        all: [],
        active: [],
        pending: [],
        inactive: []
    });
    const [orgName, setOrgName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState('Organization Projects');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'inactive'>('active');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [newRole, setNewRole] = useState('');
    const [updatingRole, setUpdatingRole] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [usageData, setUsageData] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);

    const colors = {
        primary: '#3A7AC3',
        secondary: '#38C0A8',
        accent: '#534581',
        error: '#F93232',
        warning: '#FFC973',
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
        if (orgId && isAuthenticated()) {
            loadUsageData();
        }
    }, [orgId]);

    const loadUsageData = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const subResponse = await api.getCurrentSubscription(orgId, token);
            if (subResponse.success && subResponse.data) {
                setSubscription(subResponse.data.subscription);
            }

            const usageResponse = await api.getCurrentUsage(orgId, token);
            if (usageResponse.success && usageResponse.data) {
                setUsageData(usageResponse.data.usage);
            }
        } catch (error: any) {
            console.error('Error loading usage:', error);
        }
    };

    // dark mode
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
        const initPage = async () => {
            if (!isAuthenticated()) {
                router.push('/login');
                return;
            }

            const userData = getUser();
            if (userData) {
                setUser(userData);
                if (orgId) {
                    await loadOrganization();
                    await loadCollaborators();
                }
            } else {
                router.push('/login');
            }
        };

        initPage();
    }, [orgId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadOrganization = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await api.getOrganizationById(orgId, token);
            if (response.success && response.data) {
                setOrgName(response.data.name);
            }
        } catch (error: any) {
            console.error('Error loading organization:', error);
        }
    };

    const loadCollaborators = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getOrganizationCollaborators(orgId, token);

            if (response.success && response.data) {
                setCollaborators(response.data);
            }
        } catch (error: any) {
            console.error('Error loading collaborators:', error);
            alert(error.message || 'Failed to load collaborators');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCollaborator = async () => {
        if (!newCollaboratorEmail.trim()) {
            alert('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newCollaboratorEmail)) {
            alert('Invalid email format');
            return;
        }

        if (usageData && subscription) {
            const plan = subscription.plan;
            const currentCollaborators = usageData.collaborators || 0;
            const collabLimit = plan.collaboratorLimit;

            if (collabLimit !== 'unlimited' && currentCollaborators >= parseInt(collabLimit)) {
                alert(`Collaborator limit reached! You have ${currentCollaborators} of ${collabLimit} collaborators. Please upgrade your plan.`);
                router.push('/billing/plans');
                return;
            }

            if (collabLimit !== 'unlimited') {
                const percentage = (currentCollaborators / parseInt(collabLimit)) * 100;
                if (percentage >= 80) {
                    const confirmAdd = confirm(
                        `Warning: You've used ${currentCollaborators} of ${collabLimit} collaborators (${percentage.toFixed(0)}%). Continue?`
                    );
                    if (!confirmAdd) return;
                }
            }
        }

        try {
            setAdding(true);
            const token = getToken();
            if (!token) return;

            const response = await api.addOrganizationCollaborator({
                organizationId: orgId,
                email: newCollaboratorEmail.trim()
            }, token);

            if (response.success) {
                setShowAddModal(false);
                setNewCollaboratorEmail('');
                loadCollaborators();
                loadUsageData();
                alert('Collaborator invited successfully!');
            }
        } catch (error: any) {
            console.error('Error adding collaborator:', error);

            if (error.message?.includes('limit')) {
                alert(error.message);
                router.push('/billing/plans');
            } else {
                alert(error.message || 'Failed to add collaborator');
            }
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedMember || !newRole) return;

        try {
            setUpdatingRole(true);
            const token = getToken();
            if (!token) return;

            const response = await api.updateCollaboratorRole(selectedMember.id, newRole, token);

            if (response.success) {
                setShowRoleModal(false);
                setSelectedMember(null);
                setNewRole('');
                loadCollaborators();
                alert('Role updated successfully!');
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            alert(error.message || 'Failed to update role');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleRemoveCollaborator = async (memberId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove "${memberName}" from this organization?`)) {
            return;
        }

        try {
            setDeleting(memberId);
            const token = getToken();
            if (!token) return;

            const response = await api.removeCollaborator(memberId, orgId, token);

            if (response.success) {
                loadCollaborators();
                loadUsageData();
                alert('Collaborator removed successfully!');
            }
        } catch (error: any) {
            console.error('Error removing collaborator:', error);
            alert(error.message || 'Failed to remove collaborator');
        } finally {
            setDeleting(null);
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <CheckCircle size={18} className="text-green-500" />;
            case 'PENDING':
                return <Clock size={18} className="text-yellow-500" />;
            case 'INACTIVE':
                return <XCircle size={18} className="text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700';
            case 'PENDING':
                return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
            case 'INACTIVE':
                return darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'OWNER':
                return darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700';
            case 'COLLABORATOR':
                return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
        }
    };

    const filteredMembers = (collaborators[activeTab] || []).filter(member =>
        member.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                    {/* Divider & Info */}
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
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg transition-all duration-200"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Go back">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Pages / Organization Projects / {orgName} / Collaborators
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Collaborators
                                </h2>
                            </div>
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
                                            <CreditCard size={18} style={{ color: colors.info }} />
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
                    {/* Header */}
                    <div className="rounded-xl p-8 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex justify-between items-center">
                            <div>

                                <h2 className="text-3xl font-bold mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Collaborators
                                </h2>
                                <p style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{orgName}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-500">{collaborators.active.length}</p>
                                    <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Active</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-yellow-500">{collaborators.pending.length}</p>
                                    <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Pending</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-500">{collaborators.inactive.length}</p>
                                    <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Inactive</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collaborators Usage */}
                    {subscription && usageData && (
                        <UsageIndicator
                            label="Collaborators"
                            current={usageData.collaborators || 0}
                            limit={subscription.plan.collaboratorLimit}
                            darkMode={darkMode}
                            colors={colors}
                            className="mb-6"
                        />
                    )}

                    {/* Tabs */}
                    <div className="rounded-t-xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            borderBottom: 'none',
                        }}>
                        <div className="flex border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => setActiveTab('active')}
                                className="flex-1 px-6 py-4 font-medium transition-all duration-200"
                                style={{
                                    color: activeTab === 'active' ? '#10B981' : darkMode ? '#94A3B8' : '#64748B',
                                    borderBottom: activeTab === 'active' ? '2px solid #10B981' : 'none',
                                    backgroundColor: activeTab === 'active' ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5') : 'transparent',
                                }}
                                onMouseEnter={(e) => { if (activeTab !== 'active') e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F9FAFB'; }}
                                onMouseLeave={(e) => { if (activeTab !== 'active') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                Active ({collaborators.active.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className="flex-1 px-6 py-4 font-medium transition-all duration-200"
                                style={{
                                    color: activeTab === 'pending' ? '#F59E0B' : darkMode ? '#94A3B8' : '#64748B',
                                    borderBottom: activeTab === 'pending' ? '2px solid #F59E0B' : 'none',
                                    backgroundColor: activeTab === 'pending' ? (darkMode ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7') : 'transparent',
                                }}
                                onMouseEnter={(e) => { if (activeTab !== 'pending') e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F9FAFB'; }}
                                onMouseLeave={(e) => { if (activeTab !== 'pending') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                Pending ({collaborators.pending.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('inactive')}
                                className="flex-1 px-6 py-4 font-medium transition-all duration-200"
                                style={{
                                    color: activeTab === 'inactive' ? '#EF4444' : darkMode ? '#94A3B8' : '#64748B',
                                    borderBottom: activeTab === 'inactive' ? '2px solid #EF4444' : 'none',
                                    backgroundColor: activeTab === 'inactive' ? (darkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2') : 'transparent',
                                }}
                                onMouseEnter={(e) => { if (activeTab !== 'inactive') e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F9FAFB'; }}
                                onMouseLeave={(e) => { if (activeTab !== 'inactive') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                Inactive ({collaborators.inactive.length})
                            </button>
                        </div>
                    </div>

                    {/* Search & Add Button */}
                    <div className="p-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            borderTop: 'none',
                            borderBottom: 'none',
                        }}>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }} size={20} />
                                <input
                                    type="text"
                                    placeholder="Search collaborators by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-3 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 hover:opacity-90"
                                style={{
                                    backgroundColor: colors.warning,
                                    color: '#1E293B',
                                }}>
                                <Plus size={20} />
                                Add Collaborator
                            </button>
                        </div>
                    </div>

                    {/* Collaborators Table */}
                    <div className="rounded-b-xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB' }}>
                                    <th className="px-6 py-4 text-left text-sm font-semibold border-b-2 border-r"
                                        style={{
                                            color: darkMode ? '#E0E0E0' : '#1E293B',
                                            borderColor: colors.secondary,
                                        }}>
                                        Collaborator Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold border-b-2 border-r"
                                        style={{
                                            color: darkMode ? '#E0E0E0' : '#1E293B',
                                            borderColor: colors.secondary,
                                        }}>
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold border-b-2 border-r"
                                        style={{
                                            color: darkMode ? '#E0E0E0' : '#1E293B',
                                            borderColor: colors.secondary,
                                        }}>
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold border-b-2"
                                        style={{
                                            color: darkMode ? '#E0E0E0' : '#1E293B',
                                            borderColor: colors.secondary,
                                        }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            {searchQuery ? 'No collaborators found' : `No ${activeTab} collaborators`}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <tr key={member.id}
                                            className="transition-all duration-200"
                                            style={{
                                                borderBottom: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F9FAFB';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <div className="flex items-center gap-3">
                                                    <CollaboratorAvatar
                                                        userId={member.user.id}
                                                        fullName={member.user.fullName}
                                                        size="medium"
                                                    />
                                                    <div>
                                                        <p className="font-medium"
                                                            style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                            {member.user.fullName}
                                                        </p>
                                                        <p className="text-sm"
                                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                            {member.user.email}
                                                        </p>
                                                        {member.user.company && (
                                                            <p className="text-xs"
                                                                style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                                {member.user.company} • {member.user.job}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(member.status)}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                                                        {member.role}
                                                    </span>
                                                    {member.role !== 'OWNER' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMember(member);
                                                                setNewRole(member.role);
                                                                setShowRoleModal(true);
                                                            }}
                                                            className="text-xs font-medium transition-colors"
                                                            style={{ color: colors.primary }}>
                                                            Change
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {member.role !== 'OWNER' && (
                                                        <button
                                                            onClick={() => handleRemoveCollaborator(member.id, member.user.fullName)}
                                                            disabled={deleting === member.id}
                                                            className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                            style={{ color: colors.error }}
                                                            onMouseEnter={(e) => {
                                                                if (deleting !== member.id) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                            }}
                                                            title="Remove collaborator">
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Collaborator Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl w-full max-w-md"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Add Collaborator
                            </h3>
                            <button
                                onClick={() => { setShowAddModal(false); setNewCollaboratorEmail(''); }}
                                className="p-2 rounded-lg transition-all duration-200"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm mb-4"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Enter the email address of the user you want to invite as a collaborator. They will receive an invitation to join this organization.
                            </p>
                            <label className="block text-sm font-medium mb-2"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }} size={20} />
                                <input
                                    type="email"
                                    value={newCollaboratorEmail}
                                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddCollaborator()}
                                    placeholder="collaborator@example.com"
                                    className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => { setShowAddModal(false); setNewCollaboratorEmail(''); }}
                                className="flex-1 px-4 py-3 font-medium rounded-lg transition-all duration-200"
                                style={{
                                    border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                    color: darkMode ? '#94A3B8' : '#64748B',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCollaborator}
                                disabled={adding || !newCollaboratorEmail.trim()}
                                className="flex-1 px-4 py-3 font-medium rounded-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: colors.secondary }}>
                                {adding ? 'Inviting...' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Role Modal */}
            {showRoleModal && selectedMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl w-full max-w-md"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Change Role
                            </h3>
                            <button
                                onClick={() => { setShowRoleModal(false); setSelectedMember(null); setNewRole(''); }}
                                className="p-2 rounded-lg transition-all duration-200"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm mb-4"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Change the role for <span className="font-medium">{selectedMember.user.fullName}</span>
                            </p>
                            <label className="block text-sm font-medium mb-2"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Select Role
                            </label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                style={{
                                    backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                    border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                    color: darkMode ? '#E0E0E0' : '#1E293B',
                                }}>
                                <option value="COLLABORATOR">Collaborator</option>
                            </select>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => { setShowRoleModal(false); setSelectedMember(null); setNewRole(''); }}
                                className="flex-1 px-4 py-3 font-medium rounded-lg transition-all duration-200"
                                style={{
                                    border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                    color: darkMode ? '#94A3B8' : '#64748B',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRole}
                                disabled={updatingRole || !newRole}
                                className="flex-1 px-4 py-3 font-medium rounded-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: colors.info }}>
                                {updatingRole ? 'Updating...' : 'Update Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}