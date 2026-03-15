'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Trash2, ArrowRight, X, Sun, Moon, ChevronDown, LogOut, CreditCard,
    Settings, Building2, Users, Mail, LayoutDashboard, GitPullRequest, Plug, Bell,
    FolderOpen, Image, FileText, Layers, Menu
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../lib/auth';
import { api } from '../lib/api';
import Logo from '../components/Logo';
import ProfilePhoto from '../components/ProfilePhoto';
import CollaboratorAvatar from '../components/CollaboratorAvatar';

interface Organization {
    id: string;
    name: string;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
    owner: {
        id: number;
        fullName: string;
        email: string;
    };
    members: Array<{
        id: string;
        userId: number;
        role: string;
        status: string;
        user: {
            id: number;
            fullName: string;
            email: string;
            company?: string;
            job?: string;
        };
    }>;
    projects: Array<{
        id: string;
        name: string;
        status: string;
    }>;
    userRole: string;
    isOwner: boolean;
    stats: {
        totalMembers: number;
        totalProjects: number;
        activeMembers: number;
        collaborators: number;
    };
}

export default function OrganizationProjectsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState('Organization Projects');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
                await loadOrganizations();
            } else {
                router.push('/login');
            }
        };

        initPage();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getOrganizations(token, {
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'asc'
            });

            if (response.success && response.data) {
                setOrganizations(response.data);
            }
        } catch (error: any) {
            console.error('Error loading organizations:', error);
            alert(error.message || 'Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrganization = async () => {
        if (!newOrgName.trim()) {
            alert('Organization name is required');
            return;
        }

        try {
            setCreating(true);
            const token = getToken();
            if (!token) return;

            const response = await api.createOrganization(newOrgName.trim(), token);

            if (response.success) {
                setShowCreateModal(false);
                setNewOrgName('');
                loadOrganizations();
                alert('Organization created successfully!');
            }
        } catch (error: any) {
            console.error('Error creating organization:', error);
            alert(error.message || 'Failed to create organization');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteOrganization = async (orgId: string, orgName: string) => {
        if (!confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeleting(orgId);
            const token = getToken();
            if (!token) return;

            const response = await api.deleteOrganization(orgId, token);

            if (response.success) {
                loadOrganizations();
                alert('Organization deleted successfully!');
            }
        } catch (error: any) {
            console.error('Error deleting organization:', error);
            alert(error.message || 'Failed to delete organization');
        } finally {
            setDeleting(null);
        }
    };

    const handleEnterOrganization = (orgId: string) => {
        router.push(`/organization-projects/${orgId}`);
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const filteredOrganizations = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatLastUpdate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
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
                                Pages / Organization Projects
                            </p>
                            <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Organization Projects
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
                                            onClick={() => { setShowProfileMenu(false); setActiveMenu('Plan and Billing'); router.push('/billing'); }}
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
                    {/* Header Card - Full Width */}
                    <div className="rounded-xl p-8 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-medium mb-3"
                                    style={{ color: colors.secondary }}>
                                    Total Organization Projects
                                </h3>
                                <p className="text-5xl font-bold mb-2"
                                    style={{ color: colors.secondary }}>
                                    {organizations.length}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-4">
                                <div className="w-24 h-24 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                    <Building2 size={48} style={{ color: colors.secondary, opacity: 0.8 }} />
                                </div>
                                <button
                                    onClick={() => router.push('/invitations')}
                                    className="px-6 py-2.5 text-white font-medium rounded-lg transition flex items-center gap-2"
                                    style={{ backgroundColor: colors.accent }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                    <Mail size={18} />
                                    Invitations
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Create Row */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 rounded-xl p-4 transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20}
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                                <input
                                    type="text"
                                    placeholder="Search your organization project....."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-2.5 rounded-lg focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        border: 'none',
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-4 text-gray-900 font-medium rounded-xl transition flex items-center gap-2"
                            style={{ backgroundColor: colors.warning }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                            <Plus size={20} />
                            Create Organization
                        </button>
                    </div>

                    {/* Organizations Table */}
                    <div className="rounded-xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                    borderBottom: `2px solid ${darkMode ? '#4A5568' : '#E2E8F0'}`
                                }}>
                                    <th className="px-6 py-4 text-left text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Nama Organizational
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Last Update
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Collaborator
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrganizations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center"
                                            style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            {searchQuery ? 'No organizations found' : 'No organizations yet. Create one to get started!'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrganizations.map((org) => (
                                        <tr key={org.id}
                                            className="border-t transition-colors duration-200"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(63, 63, 82, 0.3)' : '#F9FAFB';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                                        <Building2 size={24} style={{ color: darkMode ? '#94A3B8' : '#64748B' }} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-base"
                                                            style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                            {org.name}
                                                        </p>
                                                        {org.isOwner && (
                                                            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs rounded-md font-medium"
                                                                style={{
                                                                    backgroundColor: darkMode ? 'rgba(56, 192, 168, 0.15)' : 'rgba(56, 192, 168, 0.15)',
                                                                    color: colors.secondary,
                                                                }}>
                                                                Owner
                                                            </span>
                                                        )}
                                                        {!org.isOwner && org.userRole === 'COLLABORATOR' && (
                                                            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs rounded-md font-medium"
                                                                style={{
                                                                    backgroundColor: darkMode ? 'rgba(255, 201, 115, 0.15)' : 'rgba(255, 201, 115, 0.15)',
                                                                    color: colors.warning,
                                                                }}>
                                                                Collaborator
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm"
                                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                {formatLastUpdate(org.updatedAt)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {org.members.slice(0, 3).map((member) => (
                                                            <div
                                                                key={member.id}
                                                                className="border-2"
                                                                style={{
                                                                    borderColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                                                    borderRadius: '50%',
                                                                }}
                                                                title={member.user.fullName}>
                                                                <CollaboratorAvatar
                                                                    userId={member.userId}
                                                                    fullName={member.user.fullName}
                                                                    size="small"
                                                                    colorClass="bg-blue-400"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {org.stats.totalMembers > 3 && (
                                                        <span className="text-sm font-medium"
                                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                            +{org.stats.totalMembers - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    {org.isOwner && (
                                                        <button
                                                            onClick={() => router.push(`/organization-projects/${org.id}/settings`)}
                                                            className="p-2 rounded-lg transition"
                                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                            }}
                                                            title="Settings">
                                                            <Settings size={20} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => router.push(`/organization-projects/${org.id}/collaborators`)}
                                                        className="p-2 rounded-lg transition"
                                                        style={{ color: darkMode ? '#A78BFA' : colors.accent }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(167, 139, 250, 0.1)' : 'rgba(83, 69, 129, 0.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Collaborators">
                                                        <Users size={20} />
                                                    </button>

                                                    {org.isOwner && (
                                                        <button
                                                            onClick={() => handleDeleteOrganization(org.id, org.name)}
                                                            disabled={deleting === org.id}
                                                            className="p-2 rounded-lg transition disabled:opacity-50"
                                                            style={{ color: colors.error }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                            }}
                                                            title="Delete">
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleEnterOrganization(org.id)}
                                                        className="p-2 rounded-lg transition"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Enter">
                                                        <ArrowRight size={20} />
                                                    </button>
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

            {/* Create Organization Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-xl shadow-2xl w-full max-w-md transition-colors duration-300"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Create New Organization
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewOrgName('');
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
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateOrganization()}
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
                                    setShowCreateModal(false);
                                    setNewOrgName('');
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
                                onClick={handleCreateOrganization}
                                disabled={creating || !newOrgName.trim()}
                                className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: colors.secondary }}
                                onMouseEnter={(e) => {
                                    if (!creating && newOrgName.trim()) {
                                        e.currentTarget.style.opacity = '0.9';
                                    }
                                }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}