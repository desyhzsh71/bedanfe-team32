'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Copy, Edit2, Trash2, X, Sun, Moon, ChevronDown, LogOut, CreditCard,
    Settings, Globe, LayoutDashboard, Building2, FolderOpen, FileText, Layers, GitPullRequest,
    Image, Plug, Bell, Menu
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../../lib/auth';
import { api } from '../../lib/api';
import { useProject } from '../../lib/ProjectContext';
import Logo from '../../components/Logo';
import ProfilePhoto from '../../components/ProfilePhoto';

interface PersonalProject {
    id: string;
    name: string;
    description?: string;
    status: string;
    customDomain?: string;
    createdAt: string;
    updatedAt: string;
}

export default function PersonalProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params?.projectId as string;
    const { setActiveProject } = useProject();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<PersonalProject | null>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Personal Projects');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicating, setDuplicating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
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
            console.log('Init page with projectId:', projectId);

            if (!isAuthenticated()) {
                console.log('Not authenticated, redirecting to login');
                router.push('/login');
                return;
            }

            const userData = getUser();
            if (userData) {
                setUser(userData);
                if (projectId) {
                    console.log('Loading project:', projectId);
                    await loadProject();
                } else {
                    console.log('No projectId found in params');
                }
            } else {
                console.log('No user data, redirecting to login');
                router.push('/login');
            }
        };

        initPage();
    }, [projectId, router]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadProject = async () => {
        try {
            console.log('Loading project with ID:', projectId);
            setLoading(true);
            const token = getToken();
            if (!token) {
                console.log('No token found');
                router.push('/login');
                return;
            }

            console.log('Calling API with token...');
            const response = await api.getPersonalProjectById(projectId, token);
            console.log('API Response:', response);

            if (response.success && response.data) {
                console.log('Project loaded successfully:', response.data);
                setProject(response.data);
                setEditName(response.data.name);
                setEditStatus(response.data.status || 'ACTIVE');
                setCustomDomain(response.data.customDomain || '');
            } else {
                console.log('API response not successful:', response);
            }
        } catch (error: any) {
            console.error('Error loading project:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                stack: error.stack
            });
            alert(error.message || 'Failed to load project');
            router.push('/personal-projects');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProject = async () => {
        if (!editName.trim()) {
            alert('Project name is required');
            return;
        }

        try {
            setUpdating(true);
            const token = getToken();
            if (!token) return;

            const response = await api.updatePersonalProject(projectId, {
                name: editName.trim(),
                status: editStatus as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
                customDomain: customDomain.trim() || undefined
            }, token);

            if (response.success) {
                setShowEditModal(false);
                loadProject();
                alert('Project updated successfully!');
            }
        } catch (error: any) {
            console.error('Error updating project:', error);
            alert(error.message || 'Failed to update project');
        } finally {
            setUpdating(false);
        }
    };

    const handleDuplicateProject = async () => {
        try {
            setDuplicating(true);
            const token = getToken();
            if (!token) return;

            const response = await api.duplicatePersonalProject(projectId, token);

            if (response.success) {
                setShowDuplicateModal(false);
                alert('Project duplicated successfully!');
                router.push('/personal-projects');
            }
        } catch (error: any) {
            console.error('Error duplicating project:', error);
            alert(error.message || 'Failed to duplicate project');
        } finally {
            setDuplicating(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(true);
            const token = getToken();
            if (!token) return;

            const response = await api.deletePersonalProject(projectId, token);

            if (response.success) {
                alert('Project deleted successfully!');
                router.push('/personal-projects');
            }
        } catch (error: any) {
            console.error('Error deleting project:', error);
            alert(error.message || 'Failed to delete project');
        } finally {
            setDeleting(false);
        }
    };

    const handleEnterProject = () => {
        if (!project) return;

        setActiveProject({
            id: projectId,
            name: project.name,
            organizationName: 'Personal',
            description: project.description,
            status: project.status
        });

        router.push('/content-builder');
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || 'active';
        switch (statusLower) {
            case 'active':
            case 'progress':
                return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
            case 'completed':
                return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700';
            case 'draft':
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
            case 'archived':
                return darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colors.primary }}></div>
                    <p style={{ color: darkMode ? '#E0E0E0' : '#64748B' }}>Loading project...</p>
                    <p className="text-xs mt-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                        Project ID: {projectId}
                    </p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <div className="text-center">
                    <p className="mb-4" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                        Project not found
                    </p>
                    <button
                        onClick={() => router.push('/personal-projects')}
                        className="px-4 py-2 rounded-lg text-white transition-all duration-200 hover:opacity-90"
                        style={{ backgroundColor: colors.primary }}>
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const defaultDomain = `${project.name.toLowerCase().replace(/\s+/g, '-')}.cmsproject.com`;

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
                                    Pages / Personal Projects / {project.name}
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    {project.name}
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
                    {/* Project Header */}
                    <div className="rounded-xl p-8 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-2"
                                    style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    {project.name}
                                </h2>
                                <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Project ID: {project.id}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleEnterProject}
                                    className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90"
                                    style={{ backgroundColor: colors.primary }}>
                                    Enter Project
                                </button>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 flex items-center gap-2 hover:opacity-90"
                                    style={{ backgroundColor: colors.primary }}>
                                    <Edit2 size={18} />
                                    Edit Project
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Information Sections */}
                    <div className="grid gap-6">
                        {/* Basic Information - Teal */}
                        <div className="rounded-xl overflow-hidden transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                            }}>
                            <div className="px-6 py-4 font-semibold text-white"
                                style={{ backgroundColor: colors.secondary }}>
                                Information
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b transition-all duration-200"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F9FAFB';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <td className="px-6 py-4 font-medium w-1/3"
                                                style={{
                                                    color: darkMode ? '#94A3B8' : '#64748B',
                                                    backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB'
                                                }}>
                                                Project ID
                                            </td>
                                            <td className="px-6 py-4"
                                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {project.id}
                                            </td>
                                        </tr>
                                        <tr className="border-b transition-all duration-200"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F9FAFB';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <td className="px-6 py-4 font-medium"
                                                style={{
                                                    color: darkMode ? '#94A3B8' : '#64748B',
                                                    backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB'
                                                }}>
                                                Projects Name
                                            </td>
                                            <td className="px-6 py-4 flex justify-between items-center"
                                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {project.name}
                                                <button
                                                    onClick={() => setShowEditModal(true)}
                                                    className="font-medium text-sm transition-all duration-200"
                                                    style={{ color: colors.primary }}>
                                                    Change Name
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="transition-all duration-200"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F9FAFB';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <td className="px-6 py-4 font-medium"
                                                style={{
                                                    color: darkMode ? '#94A3B8' : '#64748B',
                                                    backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB'
                                                }}>
                                                Status Projects
                                            </td>
                                            <td className="px-6 py-4 flex justify-between items-center">
                                                <span className={`px-3 py-1 rounded-full font-medium text-sm ${getStatusColor(project.status)}`}>
                                                    {project.status || 'Active'}
                                                </span>
                                                <button
                                                    onClick={() => setShowEditModal(true)}
                                                    className="font-medium text-sm transition-all duration-200"
                                                    style={{ color: colors.primary }}>
                                                    Change Status
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Custom Domain Information - Yellow */}
                        <div className="rounded-xl overflow-hidden transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FEF3C7',
                                border: `4px solid ${darkMode ? colors.warning : '#FDE047'}`,
                                borderLeft: `4px solid ${colors.warning}`
                            }}>
                            <div className="px-6 py-4">
                                <p className="text-sm mb-4"
                                    style={{ color: darkMode ? '#94A3B8' : '#78716C' }}>
                                    By default, your site on CMS contains can be reached through a subdomain based on your project name. To make it more personalized, add your own custom domain
                                </p>
                                <div className="rounded-lg p-4 flex items-center justify-between"
                                    style={{ backgroundColor: darkMode ? '#1E1E2E' : '#FFFFFF' }}>
                                    <div className="flex items-center gap-3">
                                        <Globe size={20} style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                                        <span className="font-medium"
                                            style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                            {customDomain || defaultDomain}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(customDomain || defaultDomain)}
                                        className="p-2 transition-all duration-200 rounded-lg"
                                        style={{ color: colors.warning }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#FEF3C7';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                        title="Copy domain">
                                        {copied ? '✓' : <Copy size={18} />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="mt-3 w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                    style={{
                                        backgroundColor: colors.warning,
                                        color: '#1E293B'
                                    }}>
                                    Custom Domain
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone - Red */}
                        <div className="rounded-xl overflow-hidden transition-all duration-300"
                            style={{
                                backgroundColor: darkMode ? '#2D2D3F' : '#FEE2E2',
                                border: `4px solid ${darkMode ? colors.error : '#FCA5A5'}`,
                                borderLeft: `4px solid ${colors.error}`
                            }}>
                            <div className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold mb-1"
                                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                Duplicate Projects
                                            </h4>
                                            <p className="text-sm"
                                                style={{ color: darkMode ? '#94A3B8' : '#78716C' }}>
                                                You are about to duplicate this project. A new copy will be created with the same content and settings.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowDuplicateModal(true)}
                                            className="p-2 rounded-lg transition-all duration-200"
                                            style={{ color: colors.error }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title="Duplicate project">
                                            <Copy size={20} />
                                        </button>
                                    </div>

                                    <div className="border-t pt-4 flex items-start justify-between"
                                        style={{ borderColor: darkMode ? '#3F3F52' : '#FCA5A5' }}>
                                        <div>
                                            <h4 className="font-semibold mb-1"
                                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                Delete Projects
                                            </h4>
                                            <p className="text-sm"
                                                style={{ color: darkMode ? '#94A3B8' : '#78716C' }}>
                                                If you delete the project, it will be permanently deleted and you cannot recover it.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDeleteProject}
                                            disabled={deleting}
                                            className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                                            style={{ color: colors.error }}
                                            onMouseEnter={(e) => {
                                                if (!deleting) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title="Delete project">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl w-full max-w-md"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Edit Project
                            </h3>
                            <button
                                onClick={() => setShowEditModal(false)}
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
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    Status
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    Custom Domain (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    placeholder={defaultDomain}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                />
                                <p className="text-xs mt-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Default: {defaultDomain}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200"
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
                                onClick={handleUpdateProject}
                                disabled={updating || !editName.trim()}
                                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: colors.primary }}>
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Modal */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl w-full max-w-md"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center p-6 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-semibold"
                                style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Duplicate Project
                            </h3>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
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
                            <p className="mb-4" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Are you sure you want to duplicate "{project.name}"? A new project will be created with all the same content and settings.
                            </p>
                            <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                The duplicated project will appear in your project list with a similar name.
                            </p>
                        </div>
                        <div className="flex gap-3 p-6 border-t"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200"
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
                                onClick={handleDuplicateProject}
                                disabled={duplicating}
                                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: colors.error }}>
                                {duplicating ? 'Duplicating...' : 'Duplicate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}