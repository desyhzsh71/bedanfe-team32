'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    LogOut, Building2, Users, Sun, Moon, CreditCard, Settings as SettingsIcon,
    ChevronDown, LayoutDashboard, Settings, FolderOpen, FileText,
    Bell, Menu, X, Activity, TrendingUp,
} from 'lucide-react';
import { getUser, logout, validateAuth } from '../lib/auth';
import Logo from '../components/Logo';
import ProfilePhoto from '../components/ProfilePhoto';
import CollaboratorAvatar from '../components/CollaboratorAvatar';
import api from '../lib/api';

interface Project {
    id: string;
    name: string;
    status: string;
    updatedAt: string;
    organizationId?: string;
}

interface Organization {
    id: string;
    name: string;
    members: any[];
    memberCount: number;
}

interface ContentStats {
    projectId: string;
    projectName: string;
    singlePages: number;
    multiplePages: number;
    total: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('Dashboard');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [stats, setStats] = useState([
        { id: 1, value: '0', label: 'Personal Project', color: '#3A7AC3' },
        { id: 2, value: '0', label: 'Organization Project', color: '#38C0A8' },
        { id: 3, value: '0', label: 'Total Organization', color: '#94A3B8' },
        { id: 4, value: '0', label: 'Collaborator', color: '#534581' },
    ]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [recentProjects, setRecentProjects] = useState<Project[]>([]);
    const [projectStatusStats, setProjectStatusStats] = useState({
        active: 0,
        completed: 0,
        archived: 0,
    });
    const [contentStats, setContentStats] = useState<ContentStats[]>([]);

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
        if (!validateAuth()) {
            router.push('/login');
            return;
        }
        const userData = getUser();
        if (userData) setUser(userData);
        setLoading(false);
    }, [router]);

    useEffect(() => {
        if (loading) return;
        const token = localStorage.getItem('token') || '';
        fetchDashboardData(token);
    }, [loading]);

    const fetchDashboardData = async (token: string) => {
        setStatsLoading(true);
        try {
            const [personalRes, orgsRes] = await Promise.all([
                api.getPersonalProjects(token),
                api.getOrganizations(token),
            ]);

            const personalProjects = personalRes?.data || [];
            const orgs = orgsRes?.data || [];
            const totalOrgs = orgs.length;

            let allOrgProjects: Project[] = [];
            let totalCollaborators = 0;
            let orgListWithMembers: Organization[] = [];
            let contentStatsData: ContentStats[] = [];

            if (totalOrgs > 0) {
                const orgProjectsPromises = orgs.map((org: any) =>
                    api.getProjectsByOrganization(org.id, token).catch(() => ({ data: [] }))
                );
                const orgCollaboratorsPromises = orgs.map((org: any) =>
                    api.getOrganizationCollaborators(org.id, token).catch(() => ({ data: { all: [] } }))
                );
                const [projectsResults, collaboratorsResults] = await Promise.all([
                    Promise.all(orgProjectsPromises),
                    Promise.all(orgCollaboratorsPromises),
                ]);

                projectsResults.forEach((res) => {
                    if (res?.data) allOrgProjects = [...allOrgProjects, ...res.data];
                });

                collaboratorsResults.forEach((res, index) => {
                    let membersList: any[] = [];
                    let count = 0;
                    if (res?.data?.all && Array.isArray(res.data.all)) {
                        membersList = res.data.all;
                        count = res.data.all.length;
                    } else if (Array.isArray(res?.data)) {
                        membersList = res.data;
                        count = res.data.length;
                    }
                    totalCollaborators += count;
                    orgListWithMembers.push({
                        id: orgs[index].id,
                        name: orgs[index].name,
                        members: membersList.slice(0, 4),
                        memberCount: count,
                    });
                });

                const contentPromises = allOrgProjects.slice(0, 6).map(async (project) => {
                    try {
                        const [singlePagesRes, multiplePagesRes] = await Promise.all([
                            api.getSinglePagesByProject(project.id, token).catch(() => ({ data: [] })),
                            api.getMultiplePagesByProject(project.id, token).catch(() => ({ data: [] })),
                        ]);
                        const singleCount = singlePagesRes?.data?.length || 0;
                        const multipleCount = multiplePagesRes?.data?.length || 0;
                        return {
                            projectId: project.id,
                            projectName: project.name,
                            singlePages: singleCount,
                            multiplePages: multipleCount,
                            total: singleCount + multipleCount,
                        };
                    } catch {
                        return { projectId: project.id, projectName: project.name, singlePages: 0, multiplePages: 0, total: 0 };
                    }
                });
                contentStatsData = await Promise.all(contentPromises);
            }

            const allProjects = [...personalProjects, ...allOrgProjects];
            const statusStats = {
                active: allProjects.filter(p => p.status === 'ACTIVE').length,
                completed: allProjects.filter(p => p.status === 'COMPLETED').length,
                archived: allProjects.filter(p => p.status === 'ARCHIVED').length,
            };
            const sortedProjects = [...allProjects]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5);

            setStats([
                { id: 1, value: String(personalProjects.length), label: 'Personal Project', color: '#3A7AC3' },
                { id: 2, value: String(allOrgProjects.length), label: 'Organization Project', color: '#38C0A8' },
                { id: 3, value: String(totalOrgs), label: 'Total Organization', color: '#94A3B8' },
                { id: 4, value: String(totalCollaborators), label: 'Collaborator', color: '#534581' },
            ]);

            setOrganizations(orgListWithMembers);
            setProjectStatusStats(statusStats);
            setRecentProjects(sortedProjects);
            setContentStats(contentStatsData);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setOrganizations([]);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const formatDate = (dateString: string) => {
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
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

    // DONUT CHART
    const totalProjects = projectStatusStats.active + projectStatusStats.completed + projectStatusStats.archived;
    const circumference = 2 * Math.PI * 38;
    const activeLen = totalProjects > 0 ? (projectStatusStats.active / totalProjects) * circumference : 0;
    const completedLen = totalProjects > 0 ? (projectStatusStats.completed / totalProjects) * circumference : 0;
    const archivedLen = totalProjects > 0 ? (projectStatusStats.archived / totalProjects) * circumference : 0;

    const bg = darkMode ? '#1E1E2E' : '#F5F7FA';
    const cardBg = darkMode ? '#2D2D3F' : '#FFFFFF';
    const border = darkMode ? '#3F3F52' : '#E2E8F0';
    const textMain = darkMode ? '#E0E0E0' : '#1E293B';
    const textSub = darkMode ? '#94A3B8' : '#64748B';
    const textMuted = darkMode ? '#64748B' : '#94A3B8';

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: bg, color: textMain }}>

            {/* SIDEBAR */}
            <div className="sticky top-0 h-screen overflow-y-auto transition-all duration-300"
                style={{ width: sidebarCollapsed ? '80px' : '260px', backgroundColor: cardBg, borderRight: `1px solid ${border}` }}>
                <div className="p-6 border-b sticky top-0 z-10"
                    style={{ borderColor: border, backgroundColor: cardBg }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo size="small" variant={darkMode ? "alt" : "main"} />
                            {!sidebarCollapsed && (
                                <h1 className="text-xl font-bold" style={{ color: textMain }}>CMS</h1>
                            )}
                        </div>
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg transition-all" style={{ color: textSub }}>
                            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    </div>
                </div>

                <nav className="p-4">
                    {menuItems.map((item) => {
                        const isActive = activeMenu === item.name;
                        const Icon = item.icon;
                        return (
                            <button key={item.name}
                                onClick={() => { setActiveMenu(item.name); router.push(item.path); }}
                                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-left transition-all duration-200"
                                style={{
                                    backgroundColor: isActive ? colors.primary : 'transparent',
                                    color: isActive ? '#FFFFFF' : textSub,
                                    fontWeight: isActive ? '600' : '400',
                                }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <Icon size={20} />
                                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
                            </button>
                        );
                    })}

                    {!sidebarCollapsed && (
                        <div className="mt-6 mb-4 px-4">
                            <div className="border-t pt-4" style={{ borderColor: border }}>
                                <p className="text-xs font-medium mb-2" style={{ color: textSub }}>PROJECT TOOLS</p>
                                <p className="text-xs" style={{ color: textMuted }}>
                                    Enter a project to access Content Builder, Workflow, and other tools
                                </p>
                            </div>
                        </div>
                    )}
                </nav>

                {!sidebarCollapsed && (
                    <div className="absolute bottom-0 w-full p-4 border-t"
                        style={{ borderColor: border, backgroundColor: cardBg }}>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200"
                            style={{ color: colors.error }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <LogOut size={20} />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                )}
            </div>

            {/* MAIN */}
            <div className="flex-1 flex flex-col">

                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b transition-colors duration-300"
                    style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs mb-1" style={{ color: textMuted }}>Pages / Dashboard</p>
                            <h2 className="text-2xl font-bold" style={{ color: textMain }}>Dashboard</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleDarkModeToggle}
                                className="p-2.5 rounded-lg transition-all duration-200"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <div className="relative" ref={profileRef}>
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: textMain }}>
                                    <ProfilePhoto size="small" primaryColor={colors.primary} />
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-xs" style={{ color: textMuted }}>Welcome back</span>
                                        <span className="font-semibold text-sm">{user?.fullName}</span>
                                    </div>
                                    <ChevronDown size={16} style={{ color: textMuted, transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50"
                                        style={{ backgroundColor: cardBg, borderColor: border }}>
                                        <button onClick={() => { setShowProfileMenu(false); setActiveMenu('Plan & Billing'); router.push('/billing'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                                            style={{ color: textSub }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <CreditCard size={18} style={{ color: colors.info }} />
                                            <span className="text-sm">Plan and Billing</span>
                                        </button>
                                        <button onClick={() => { setShowProfileMenu(false); setActiveMenu('Settings'); router.push('/settings'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                                            style={{ color: textSub }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <SettingsIcon size={18} />
                                            <span className="text-sm">Settings</span>
                                        </button>
                                        <div className="border-t mt-2 pt-2" style={{ borderColor: border }}>
                                            <button onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                                                style={{ color: colors.error }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
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

                {/* DASHBOARD CONTENT */}
                <div className="flex-1 p-8 overflow-y-auto">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        {stats.map((stat) => (
                            <div
                                key={stat.id}
                                className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                style={{
                                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                    border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                }}>
                                <div className="flex flex-col items-center justify-center text-center mb-3">
                                    <p className="text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        {stat.label}
                                    </p>
                                    {statsLoading ? (
                                        <div className="h-10 w-20 rounded animate-pulse"
                                            style={{ backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        </div>
                                    ) : (
                                        <h3 className="text-4xl font-bold"
                                            style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                            {stat.value}
                                        </h3>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CHARTS ROW */}
                    <div className="grid grid-cols-2 gap-6 mb-8">

                        {/* DONUT CHART: Project Status */}
                        <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                            <h3 className="text-base font-semibold mb-4 text-center" style={{ color: textMain }}>Project Status</h3>
                            <div className="flex flex-col items-center">
                                {/* SVG Donut — persentase active di tengah */}
                                <div className="relative" style={{ width: 200, height: 200 }}>
                                    <svg width="200" height="200" viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                                        {/* Track */}
                                        <circle cx="50" cy="50" r="38" fill="none"
                                            stroke={darkMode ? '#3F3F52' : '#E2E8F0'} strokeWidth="14" />
                                        {totalProjects > 0 ? (
                                            <>
                                                {/* Active: Green */}
                                                <circle cx="50" cy="50" r="38" fill="none"
                                                    stroke="#10B981" strokeWidth="14"
                                                    strokeDasharray={`${activeLen} ${circumference}`}
                                                    strokeDashoffset="0" />
                                                {/* Completed: Blue */}
                                                <circle cx="50" cy="50" r="38" fill="none"
                                                    stroke="#3A7AC3" strokeWidth="14"
                                                    strokeDasharray={`${completedLen} ${circumference}`}
                                                    strokeDashoffset={`-${activeLen}`} />
                                                {/* Archived: Gray */}
                                                <circle cx="50" cy="50" r="38" fill="none"
                                                    stroke="#6B7280" strokeWidth="14"
                                                    strokeDasharray={`${archivedLen} ${circumference}`}
                                                    strokeDashoffset={`-${activeLen + completedLen}`} />
                                            </>
                                        ) : null}
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold" style={{ color: '#10B981' }}>
                                            {totalProjects > 0 ? Math.round((projectStatusStats.active / totalProjects) * 100) : 0}%
                                        </span>
                                        <span className="text-xs mt-1" style={{ color: textMuted }}>Active</span>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-5 mt-4">
                                    {[
                                        { label: 'Active', color: '#10B981', pct: totalProjects > 0 ? Math.round((projectStatusStats.active / totalProjects) * 100) : 0 },
                                        { label: 'Completed', color: '#3A7AC3', pct: totalProjects > 0 ? Math.round((projectStatusStats.completed / totalProjects) * 100) : 0 },
                                        { label: 'Archived', color: '#6B7280', pct: totalProjects > 0 ? Math.round((projectStatusStats.archived / totalProjects) * 100) : 0 },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs" style={{ color: textSub }}>{item.label}</span>
                                            <span className="text-xs font-semibold" style={{ color: textSub }}>{item.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Projects Detail */}
                        <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                            <h3 className="text-base font-semibold mb-4 text-center" style={{ color: textMain }}>Projects Details</h3>

                            {contentStats.length > 0 ? (
                                (() => {
                                    const dataMax = Math.max(...contentStats.flatMap(d => [d.singlePages, d.multiplePages]), 1);
                                    const yMax = Math.ceil(dataMax * 1.25);
                                    const yStep = Math.max(1, Math.ceil(yMax / 4));
                                    const yLabels = Array.from({ length: 5 }, (_, i) => (4 - i) * yStep); // [yMax..0]

                                    const chartH = 180; // px tinggi area bar
                                    const chartW = 100; // viewBox width
                                    const barGroupW = chartW / contentStats.length;
                                    const barW = barGroupW * 0.3;
                                    const gap = barGroupW * 0.05;

                                    return (
                                        <>
                                            <div className="flex">
                                                <div className="flex flex-col justify-between pr-2 text-right" style={{ height: chartH }}>
                                                    {yLabels.map(v => (
                                                        <span key={v} className="text-xs leading-none" style={{ color: textMuted }}>{v}</span>
                                                    ))}
                                                </div>

                                                {/* SVG Chart */}
                                                <div className="flex-1">
                                                    <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                                                        {yLabels.map((v, i) => {
                                                            const y = (i / (yLabels.length - 1)) * chartH;
                                                            return (
                                                                <line key={v} x1="0" y1={y} x2={chartW} y2={y}
                                                                    stroke={border} strokeWidth="0.3" strokeDasharray="2,2" />
                                                            );
                                                        })}

                                                        {/* Bars */}
                                                        {contentStats.map((item, i) => {
                                                            const cx = barGroupW * i + barGroupW / 2;
                                                            const x1 = cx - barW - gap / 2;
                                                            const x2 = cx + gap / 2;

                                                            const topY = yLabels[0]; // nilai y tertinggi
                                                            const h1pct = item.singlePages / topY;
                                                            const h2pct = item.multiplePages / topY;
                                                            const barH1 = h1pct * chartH;
                                                            const barH2 = h2pct * chartH;

                                                            return (
                                                                <g key={i}>
                                                                    {/* Bar Single */}
                                                                    <rect x={x1} y={chartH - barH1} width={barW} height={barH1}
                                                                        fill="#534581" rx="1" />
                                                                    {/* Bar Multiple */}
                                                                    <rect x={x2} y={chartH - barH2} width={barW} height={barH2}
                                                                        fill="#38C0A8" rx="1" />
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>

                                                    <div className="flex mt-1">
                                                        {contentStats.map((item, i) => (
                                                            <div key={i} className="text-center px-0.5" style={{ flex: 1 }}>
                                                                <span className="text-xs leading-tight block" style={{ color: textMuted, wordBreak: 'break-word' }}>
                                                                    {item.projectName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center gap-6 mt-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#534581' }} />
                                                    <span className="text-xs" style={{ color: textSub }}>Single Pages</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#38C0A8' }} />
                                                    <span className="text-xs" style={{ color: textSub }}>Multiple Pages</span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()
                            ) : (
                                <div className="h-44 flex flex-col items-center justify-center">
                                    <FileText size={32} style={{ color: textMuted }} />
                                    <p className="text-sm mt-3" style={{ color: textSub }}>No content yet</p>
                                    <p className="text-xs mt-1" style={{ color: textMuted }}>Start creating pages in your projects</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recently Activity + List Project */}
                    <div className="grid grid-cols-2 gap-6">

                        {/* Recently Activity */}
                        <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} style={{ color: textSub }} />
                                    <h3 className="text-base font-semibold" style={{ color: textMain }}>Recently Activity</h3>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {statsLoading ? (
                                    [1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center gap-3 pb-3 border-b"
                                            style={{ borderColor: border }}>
                                            <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: border }} />
                                            <div className="flex-1">
                                                <div className="h-3 w-3/4 rounded animate-pulse mb-1.5" style={{ backgroundColor: border }} />
                                                <div className="h-2.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: border }} />
                                            </div>
                                        </div>
                                    ))
                                ) : recentProjects.length > 0 ? (
                                    recentProjects.map((project) => (
                                        <div key={project.id} className="flex items-center gap-3 pb-3 border-b last:border-0"
                                            style={{ borderColor: border }}>
                                            {/* Status dot */}
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{
                                                backgroundColor: project.status === 'ACTIVE' ? '#10B981'
                                                    : project.status === 'COMPLETED' ? colors.primary : '#6B7280'
                                            }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate" style={{ color: textMain }}>
                                                    {project.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700'
                                                            : project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {project.status}
                                                    </span>
                                                    <span className="text-xs" style={{ color: textMuted }}>
                                                        {formatDate(project.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Activity size={28} style={{ color: textMuted }} />
                                        <p className="text-sm mt-2" style={{ color: textSub }}>No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* List Project (Organizations) */}
                        <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Users size={16} style={{ color: textSub }} />
                                    <h3 className="text-base font-semibold" style={{ color: textMain }}>List Project</h3>
                                </div>
                                <button className="text-xs font-medium hover:underline"
                                    style={{ color: colors.primary }}
                                    onClick={() => router.push('/organization-projects')}>
                                    Manage
                                </button>
                            </div>

                            <div className="space-y-3">
                                {statsLoading ? (
                                    [1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center justify-between pb-3 border-b"
                                            style={{ borderColor: border }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg animate-pulse" style={{ backgroundColor: border }} />
                                                <div className="h-3 w-28 rounded animate-pulse" style={{ backgroundColor: border }} />
                                            </div>
                                            <div className="h-5 w-12 rounded-full animate-pulse" style={{ backgroundColor: border }} />
                                        </div>
                                    ))
                                ) : organizations.length > 0 ? (
                                    organizations.map((org) => (
                                        <div key={org.id} className="flex items-center justify-between pb-3 border-b last:border-0"
                                            style={{ borderColor: border }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#EFF6FF' }}>
                                                    <Building2 size={16} style={{ color: colors.primary }} />
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: textMain }}>
                                                    {org.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {org.members && org.members.length > 0 ? (
                                                    <div className="flex -space-x-2">
                                                        {org.members.slice(0, 3).map((member: any, idx: number) => (
                                                            <CollaboratorAvatar
                                                                key={idx}
                                                                userId={member.userId || member.id}
                                                                fullName={member.user?.fullName || member.fullName || 'User'}
                                                                size="small"
                                                            />
                                                        ))}
                                                        {org.memberCount > 3 && (
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2"
                                                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: colors.primary, borderColor: cardBg }}>
                                                                +{org.memberCount - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#EFF6FF', color: colors.primary }}>
                                                        <Users size={12} />
                                                        <span className="text-xs font-semibold">{org.memberCount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Building2 size={28} style={{ color: textMuted }} />
                                        <p className="text-sm mt-2" style={{ color: textSub }}>No organizations yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}