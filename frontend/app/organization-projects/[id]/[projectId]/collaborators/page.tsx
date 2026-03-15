'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Search, Plus, Trash2, X, Sun, Moon, ChevronDown, LogOut, CreditCard,
    Settings, CheckCircle, Clock, XCircle, LayoutDashboard, Building2, FolderOpen,
    Bell, Menu, RefreshCw
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../../../../lib/auth';
import { api } from '../../../../lib/api';
import Logo from '../../../../components/Logo';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import CollaboratorAvatar from '@/app/components/CollaboratorAvatar';

interface ProjectCollaborator {
    id: string;
    userId: number;
    projectId: string;
    role: string;
    status: string;
    addedAt: string;
    user: {
        id: number;
        fullName: string;
        email: string;
        company?: string;
        job?: string;
    };
}

interface OrgMember {
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
}

interface CollaboratorsData {
    all: ProjectCollaborator[];
    active: ProjectCollaborator[];
    pending: ProjectCollaborator[];
    inactive: ProjectCollaborator[];
}

const ROLE_OPTIONS = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'REVIEWER', label: 'Reviewer' },
    { value: 'AUTHOR', label: 'Author' },
    { value: 'CONTRIBUTOR', label: 'Contributor' },
    { value: 'VIEWER', label: 'Viewer' }
];

export default function ProjectCollaboratorsPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params?.id as string;
    const projectId = params?.projectId as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [collaborators, setCollaborators] = useState<CollaboratorsData>({
        all: [],
        active: [],
        pending: [],
        inactive: []
    });
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [projectName, setProjectName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState('EDITOR');
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState('Organization Projects');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'inactive'>('active');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedCollaborator, setSelectedCollaborator] = useState<ProjectCollaborator | null>(null);
    const [newRole, setNewRole] = useState('');
    const [updatingRole, setUpdatingRole] = useState(false);
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
        { name: 'Notification', path: '/notifications', icon: Bell },
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
                if (orgId && projectId) {
                    await Promise.all([
                        loadOrganization(),
                        loadProject(),
                        loadCollaborators(),
                        loadOrgMembers()
                    ]);
                }
            } else {
                router.push('/login');
            }
        };

        initPage();
    }, [orgId, projectId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debug effect
    useEffect(() => {
        console.log('=== DATA UPDATE ===');
        console.log('Org Members:', orgMembers.length, orgMembers.map(m => ({ id: m.userId, name: m.user.fullName })));
        console.log('Collaborators:', collaborators.all.length, collaborators.all.map(c => ({ id: c.userId, name: c.user.fullName })));
    }, [orgMembers, collaborators]);

    // api
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

    const loadProject = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await api.getProjectById(projectId, token);
            if (response.success && response.data) {
                setProjectName(response.data.name);
            }
        } catch (error: any) {
            console.error('Error loading project:', error);
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

            const response = await api.getProjectCollaborators(projectId, token);
            console.log('Collaborators response:', response);
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

    const loadOrgMembers = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await api.getOrganizationCollaborators(orgId, token);
            console.log('Org members response:', response);
            if (response.success && response.data) {
                const activeMembers = response.data.active || [];
                console.log('Active org members:', activeMembers.length);
                setOrgMembers(activeMembers);
            }
        } catch (error: any) {
            console.error('Error loading org members:', error);
        }
    };

    const handleRefreshData = async () => {
        try {
            setRefreshing(true);
            await Promise.all([
                loadCollaborators(),
                loadOrgMembers()
            ]);
            alert('Data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            alert('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const handleAddCollaborator = async () => {
        if (!selectedUserId || !selectedRole) {
            alert('Please select a user and role');
            return;
        }

        try {
            setAdding(true);
            const token = getToken();
            if (!token) return;

            const response = await api.addProjectCollaborator({
                projectId,
                userId: selectedUserId,
                role: selectedRole
            }, token);

            if (response.success) {
                setShowAddModal(false);
                setSelectedUserId(null);
                setSelectedRole('EDITOR');
                await loadCollaborators();
                alert('Collaborator added successfully!');
            }
        } catch (error: any) {
            console.error('Error adding collaborator:', error);
            alert(error.message || 'Failed to add collaborator');
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedCollaborator || !newRole) return;

        try {
            setUpdatingRole(true);
            const token = getToken();
            if (!token) return;

            const response = await api.updateProjectCollaboratorRole(
                projectId,
                selectedCollaborator.id,
                newRole,
                token
            );

            if (response.success) {
                setShowRoleModal(false);
                setSelectedCollaborator(null);
                setNewRole('');
                await loadCollaborators();
                alert('Role updated successfully!');
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            alert(error.message || 'Failed to update role');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleRemoveCollaborator = async (collaboratorId: string, collaboratorName: string) => {
        if (!confirm(`Are you sure you want to remove "${collaboratorName}" from this project?`)) {
            return;
        }

        try {
            setDeleting(collaboratorId);
            const token = getToken();
            if (!token) return;

            const response = await api.removeProjectCollaborator(projectId, collaboratorId, token);

            if (response.success) {
                await loadCollaborators();
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

    // helpers
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
        const roleColors: Record<string, string> = {
            'OWNER': darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
            'ADMIN': darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700',
            'MANAGER': darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
            'EDITOR': darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
            'REVIEWER': darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
            'AUTHOR': darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700',
            'CONTRIBUTOR': darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
            'VIEWER': darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        };
        return roleColors[role] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
    };

    // FIXED: Calculate available members
    const availableMembers = useMemo(() => {
        const available = orgMembers.filter(member => {
            const isCollaborator = collaborators.all.some(collab =>
                Number(collab.userId) === Number(member.userId)
            );
            return !isCollaborator;
        });

        console.log('Available members:', available.length);
        return available;
    }, [orgMembers, collaborators.all]);

    const filteredCollaborators = (collaborators[activeTab] || []).filter(collab =>
        collab.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collab.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col">

                {/* TOP BAR */}
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
                                    Pages / Organization Projects / {orgName} / {projectName} / Collaborators
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

                {/* PAGE CONTENT */}
                <div className="flex-1 p-8 overflow-y-auto">

                    {/* Header Card - NEW DESIGN */}
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
                                <p style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{projectName}</p>
                            </div>
                            {/* Stats with colored numbers */}
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-green-500">{collaborators.active.length}</p>
                                    <p className="text-sm mt-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Active</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-yellow-500">{collaborators.pending.length}</p>
                                    <p className="text-sm mt-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Pending</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-red-500">{collaborators.inactive.length}</p>
                                    <p className="text-sm mt-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Inactive</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - NEW DESIGN */}
                    <div className="rounded-t-xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            borderBottom: 'none',
                        }}>
                        <div className="flex border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            {(['active', 'pending', 'inactive'] as const).map((tab) => {
                                const isActive = activeTab === tab;
                                const tabColor = tab === 'active' ? '#10B981' : tab === 'pending' ? '#F59E0B' : '#EF4444';
                                const tabBg = tab === 'active' ? '#ECFDF5' : tab === 'pending' ? '#FEF3C7' : '#FEE2E2';
                                const tabBgDark = tab === 'active'
                                    ? 'rgba(16,185,129,0.1)'
                                    : tab === 'pending'
                                        ? 'rgba(245,158,11,0.1)'
                                        : 'rgba(239,68,68,0.1)';
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className="flex-1 px-6 py-4 font-medium transition-all duration-200"
                                        style={{
                                            color: isActive ? tabColor : darkMode ? '#94A3B8' : '#64748B',
                                            borderBottom: isActive ? `2px solid ${tabColor}` : '2px solid transparent',
                                            backgroundColor: isActive ? (darkMode ? tabBgDark : tabBg) : 'transparent',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F9FAFB';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({collaborators[tab].length})
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search and Add Button - NEW DESIGN */}
                    <div className="p-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            borderTop: 'none',
                            borderBottom: 'none',
                        }}>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20}
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
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
                                onClick={() => {
                                    console.log('Add Collaborator clicked');
                                    console.log('Available members:', availableMembers.length);
                                    if (availableMembers.length === 0) {
                                        alert('All organization members are already collaborators. Please add more members to the organization first.');
                                        return;
                                    }
                                    setShowAddModal(true);
                                }}
                                disabled={availableMembers.length === 0}
                                className="px-6 py-3 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: availableMembers.length > 0 ? colors.warning : darkMode ? '#475569' : '#D1D5DB',
                                    color: '#1E293B',
                                }}
                                onMouseEnter={(e) => { if (availableMembers.length > 0) e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                <Plus size={20} />
                                Add Collaborator
                            </button>
                        </div>
                    </div>

                    {/* Collaborators Table - NEW DESIGN with borders */}
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
                                {filteredCollaborators.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            {searchQuery ? 'No collaborators found' : `No ${activeTab} collaborators`}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCollaborators.map((collab) => (
                                        <tr key={collab.id}
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
                                            {/* Name */}
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <div className="flex items-center gap-3">
                                                    <CollaboratorAvatar
                                                        userId={collab.userId}
                                                        fullName={collab.user.fullName}
                                                        size="medium"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-base"
                                                            style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                            {collab.user.fullName}
                                                        </p>
                                                        <p className="text-sm mt-0.5"
                                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                            {collab.user.email}
                                                        </p>
                                                        {collab.user.company && (
                                                            <p className="text-xs mt-0.5"
                                                                style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                                {collab.user.company} • {collab.user.job}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(collab.status)}
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(collab.status)}`}>
                                                        {collab.status}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Role */}
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(collab.role)}`}>
                                                        {collab.role}
                                                    </span>
                                                    {collab.role !== 'OWNER' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCollaborator(collab);
                                                                setNewRole(collab.role);
                                                                setShowRoleModal(true);
                                                            }}
                                                            className="text-xs font-medium transition-colors"
                                                            style={{ color: colors.primary }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                                            Change
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Action */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    {collab.role !== 'OWNER' && (
                                                        <button
                                                            onClick={() => handleRemoveCollaborator(collab.id, collab.user.fullName)}
                                                            disabled={deleting === collab.id}
                                                            className="p-2 rounded-lg transition disabled:opacity-50"
                                                            style={{ color: colors.error }}
                                                            onMouseEnter={(e) => {
                                                                if (deleting !== collab.id) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
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

            {/* ADD COLLABORATOR MODAL - keeping the same */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Add Collaborator
                            </h3>
                            <button
                                onClick={() => { setShowAddModal(false); setSelectedUserId(null); setSelectedRole('EDITOR'); }}
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
                        <div className="p-6 space-y-4">
                            <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Select an organization member to add as a collaborator to this project.
                            </p>
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Select User ({availableMembers.length} available)
                                </label>
                                <select
                                    value={selectedUserId || ''}
                                    onChange={(e) => {
                                        const userId = Number(e.target.value);
                                        console.log('Selected user ID:', userId);
                                        setSelectedUserId(userId);
                                    }}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    <option value="">Choose a member...</option>
                                    {availableMembers.map((member) => (
                                        <option key={member.userId} value={member.userId}>
                                            {member.user.fullName} ({member.user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Select Role
                                </label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    {ROLE_OPTIONS.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => { setShowAddModal(false); setSelectedUserId(null); setSelectedRole('EDITOR'); }}
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
                                onClick={handleAddCollaborator}
                                disabled={adding || !selectedUserId}
                                className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: colors.secondary }}
                                onMouseEnter={(e) => {
                                    if (!adding && selectedUserId) e.currentTarget.style.opacity = '0.9';
                                }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                {adding ? 'Adding...' : 'Add Collaborator'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANGE ROLE MODAL - keeping the same */}
            {showRoleModal && selectedCollaborator && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Change Role
                            </h3>
                            <button
                                onClick={() => { setShowRoleModal(false); setSelectedCollaborator(null); setNewRole(''); }}
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
                        <div className="p-6 space-y-4">
                            <p className="text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Change the role for <span className="font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{selectedCollaborator.user.fullName}</span>
                            </p>
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Select Role
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    <option value="">Select a role...</option>
                                    {ROLE_OPTIONS.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => { setShowRoleModal(false); setSelectedCollaborator(null); setNewRole(''); }}
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
                                onClick={handleUpdateRole}
                                disabled={updatingRole || !newRole || newRole === selectedCollaborator.role}
                                className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: colors.info }}
                                onMouseEnter={(e) => {
                                    if (!updatingRole && newRole && newRole !== selectedCollaborator.role) e.currentTarget.style.opacity = '0.9';
                                }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                                {updatingRole ? 'Updating...' : 'Update Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}