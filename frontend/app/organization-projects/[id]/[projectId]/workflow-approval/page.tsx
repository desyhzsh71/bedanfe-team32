'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
    Plus, Trash2, Pencil, ExternalLink, ChevronUp,
} from 'lucide-react';
import { getToken } from '../../../../lib/auth';
import { api } from '../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../hooks/usagePageSetup';

interface SinglePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface MultiplePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface Component { id: string; name: string; apiId: string; fields?: any[] }

const ROLES = ['Super Admin', 'Editor', 'Author', 'SEO Manager', 'Viewer'];
const HIGHLIGHT_COLORS = [
    { label: 'Soft Pink', value: '#FFB3C6' },
    { label: 'Peach Orange', value: '#FFCBA4' },
    { label: 'Sky Blue', value: '#93C5FD' },
    { label: 'Mint Green', value: '#6EE7B7' },
    { label: 'Lavender', value: '#C4B5FD' },
    { label: 'Sunflower', value: '#FDE047' },
];

interface Stage {
    id?: string; name: string;
    rolesAllowed: string[]; highlightColor: string; order: number;
}

export default function WorkflowApprovalPage() {
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
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({ 0: true });

    const [form, setForm] = useState({
        name: '', relatedTo: 'Content Management', keyApprovalStage: 'Any Stage',
        stages: [{ name: 'To Do', rolesAllowed: ['Super Admin', 'Editor', 'Author', 'SEO Manager'], highlightColor: '#FFB3C6', order: 1 }] as Stage[],
        submitting: false, error: '',
    });

    const loadAll = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [wfRes, spRes, mpRes, compRes] = await Promise.allSettled([
                api.getAllWorkflows(orgId, token),
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (wfRes.status === 'fulfilled') setWorkflows(Array.isArray(wfRes.value.data) ? wfRes.value.data : []);
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [orgId, projectId, router]);

    useEffect(() => { initAuth(async () => { await loadAll(); }); }, [orgId, projectId]);

    const addStage = () => {
        const newIndex = form.stages.length;
        setForm(f => ({
            ...f,
            stages: [...f.stages, { name: `Stage ${newIndex + 1}`, rolesAllowed: ['Super Admin'], highlightColor: '#93C5FD', order: newIndex + 1 }],
        }));
        setExpandedStages(e => ({ ...e, [newIndex]: true }));
    };

    const updateStage = (index: number, updates: Partial<Stage>) =>
        setForm(f => ({ ...f, stages: f.stages.map((s, i) => i === index ? { ...s, ...updates } : s) }));

    const removeStage = (index: number) =>
        setForm(f => ({ ...f, stages: f.stages.filter((_, i) => i !== index) }));

    const moveStage = (index: number, dir: -1 | 1) => {
        const arr = [...form.stages];
        [arr[index], arr[index + dir]] = [arr[index + dir], arr[index]];
        setForm(f => ({ ...f, stages: arr }));
    };

    const toggleRole = (stageIndex: number, role: string) => {
        const stage = form.stages[stageIndex];
        const roles = stage.rolesAllowed.includes(role)
            ? stage.rolesAllowed.filter(r => r !== role)
            : [...stage.rolesAllowed, role];
        updateStage(stageIndex, { rolesAllowed: roles });
    };

    const handleCreate = async () => {
        if (!form.name.trim()) { setForm(f => ({ ...f, error: 'Workflow name is required' })); return; }
        if (form.stages.length === 0) { setForm(f => ({ ...f, error: 'At least one stage is required' })); return; }
        try {
            setForm(f => ({ ...f, submitting: true, error: '' }));
            await api.createWorkflow(orgId, { name: form.name, relatedTo: form.relatedTo, keyApprovalStage: form.keyApprovalStage, stages: form.stages }, getToken()!);
            setShowCreate(false);
            setForm(f => ({ ...f, name: '', stages: [{ name: 'To Do', rolesAllowed: ['Super Admin'], highlightColor: '#FFB3C6', order: 1 }], submitting: false }));
            loadAll();
        } catch (e: any) {
            setForm(f => ({ ...f, submitting: false, error: e.message || 'Failed to create workflow' }));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setDeleting(true);
            await api.deleteWorkflow(id, getToken()!);
            setWorkflows(prev => prev.filter(w => w.id !== id));
            setDeleteConfirm(null);
        } catch (e) { console.error(e); } finally { setDeleting(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: COLORS.primary }} />
        </div>
    );

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const inputStyle = { backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#4A4A62' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' };

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA', color: darkMode ? '#E0E0E0' : '#1E293B' }}>

            <MainSidebar darkMode={darkMode} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} onLogout={handleLogout} />
            <ProjectSidebar
                projectName="Project" projectId={projectId} orgId={orgId}
                darkMode={darkMode} currentPath={currentPath}
                singlePages={singlePages} multiplePages={multiplePages} components={components}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="sticky top-0 z-40 border-b shrink-0"
                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => showCreate ? setShowCreate(false) : router.push(`/organization-projects/${orgId}/${projectId}`)}
                                className="p-2 rounded-lg transition-all" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Project / {showCreate ? 'Workflow Approval / Create' : 'Workflow Approval'}
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    {showCreate ? 'Create New Workflow' : 'Workflow Approval'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {showCreate ? (
                                <>
                                    <button onClick={() => setShowCreate(false)}
                                        className="px-4 py-2 text-sm font-medium rounded-lg"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#374151' }}>
                                        Cancel
                                    </button>
                                    <button onClick={handleCreate} disabled={form.submitting}
                                        className="px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-60"
                                        style={{ backgroundColor: COLORS.primary }}>
                                        {form.submitting ? 'Saving...' : 'Save Workflow'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="p-2.5 rounded-lg" title="Documentation"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                        <ExternalLink size={18} />
                                    </button>
                                    <button onClick={() => setShowCreate(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg"
                                        style={{ backgroundColor: COLORS.primary }}>
                                        <Plus size={16} /> Create a New Flow
                                    </button>
                                </>
                            )}
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

                <div className="flex-1 overflow-y-auto p-6">

                    {/* CREATE FORM */}
                    {showCreate && (
                        <div className="max-w-2xl mx-auto space-y-5">
                            {form.error && (
                                <p className="text-sm px-4 py-3 rounded-lg"
                                    style={{ backgroundColor: darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2', color: COLORS.error }}>
                                    {form.error}
                                </p>
                            )}

                            {/* Basic info */}
                            <div className="rounded-2xl border p-6 space-y-4"
                                style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                <h3 className="font-semibold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Workflow Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                            Workflow Name <span style={{ color: COLORS.error }}>*</span>
                                        </label>
                                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="e.g. Publishing Article"
                                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                                            style={inputStyle}
                                            onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#4A4A62' : '#E2E8F0'; }} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Related To</label>
                                        <select value={form.relatedTo} onChange={e => setForm(f => ({ ...f, relatedTo: e.target.value }))}
                                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none" style={inputStyle}>
                                            <option>Content Management</option>
                                            <option>Media Assets</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                            Key Approval Stage <span style={{ color: COLORS.error }}>*</span>
                                        </label>
                                        <select value={form.keyApprovalStage} onChange={e => setForm(f => ({ ...f, keyApprovalStage: e.target.value }))}
                                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none" style={inputStyle}>
                                            <option>Any Stage</option>
                                            {form.stages.map(s => <option key={s.name}>{s.name}</option>)}
                                        </select>
                                        <p className="mt-1.5 text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            Publication is restricted until entries reach this stage.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stages */}
                            <div className="rounded-2xl border p-6"
                                style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                <h3 className="font-semibold mb-4" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Stages</h3>
                                <div className="space-y-3">
                                    {form.stages.map((stage, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            {/* Stage header */}
                                            <div className="flex items-center justify-between px-4 py-3"
                                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.highlightColor }} />
                                                    <button onClick={() => setExpandedStages(e => ({ ...e, [idx]: !e[idx] }))}>
                                                        <svg className={`w-4 h-4 transition-transform ${expandedStages[idx] ? 'rotate-180' : ''}`}
                                                            style={{ color: darkMode ? '#64748B' : '#94A3B8' }} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                                                        </svg>
                                                    </button>
                                                    <span className="font-semibold text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                        {stage.name || `Stage ${idx + 1}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {idx > 0 && (
                                                        <button onClick={() => moveStage(idx, -1)}
                                                            className="p-1 rounded transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = COLORS.primary; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                            <ChevronUp size={15} />
                                                        </button>
                                                    )}
                                                    {idx < form.stages.length - 1 && (
                                                        <button onClick={() => moveStage(idx, 1)}
                                                            className="p-1 rounded transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = COLORS.primary; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                            <ChevronDown size={15} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => removeStage(idx)}
                                                        className="p-1 rounded transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = COLORS.error; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stage body */}
                                            {expandedStages[idx] && (
                                                <div className="p-4 space-y-4" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                                Stage Name <span style={{ color: COLORS.error }}>*</span>
                                                            </label>
                                                            <input type="text" value={stage.name}
                                                                onChange={e => updateStage(idx, { name: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                                                                style={inputStyle}
                                                                onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                                                onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#4A4A62' : '#E2E8F0'; }} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                                Highlight Color
                                                            </label>
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {HIGHLIGHT_COLORS.map(color => (
                                                                    <button key={color.value} onClick={() => updateStage(idx, { highlightColor: color.value })}
                                                                        title={color.label}
                                                                        className="w-6 h-6 rounded-full border-2 transition-transform"
                                                                        style={{
                                                                            backgroundColor: color.value,
                                                                            borderColor: stage.highlightColor === color.value ? (darkMode ? '#E0E0E0' : '#1E293B') : 'transparent',
                                                                            transform: stage.highlightColor === color.value ? 'scale(1.2)' : 'scale(1)',
                                                                        }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Roles */}
                                                    <div>
                                                        <label className="block text-xs font-medium mb-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                            Roles allowed to edit this stage
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {ROLES.map(role => {
                                                                const active = stage.rolesAllowed.includes(role);
                                                                return (
                                                                    <button key={role} onClick={() => toggleRole(idx, role)}
                                                                        className="px-3 py-1 rounded-full text-xs font-medium transition"
                                                                        style={{
                                                                            backgroundColor: active ? COLORS.primary : (darkMode ? '#3F3F52' : '#F1F5F9'),
                                                                            color: active ? '#FFFFFF' : (darkMode ? '#94A3B8' : '#64748B'),
                                                                        }}>
                                                                        {role}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add stage button */}
                                    <button onClick={addStage}
                                        className="w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                                        style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#64748B' : '#94A3B8' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.color = COLORS.primary; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                        <Plus size={16} /> Add New Stage
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WORKFLOW LIST */}
                    {!showCreate && (
                        <div className="rounded-2xl border overflow-hidden"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            {workflows.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-4xl mb-3">✅</div>
                                    <h3 className="font-bold mb-1" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>No Workflows Yet</h3>
                                    <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Create a workflow to set up an approval process for your content before it's published.
                                    </p>
                                    <button onClick={() => setShowCreate(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg mx-auto"
                                        style={{ backgroundColor: COLORS.primary }}>
                                        <Plus size={16} /> Create a New Flow
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            {['Workflow Name', 'Stages', 'Related To', 'Actions'].map(h => (
                                                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workflows.map(wf => (
                                            <tr key={wf.id} className="border-b transition"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#F1F5F9' }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F8FAFC'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                <td className="px-4 py-3 text-sm font-semibold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{wf.name}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {wf.stages?.map((s: any) => (
                                                            <span key={s.id} className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                                style={{ backgroundColor: s.highlightColor + '33', color: darkMode ? '#E0E0E0' : '#1E293B', border: `1px solid ${s.highlightColor}` }}>
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                        {!wf.stages?.length && <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }} className="text-sm">—</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{wf.relatedTo || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => router.back()}
                                                            className="p-1.5 rounded-lg transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#EFF6FF'; e.currentTarget.style.color = COLORS.primary; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm(wf.id)}
                                                            className="p-1.5 rounded-lg transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; e.currentTarget.style.color = COLORS.error; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                                <Trash2 size={18} style={{ color: COLORS.error }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Delete Workflow?</h3>
                        </div>
                        <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            This workflow and all its stages will be permanently deleted. Content assigned to this workflow will not be affected.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                                className="flex-1 py-2.5 font-medium rounded-lg"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                                className="flex-1 py-2.5 text-white font-medium rounded-lg disabled:opacity-60"
                                style={{ backgroundColor: COLORS.error }}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}