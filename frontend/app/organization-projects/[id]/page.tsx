'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Search, Plus, ArrowRight, X, Sun, Moon, ChevronDown, LogOut, CreditCard, Settings,
    ArrowLeft, Trash2, Play, Key, Users, LayoutDashboard, Bell, FolderOpen, Building2, Menu
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../../lib/auth';
import { api } from '../../lib/api';
import { useProject } from '../../lib/ProjectContext';
import Logo from '../../components/Logo';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import UsageIndicator from '@/app/components/UsageIndicator';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

export default function OrganizationProjectsPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params?.id as string;
    const { setActiveProject } = useProject();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState('Organization Projects');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [orgName, setOrgName] = useState('');
    const profileRef = useRef<HTMLDivElement>(null);

    const [usageData, setUsageData] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingUsage, setLoadingUsage] = useState(false);

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
            setLoadingUsage(true);
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
        } finally {
            setLoadingUsage(false);
        }
    };

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
                if (orgId) {
                    await Promise.all([loadOrganization(), loadProjects()]);
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
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getOrganizationById(orgId, token);
            if (response.success && response.data) {
                setOrgName(response.data.name);
            }
        } catch (error: any) {
            console.error('Error loading organization:', error);
        }
    };

    const loadProjects = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getProjectsByOrganization(orgId, token, {
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'asc'
            });

            if (response.success && response.data) {
                setProjects(response.data);
            }
        } catch (error: any) {
            console.error('Error loading projects:', error);
            alert(error.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            alert('Project name is required');
            return;
        }

        if (usageData && subscription) {
            const plan = subscription.plan;
            const currentProjects = usageData.projects || 0;
            const projectLimit = plan.projectLimit;

            if (projectLimit !== 'unlimited' && currentProjects >= parseInt(projectLimit)) {
                alert(`Project limit reached! You have used ${currentProjects} of ${projectLimit} projects. Please upgrade your plan to create more projects.`);
                router.push('/billing/plans');
                return;
            }

            if (projectLimit !== 'unlimited') {
                const percentage = (currentProjects / parseInt(projectLimit)) * 100;
                if (percentage >= 80) {
                    const confirmCreate = confirm(
                        `Warning: You've used ${currentProjects} of ${projectLimit} projects (${percentage.toFixed(0)}%). Do you want to continue creating a new project?`
                    );
                    if (!confirmCreate) return;
                }
            }
        }

        try {
            setCreating(true);
            const token = getToken();
            if (!token) return;

            const response = await api.createProject({
                name: newProjectName.trim(),
                description: newProjectDesc.trim(),
                organizationId: orgId,
            }, token);

            if (response.success) {
                setShowCreateModal(false);
                setNewProjectName('');
                setNewProjectDesc('');
                loadProjects();
                loadUsageData();
                alert('Project created successfully!');
            }
        } catch (error: any) {
            console.error('Error creating project:', error);
            if (error.message?.includes('limit reached') || error.message?.includes('limit')) {
                alert(error.message);
                router.push('/billing/plans');
            } else {
                alert(error.message || 'Failed to create project');
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteProject = async (projectId: string, projectName: string) => {
        if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeleting(projectId);
            const token = getToken();
            if (!token) return;

            const response = await api.deleteProject(projectId, token);

            if (response.success) {
                loadProjects();
                alert('Project deleted successfully!');
            }
        } catch (error: any) {
            console.error('Error deleting project:', error);
            alert(error.message || 'Failed to delete project');
        } finally {
            setDeleting(null);
        }
    };

    const handleEnterProject = (project: Project) => {
        setActiveProject({
            id: project.id,
            name: project.name,
            organizationId: project.organizationId,
            organizationName: orgName,
            description: project.description,
            status: project.status
        });
        router.push(`/organization-projects/${orgId}/${project.id}/content-builder`);
    };

    const handleViewProjectDetails = (projectId: string) => {
        router.push(`/organization-projects/${orgId}/${projectId}`);
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || 'active';
        switch (statusLower) {
            case 'active':
            case 'progress':
                return 'bg-yellow-100 text-yellow-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'draft':
                return 'bg-gray-100 text-gray-700';
            case 'archived':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

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
                                    Pages / Organization Projects / {orgName}
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    {orgName}
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
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-base font-medium mb-3"
                                    style={{ color: colors.secondary }}>
                                    Projects in {orgName}
                                </h3>
                                <p className="text-5xl font-bold mb-2"
                                    style={{ color: colors.secondary }}>
                                    {projects.length}
                                </p>

                                {/* USAGE INDICATOR */}
                                {subscription && usageData && (
                                    <UsageIndicator
                                        label="Projects"
                                        current={usageData.projects || 0}
                                        limit={subscription.plan.projectLimit}
                                        darkMode={darkMode}
                                        colors={colors}
                                        className="mt-4"
                                    />
                                )}


                                <p className="text-sm mt-2 font-mono"
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    ID: {orgId}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/organization-projects/${orgId}/collaborators`)}
                                        className="px-4 py-2.5 text-white font-medium rounded-lg transition flex items-center gap-2"
                                        style={{ backgroundColor: colors.accent }}
                                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                                        title="Manage Collaborators">
                                        <Users size={18} />
                                        Collaborators
                                    </button>
                                    <button
                                        onClick={() => router.push(`/organization-projects/${orgId}/settings`)}
                                        className="px-4 py-2.5 text-white font-medium rounded-lg transition flex items-center gap-2"
                                        style={{ backgroundColor: darkMode ? '#475569' : '#64748B' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                                        title="Organization Settings">
                                        <Settings size={18} />
                                        Settings
                                    </button>
                                </div>
                                <button
                                    onClick={() => router.push(`/organization-projects/${orgId}/api-tokens`)}
                                    className="w-full px-4 py-2.5 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                                    style={{ backgroundColor: colors.info }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                                    title="Manage API Tokens">
                                    <Key size={18} />
                                    API Tokens
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search & Create */}
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
                                    placeholder="Search your project....."
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
                            Create Project
                        </button>
                    </div>

                    {/* Projects Table */}
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
                                        Project Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Last Update
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center"
                                            style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            {searchQuery ? 'No projects found' : 'No projects yet. Create one to get started!'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <tr key={project.id}
                                            className="border-t transition-colors duration-200"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(63, 63, 82, 0.3)' : '#F9FAFB';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-base"
                                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                    {project.name}
                                                </p>
                                                {project.description && (
                                                    <p className="text-sm mt-1"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                        {project.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                    {project.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm"
                                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                {formatLastUpdate(project.updatedAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleEnterProject(project)}
                                                        className="px-3 py-2 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
                                                        style={{ backgroundColor: colors.info }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                                                        title="Enter project">
                                                        <Play size={16} />
                                                        Enter
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/organization-projects/${orgId}/${project.id}/collaborators`)}
                                                        className="p-2 rounded-lg transition"
                                                        style={{ color: darkMode ? '#A78BFA' : colors.accent }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(167, 139, 250, 0.1)' : 'rgba(83, 69, 129, 0.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Manage collaborators">
                                                        <Users size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProject(project.id, project.name)}
                                                        disabled={deleting === project.id}
                                                        className="p-2 rounded-lg transition disabled:opacity-50"
                                                        style={{ color: colors.error }}
                                                        onMouseEnter={(e) => {
                                                            if (deleting !== project.id) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Delete project">
                                                        <Trash2 size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewProjectDetails(project.id)}
                                                        className="p-2 rounded-lg transition"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="View details">
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

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-xl shadow-2xl w-full max-w-md transition-all duration-300"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Create New Project
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewProjectName('');
                                    setNewProjectDesc('');
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
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                                    placeholder="Enter project name"
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    placeholder="Enter project description"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewProjectName('');
                                    setNewProjectDesc('');
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
                                onClick={handleCreateProject}
                                disabled={creating || !newProjectName.trim()}
                                className="flex-1 px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: colors.secondary }}
                                onMouseEnter={(e) => {
                                    if (!creating && newProjectName.trim()) {
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