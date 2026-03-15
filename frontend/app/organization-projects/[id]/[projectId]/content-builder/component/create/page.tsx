'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft, PuzzleIcon,
} from 'lucide-react';
import { getToken } from '../../../../../../lib/auth';
import { api } from '../../../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../../../hooks/usagePageSetup';

interface SinglePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface MultiplePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface Component { id: string; name: string; apiId: string; fields?: any[] }

export default function CreateComponent() {
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

    const [name, setName] = useState('');
    const [apiId, setApiId] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

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

    const handleNameChange = (val: string) => {
        setName(val);
        setApiId(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    };

    const goBack = () => router.push(`/organization-projects/${orgId}/${projectId}/content-builder`);

    const handleSubmit = async () => {
        if (!name.trim()) { setError('Component name is required'); return; }
        try {
            setSubmitting(true); setError('');
            const token = getToken()!;
            const res = await api.createComponent(projectId, { name, apiId, description }, token);
            if (res.data?.id) {
                router.push(`/organization-projects/${orgId}/${projectId}/content-builder/component/${res.data.id}`);
            } else {
                goBack();
            }
        } catch (e: any) {
            setError(e.message || 'Failed to create component');
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: COLORS.primary }} />
        </div>
    );

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA', color: darkMode ? '#E0E0E0' : '#1E293B' }}>

            <MainSidebar darkMode={darkMode} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} onLogout={handleLogout} />
            <ProjectSidebar
                projectName="Project" projectId={projectId} orgId={orgId}
                darkMode={darkMode} currentPath={currentPath}
                singlePages={singlePages} multiplePages={multiplePages} components={components}
            />

            <div className="flex-1 flex flex-col">

                <div className="sticky top-0 z-40 border-b"
                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={goBack} className="p-2 rounded-lg transition-all" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Project / Content Builder / Create Component
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Create Component</h2>
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

                {/* form */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                    <div className="w-full max-w-lg">
                        <div className="rounded-2xl shadow-sm border"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>

                            <div className="flex items-center gap-3 px-7 pt-7 pb-5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#EFF6FF' }}>
                                    <PuzzleIcon size={20} style={{ color: COLORS.primary }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>New Component</h3>
                                    <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Fill in the details below to create your component</p>
                                </div>
                            </div>

                            <div className="flex px-7 gap-6 border-b" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                <span className="pb-3 text-sm font-medium border-b-2 -mb-px"
                                    style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
                                    Basic Configuration
                                </span>
                            </div>

                            <div className="px-7 py-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Component Name</label>
                                    <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Navbar"
                                        className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                                        onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>API ID</label>
                                    <input type="text" value={apiId} onChange={e => setApiId(e.target.value)} placeholder="auto-generated"
                                        className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                                        onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }} />
                                    <p className="mt-1.5 text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Generated automatically and used to generate API routes</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                        Description <span style={{ color: darkMode ? '#64748B' : '#94A3B8', fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        placeholder="Describe what this component is used for..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none resize-none"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                                        onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }} />
                                </div>
                                {error && <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>}

                                <div className="flex gap-3 mt-2">
                                    <button onClick={goBack} className="flex-1 py-3 rounded-xl text-sm font-medium transition"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                        Cancel
                                    </button>
                                    <button onClick={handleSubmit} disabled={submitting}
                                        className="flex-1 py-3 text-white font-medium rounded-xl transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: COLORS.primary }}
                                        onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.9'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                        {submitting ? 'Creating...' : 'Create Component'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}