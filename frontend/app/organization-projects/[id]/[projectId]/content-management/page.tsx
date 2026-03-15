'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft, Plus,
} from 'lucide-react';
import { getToken } from '../../../../lib/auth';
import { api } from '../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../hooks/usagePageSetup';

/* ── types ── */
interface SinglePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface MultiplePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface Component { id: string; name: string; apiId: string; fields?: any[] }

export default function ContentManagementPage() {
    const params = useParams();
    const orgId = params?.id as string;
    const projectId = params?.projectId as string;

    const {
        router, user, loading,
        darkMode, handleDarkModeToggle,
        showProfileMenu, setShowProfileMenu,
        sidebarCollapsed, setSidebarCollapsed,
        profileRef, initAuth, handleLogout,
    } = usePageSetup();

    const [singlePages, setSinglePages] = useState<SinglePage[]>([]);
    const [multiplePages, setMultiplePages] = useState<MultiplePage[]>([]);
    const [components, setComponents] = useState<Component[]>([]);

    /* ── load data ── */
    const loadData = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [spRes, mpRes, compRes] = await Promise.allSettled([
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [projectId, router]);

    useEffect(() => { initAuth(async () => { await loadData(); }); }, [orgId, projectId]);

    const navSingle = (id: string) => router.push(`/organization-projects/${orgId}/${projectId}/content-management/single-page/${id}`);
    const navMultiple = (id: string) => router.push(`/organization-projects/${orgId}/${projectId}/content-management/multiple-page/${id}`);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: COLORS.primary }} />
        </div>
    );

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA', color: darkMode ? '#E0E0E0' : '#1E293B' }}>

            {/* ── sidebars ── */}
            <MainSidebar darkMode={darkMode} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} onLogout={handleLogout} />
            <ProjectSidebar
                projectName="Project" projectId={projectId} orgId={orgId}
                darkMode={darkMode} currentPath={currentPath}
                singlePages={singlePages} multiplePages={multiplePages} components={components}
            />

            {/* ── main ── */}
            <div className="flex-1 flex flex-col">

                {/* top bar */}
                <div className="sticky top-0 z-40 border-b"
                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()}
                                className="p-2 rounded-lg transition-all" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Project / Content Management</p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Content Management</h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={handleDarkModeToggle} className="p-2.5 rounded-lg"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <div className="relative" ref={profileRef}>
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    <ProfilePhoto size="small" primaryColor={COLORS.primary} />
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Welcome back</span>
                                        <span className="font-semibold text-sm">{user?.fullName}</span>
                                    </div>
                                    <ChevronDown size={16} style={{ color: darkMode ? '#64748B' : '#94A3B8', transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50"
                                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        {[
                                            { label: 'Plan and Billing', path: '/billing', icon: <CreditCard size={18} style={{ color: COLORS.info }} /> },
                                            { label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
                                        ].map(item => (
                                            <button key={item.path} onClick={() => { setShowProfileMenu(false); router.push(item.path); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                {item.icon}<span className="text-sm">{item.label}</span>
                                            </button>
                                        ))}
                                        <div className="border-t mt-2 pt-2" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            <button onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left" style={{ color: COLORS.error }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                <LogOut size={18} /><span className="text-sm font-medium">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* welcome panel */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-2xl w-full">
                        <div className="rounded-2xl p-10"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}` }}>

                            <h2 className="text-3xl font-bold mb-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Content Management</h2>
                            <p className="text-lg mb-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Manage your content entries.</p>
                            <p className="text-sm mb-6" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Select a page below to start managing its content. You can fill in fields, manage entries, and configure SEO settings for each page in your project.
                            </p>

                            {/* single pages section */}
                            {singlePages.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Single Page
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {singlePages.map(p => (
                                            <button key={p.id} onClick={() => navSingle(p.id)}
                                                className="p-4 rounded-xl border-2 text-left transition-all"
                                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }}>
                                                <div className="text-2xl mb-2">📄</div>
                                                <p className="font-semibold text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{p.name}</p>
                                                <p className="text-xs mt-0.5" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Single Page</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* multiple pages section */}
                            {multiplePages.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Multiple Page
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {multiplePages.map(p => (
                                            <button key={p.id} onClick={() => navMultiple(p.id)}
                                                className="p-4 rounded-xl border-2 text-left transition-all"
                                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }}>
                                                <div className="text-2xl mb-2">📋</div>
                                                <p className="font-semibold text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{p.name}</p>
                                                <p className="text-xs mt-0.5" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Multiple Page</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* empty state */}
                            {singlePages.length === 0 && multiplePages.length === 0 && (
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-3">📝</div>
                                    <p className="text-sm font-medium mb-1" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>No pages yet</p>
                                    <p className="text-sm mb-5" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                        Create pages in the Content Builder first, then come back to manage their content.
                                    </p>
                                    <button
                                        onClick={() => router.push(`/organization-projects/${orgId}/${projectId}/content-builder`)}
                                        className="px-5 py-2.5 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 mx-auto"
                                        style={{ backgroundColor: COLORS.primary }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                        <Plus size={16} /> Go to Content Builder
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}