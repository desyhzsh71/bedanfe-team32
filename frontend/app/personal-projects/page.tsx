'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Trash2, ArrowRight, X, Sun, Moon, ChevronDown, LogOut, CreditCard, 
    Settings, LayoutDashboard, Building2, FolderOpen, FileText, Layers, Bell,
    Menu
} from 'lucide-react';
import { getUser, getToken, isAuthenticated, logout } from '../lib/auth';
import { api } from '../lib/api';
import { useProject } from '../lib/ProjectContext';
import Logo from '../components/Logo';
import ProfilePhoto from '../components/ProfilePhoto';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function PersonalProjectsPage() {
    const router = useRouter();
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
    const [activeMenu, setActiveMenu] = useState('Personal Projects');
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
                await loadProjects();
            } else {
                router.push('/login');
            }
        };

        initPage();
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

    const loadProjects = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await api.getPersonalProjects(token, {
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'asc'
            });

            console.log('Personal projects API response:', response);

            let projectsData: Project[] = [];

            if (response.data) {
                if (Array.isArray(response.data)) {
                    projectsData = response.data;
                } else if (response.data.projects && Array.isArray(response.data.projects)) {
                    projectsData = response.data.projects;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    projectsData = response.data.data;
                }
            }

            setProjects(projectsData);
        } catch (error: any) {
            console.error('Error loading projects:', error);
            if (projects.length === 0) {
                setProjects([]);
            } else {
                alert(error.message || 'Failed to load projects');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            alert('Project name is required');
            return;
        }

        try {
            setCreating(true);
            const token = getToken();
            if (!token) return;

            const response = await api.createPersonalProject({
                name: newProjectName.trim(),
                description: newProjectDesc.trim() || undefined,
            }, token);

            if (response.success || response.data) {
                setShowCreateModal(false);
                setNewProjectName('');
                setNewProjectDesc('');
                await loadProjects();
                alert('Project created successfully!');
            } else {
                alert(response.message || 'Failed to create project');
            }
        } catch (error: any) {
            console.error('Error creating project:', error);
            alert(error.message || 'Failed to create project');
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

            const response = await api.deletePersonalProject(projectId, token);

            if (response.success || response.data) {
                await loadProjects();
                alert('Project deleted successfully!');
            } else {
                alert(response.message || 'Failed to delete project');
            }
        } catch (error: any) {
            console.error('Error deleting project:', error);
            alert(error.message || 'Failed to delete project');
        } finally {
            setDeleting(null);
        }
    };

    const handleEnterProject = (project: Project) => {
        router.push(`/personal-projects/${project.id}`);
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
                        <div>
                            <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Pages / Personal Projects
                            </p>
                            <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Personal Projects
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
                    {/* Header with Total Count */}
                    <div className="rounded-xl p-8 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-semibold mb-2"
                                    style={{ color: colors.secondary }}>
                                    Total Personal Projects
                                </h2>
                                <p className="text-5xl font-bold"
                                    style={{ color: colors.secondary }}>
                                    {projects.length}
                                </p>
                            </div>
                            <div className="w-32 h-32 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F0FDF4' }}>
                                <svg className="w-24 h-24" style={{ color: colors.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Search and Create Button */}
                    <div className="rounded-xl p-6 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }} size={20} />
                                <input
                                    type="text"
                                    placeholder="Search your personal project ....."
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
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:opacity-90"
                                style={{
                                    backgroundColor: colors.warning,
                                    color: '#1E293B',
                                }}>
                                <Plus size={20} />
                                Create Project
                            </button>
                        </div>
                    </div>

                    {/* Projects Table */}
                    <div className="rounded-xl overflow-hidden transition-all duration-300"
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
                                            borderColor: colors.secondary
                                        }}>
                                        Project Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold border-b-2 border-r"
                                        style={{
                                            color: darkMode ? '#E0E0E0' : '#1E293B',
                                            borderColor: colors.secondary
                                        }}>
                                        Last Update
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold border-b-2"
                                        style={{
                                            color: darkMode ? '#E0E0E0' : '#1E293B',
                                            borderColor: colors.secondary
                                        }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            {searchQuery ? 'No projects found' : 'No projects yet. Create one to get started!'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <tr key={project.id}
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
                                                <p className="font-medium"
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
                                            <td className="px-6 py-4 border-r"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                <span className="text-sm"
                                                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                    {formatLastUpdate(project.updatedAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleDeleteProject(project.id, project.name)}
                                                        disabled={deleting === project.id}
                                                        className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                        style={{ color: colors.error }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Delete project">
                                                        <Trash2 size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEnterProject(project)}
                                                        className="p-2 rounded-lg transition-all duration-200"
                                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Enter project">
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
                    <div className="rounded-2xl shadow-2xl w-full max-w-md"
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
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                                    placeholder="Enter project name"
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2"
                                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    placeholder="Enter project description"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                        border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
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
                                onClick={handleCreateProject}
                                disabled={creating || !newProjectName.trim()}
                                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: colors.secondary }}>
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}