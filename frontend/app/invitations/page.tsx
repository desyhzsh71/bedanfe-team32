'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Check, X, Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, Mail,
    Clock, Users, FolderKanban, LayoutDashboard, Building2, FolderOpen, FileText, Layers,
    GitPullRequest, Image, Plug, Bell, Menu
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../lib/auth';
import { api } from '../lib/api';
import Logo from '../components/Logo';
import ProfilePhoto from '@/app/components/ProfilePhoto';

interface Invitation {
    id: string;
    userId: number;
    organizationId: string;
    role: string;
    status: string;
    joinedAt: string;
    organization: {
        id: string;
        name: string;
        createdAt: string;
        owner: {
            id: number;
            fullName: string;
            email: string;
        };
        _count: {
            members: number;
            projects: number;
        };
    };
}

export default function InvitationsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [responding, setResponding] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState('Notification');
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
                await loadInvitations();
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

    const loadInvitations = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getUserInvitations(token);

            if (response.success && response.data) {
                setInvitations(response.data);
            }
        } catch (error: any) {
            console.error('Error loading invitations:', error);
            alert(error.message || 'Failed to load invitations');
        } finally {
            setLoading(false);
        }
    };

    const handleRespondToInvitation = async (memberId: string, action: 'accept' | 'reject', orgName: string) => {
        const actionText = action === 'accept' ? 'accept' : 'reject';
        if (!confirm(`Are you sure you want to ${actionText} the invitation from "${orgName}"?`)) {
            return;
        }

        try {
            setResponding(memberId);
            const token = getToken();
            if (!token) return;

            const response = await api.respondToInvitation(memberId, action, token);

            if (response.success) {
                alert(`Invitation ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
                loadInvitations();
            }
        } catch (error: any) {
            console.error('Error responding to invitation:', error);
            alert(error.message || `Failed to ${actionText} invitation`);
        } finally {
            setResponding(null);
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const formatDate = (dateString: string) => {
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

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        return formatDate(dateString);
    };

    const getRoleColor = (role: string) => {
        const roleColors: Record<string, string> = {
            'OWNER': darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700',
            'ADMIN': darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700',
            'MANAGER': darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700',
            'EDITOR': darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-700',
            'REVIEWER': darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700',
            'AUTHOR': darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-700',
            'CONTRIBUTOR': darkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-700',
            'VIEWER': darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
        };
        return roleColors[role] || (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700');
    };

    // loading
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

    // render
    return (
        <div className="flex min-h-screen"
            style={{
                backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA',
                color: darkMode ? '#E0E0E0' : '#1E293B',
            }}>

            {/* SIDEBAR */}
            <div
                className="sticky top-0 h-screen overflow-y-auto transition-all duration-300"
                style={{
                    width: sidebarCollapsed ? '80px' : '260px',
                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    borderRight: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                }}>
                {/* Logo */}
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

                {/* Nav */}
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

                {/* Logout bottom */}
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

            {/* MAIN CONTENT */}
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
                                    Pages / Organization Invitations
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Invitations
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

                {/* PAGE CONTENT*/}
                <div className="flex-1 p-8 overflow-y-auto">

                    <div className="rounded-xl p-8 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-base font-medium mb-3"
                                    style={{ color: colors.accent }}>
                                    Organization Invitations
                                </h3>
                                <p className="text-5xl font-bold mb-2"
                                    style={{ color: colors.accent }}>
                                    {invitations.length}
                                </p>
                                <p className="text-sm mt-2"
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Manage your pending organization invitations
                                </p>
                            </div>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: darkMode ? 'rgba(83, 69, 129, 0.2)' : 'rgba(83, 69, 129, 0.1)' }}>
                                <Mail size={40} style={{ color: colors.accent }} />
                            </div>
                        </div>
                    </div>

                    {invitations.length === 0 ? (
                        <div className="rounded-xl p-12 text-center transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                <Mail size={48} style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                No Pending Invitations
                            </h3>
                            <p className="mb-6"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                You don't have any pending organization invitations at the moment.
                            </p>
                            <button
                                onClick={() => router.push('/organization-projects')}
                                className="px-6 py-3 text-white rounded-lg font-medium transition-all duration-200"
                                style={{ backgroundColor: colors.secondary }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                Go to Organizations
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invitations.map((invitation) => (
                                <div key={invitation.id}
                                    className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
                                    style={{
                                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                        border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                    }}>
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                        }}>
                                                        {invitation.organization.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold"
                                                            style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                            {invitation.organization.name}
                                                        </h3>
                                                        <p className="text-sm"
                                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                            Invited by <span className="font-medium">{invitation.organization.owner.fullName}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="flex items-center gap-2"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                        <Clock size={16} />
                                                        <span className="text-sm">{getTimeAgo(invitation.joinedAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                        <Users size={16} />
                                                        <span className="text-sm">{invitation.organization._count.members} members</span>
                                                    </div>
                                                    <div className="flex items-center gap-2"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                        <FolderKanban size={16} />
                                                        <span className="text-sm">{invitation.organization._count.projects} projects</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
                                                        {invitation.role}
                                                    </span>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                                        Pending
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleRespondToInvitation(invitation.id, 'accept', invitation.organization.name)}
                                                    disabled={responding === invitation.id}
                                                    className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                    style={{ backgroundColor: colors.success }}
                                                    onMouseEnter={(e) => {
                                                        if (responding !== invitation.id) e.currentTarget.style.opacity = '0.9';
                                                    }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                                    <Check size={18} />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRespondToInvitation(invitation.id, 'reject', invitation.organization.name)}
                                                    disabled={responding === invitation.id}
                                                    className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                    style={{ backgroundColor: colors.error }}
                                                    onMouseEnter={(e) => {
                                                        if (responding !== invitation.id) e.currentTarget.style.opacity = '0.9';
                                                    }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                                    <X size={18} />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-3 border-t"
                                        style={{
                                            backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                            borderColor: darkMode ? '#4A5568' : '#E2E8F0'
                                        }}>
                                        <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            Organization ID: <span className="font-mono" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{invitation.organization.id}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}