'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    X,
    Sun,
    Moon,
    ChevronDown,
    LogOut,
    CreditCard,
    Settings,
    Trash2,
    Edit2,
    Building2,
    LayoutDashboard,
    FolderOpen,
    Image,
    GitPullRequest,
    Plug,
    Bell,
    FileText,
    Layers,
    Menu
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../../../lib/auth';
import { api } from '../../../lib/api';
import Logo from '../../../components/Logo';
import ProfilePhoto from '@/app/components/ProfilePhoto';

interface Organization {
    id: string;
    name: string;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
}

export default function OrganizationSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params?.id as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [activeMenu, setActiveMenu] = useState('Organization Projects');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

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

    // Dark mode
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        applyDarkMode(savedDarkMode);
    }, []);

    const applyDarkMode = (isDark: boolean) => {
        isDark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
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
            setLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getOrganizationById(orgId, token);

            if (response.success && response.data) {
                setOrganization(response.data);
                setNewOrgName(response.data.name);
            }
        } catch (error: any) {
            console.error('Error loading organization:', error);
            alert(error.message || 'Failed to load organization');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrganization = async () => {
        if (!newOrgName.trim()) {
            alert('Organization name is required');
            return;
        }

        try {
            setUpdating(true);
            const token = getToken();
            if (!token) return;

            const response = await api.updateOrganization(orgId, newOrgName.trim(), token);

            if (response.success) {
                setShowEditModal(false);
                loadOrganization();
                alert('Organization updated successfully!');
            }
        } catch (error: any) {
            console.error('Error updating organization:', error);
            alert(error.message || 'Failed to update organization');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteOrganization = async () => {
        if (!organization) return;

        if (!confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone and will delete all projects and data associated with this organization.`)) {
            return;
        }

        const confirmText = prompt(`Please type "${organization.name}" to confirm deletion:`);
        if (confirmText !== organization.name) {
            alert('Organization name does not match. Deletion cancelled.');
            return;
        }

        try {
            setDeleting(true);
            const token = getToken();
            if (!token) return;

            const response = await api.deleteOrganization(orgId, token);

            if (response.success) {
                alert('Organization deleted successfully!');
                router.push('/organization-projects');
            }
        } catch (error: any) {
            console.error('Error deleting organization:', error);
            alert(error.message || 'Failed to delete organization');
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
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

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <p style={{ color: darkMode ? '#E0E0E0' : '#64748B' }}>Organization not found</p>
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
                                    Pages / Organization Projects / Settings
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Organization Settings
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
                                            <Settings size={18} />
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
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`
                                }}>
                                <Building2 size={32} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-1"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Settings
                                </h2>
                                <p style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    {organization.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Information Section */}
                    <div className="rounded-xl overflow-hidden mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="px-6 py-4 font-semibold"
                            style={{
                                backgroundColor: colors.secondary,
                                color: '#FFFFFF'
                            }}>
                            Information
                        </div>
                        <table className="w-full">
                            <tbody>
                                <tr className="border-b transition-colors duration-200"
                                    style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                    <td className="px-6 py-4 font-medium w-1/3"
                                        style={{
                                            color: darkMode ? '#94A3B8' : '#64748B',
                                            backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9'
                                        }}>
                                        Organization ID
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm"
                                        style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                        {organization.id}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-medium"
                                        style={{
                                            color: darkMode ? '#94A3B8' : '#64748B',
                                            backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9'
                                        }}>
                                        Organization Name
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium"
                                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {organization.name}
                                            </span>
                                            <button
                                                onClick={() => setShowEditModal(true)}
                                                className="font-medium text-sm flex items-center gap-2 transition-opacity"
                                                style={{ color: colors.primary }}
                                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                                <Edit2 size={16} />
                                                Change Name
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Danger Zone */}
                    <div className="rounded-xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEF2F2',
                            border: `1px solid ${darkMode ? 'rgba(249, 50, 50, 0.3)' : '#FEE2E2'}`,
                            borderLeft: `4px solid ${colors.error}`
                        }}>
                        <div className="px-6 py-4 font-semibold"
                            style={{
                                backgroundColor: colors.error,
                                color: '#FFFFFF'
                            }}>
                            Danger Zone
                        </div>
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-1"
                                        style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                        Delete Organization
                                    </h4>
                                    <p className="text-sm mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        If you delete the organization, it will be permanently deleted and you cannot recover it.
                                    </p>
                                    <p className="text-sm font-medium"
                                        style={{ color: colors.error }}>
                                        ⚠️ This will also delete all projects, collaborators, and data associated with this organization.
                                    </p>
                                </div>
                                <button
                                    onClick={handleDeleteOrganization}
                                    disabled={deleting}
                                    className="px-6 py-3 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    style={{ backgroundColor: colors.error }}
                                    onMouseEnter={(e) => {
                                        if (!deleting) e.currentTarget.style.opacity = '0.9';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                    }}>
                                    <Trash2 size={18} />
                                    {deleting ? 'Deleting...' : 'Delete Organization'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Organization Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-xl shadow-2xl w-full max-w-md"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Edit Organization Name
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setNewOrgName(organization.name);
                                }}
                                className="p-2 rounded-lg transition"
                                style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                    color: darkMode ? '#E0E0E0' : '#1E293B',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium mb-2"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Organization Name
                            </label>
                            <input
                                type="text"
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdateOrganization()}
                                placeholder="Enter organization name"
                                className="w-full px-4 py-3 rounded-lg focus:outline-none transition"
                                style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                    border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                    color: darkMode ? '#E0E0E0' : '#1E293B',
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setNewOrgName(organization.name);
                                }}
                                className="flex-1 px-4 py-3 font-medium rounded-lg transition"
                                style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                    color: darkMode ? '#E0E0E0' : '#64748B',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateOrganization}
                                disabled={updating || !newOrgName.trim() || newOrgName === organization.name}
                                className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: colors.primary }}
                                onMouseEnter={(e) => {
                                    if (!updating && newOrgName.trim() && newOrgName !== organization.name) {
                                        e.currentTarget.style.opacity = '0.9';
                                    }
                                }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}