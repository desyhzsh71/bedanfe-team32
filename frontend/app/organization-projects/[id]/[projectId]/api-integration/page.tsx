'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
    Plus, Trash2, Pencil, ExternalLink,
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

const RESOURCES = [
    { key: 'customizable_content_models', label: 'Customizable Content Models and Schema' },
    { key: 'content_entries', label: 'Content Entries' },
    { key: 'media_assets', label: 'Media Assets' },
    { key: 'api_tokens', label: 'API Tokens' },
];
const ACTIONS = ['create', 'update', 'delete', 'findOne', 'find'];
const VALIDITY_OPTIONS = [
    { value: 7, label: '7 Days' }, { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' }, { value: 365, label: '1 Year' },
    { value: -1, label: 'No Expiry' },
];

export default function ApiIntegrationPage() {
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
    const [tokens, setTokens] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedResource, setExpandedResource] = useState<string | null>(RESOURCES[0].key);

    const [form, setForm] = useState({
        name: '', description: '', validityPeriod: 7,
        accessScope: 'FULL' as 'FULL' | 'CUSTOM' | 'READ_ONLY',
        permissions: {} as Record<string, Record<string, boolean>>,
        submitting: false, error: '',
    });

    const loadAll = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [tokRes, spRes, mpRes, compRes] = await Promise.allSettled([
                api.getApiTokens(orgId, token),
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (tokRes.status === 'fulfilled') setTokens(Array.isArray(tokRes.value.data) ? tokRes.value.data : []);
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [orgId, projectId, router]);

    useEffect(() => { initAuth(async () => { await loadAll(); }); }, [orgId, projectId]);

    const togglePermission = (resource: string, action: string) => {
        setForm(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [resource]: { ...prev.permissions[resource], [action]: !prev.permissions[resource]?.[action] } },
        }));
    };

    const toggleAllResource = (resource: string) => {
        const all = ACTIONS.every(a => form.permissions[resource]?.[a]);
        setForm(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [resource]: Object.fromEntries(ACTIONS.map(a => [a, !all])) },
        }));
    };

    const handleCreate = async () => {
        if (!form.name.trim()) { setForm(f => ({ ...f, error: 'Token name is required' })); return; }
        try {
            setForm(f => ({ ...f, submitting: true, error: '' }));
            const token = getToken()!;
            const permissions = form.accessScope === 'CUSTOM'
                ? Object.entries(form.permissions).flatMap(([resource, actions]) =>
                    Object.entries(actions).filter(([, v]) => v).map(([action]) => ({ resource, action }))
                ) : undefined;
            await api.createApiToken(orgId, { name: form.name, description: form.description, validityPeriod: form.validityPeriod, accessScope: form.accessScope, permissions }, token);
            setShowCreate(false);
            setForm(f => ({ ...f, name: '', description: '', submitting: false }));
            loadAll();
        } catch (e: any) {
            setForm(f => ({ ...f, submitting: false, error: e.message || 'Failed to create token' }));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setDeleting(true);
            await api.deleteApiToken(id, getToken()!);
            setTokens(prev => prev.filter(t => t.id !== id));
            setDeleteConfirm(null);
        } catch (e) { console.error(e); } finally { setDeleting(false); }
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: COLORS.primary }} />
        </div>
    );

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const inputStyle = { backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#4A4A62' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' };

    /* ── shared top bar profile dropdown ── */
    const ProfileDropdown = () => showProfileMenu ? (
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
    ) : null;

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA', color: darkMode ? '#E0E0E0' : '#1E293B' }}>

            <MainSidebar darkMode={darkMode} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} onLogout={handleLogout} />
            <ProjectSidebar
                projectName="Project" projectId={projectId} orgId={orgId}
                darkMode={darkMode} currentPath={currentPath}
                singlePages={singlePages} multiplePages={multiplePages} components={components}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* top bar */}
                <div className="sticky top-0 z-40 border-b shrink-0"
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
                                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Project / {showCreate ? 'API & Integration / Create Token' : 'API & Integration'}
                                </p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    {showCreate ? 'Create New API Token' : 'API & Integration'}
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
                                        {form.submitting ? 'Saving...' : 'Save Token'}
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
                                        <Plus size={16} /> New API Token
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
                                <ProfileDropdown />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* ── CREATE FORM ── */}
                    {showCreate && (
                        <div className="max-w-2xl mx-auto space-y-5">
                            {form.error && (
                                <p className="text-sm px-4 py-3 rounded-lg"
                                    style={{ backgroundColor: darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2', color: COLORS.error }}>
                                    {form.error}
                                </p>
                            )}
                            <div className="rounded-2xl border p-6 space-y-4"
                                style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                <h3 className="font-semibold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Token Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Token Name', key: 'name', placeholder: 'My API Token', required: true },
                                        { label: 'Description', key: 'description', placeholder: 'What is this token for?' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                                {f.label}{f.required && <span className="ml-1" style={{ color: COLORS.error }}>*</span>}
                                            </label>
                                            <input type="text" value={(form as any)[f.key]}
                                                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                                                style={inputStyle}
                                                onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#4A4A62' : '#E2E8F0'; }} />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                            Validity Period <span style={{ color: COLORS.error }}>*</span>
                                        </label>
                                        <select value={form.validityPeriod} onChange={e => setForm(f => ({ ...f, validityPeriod: Number(e.target.value) }))}
                                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none" style={inputStyle}>
                                            {VALIDITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                        <p className="mt-1.5 text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            Expired tokens are automatically removed from the list.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                            Access Scope <span style={{ color: COLORS.error }}>*</span>
                                        </label>
                                        <select value={form.accessScope} onChange={e => setForm(f => ({ ...f, accessScope: e.target.value as any }))}
                                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none" style={inputStyle}>
                                            <option value="FULL">Full Access</option>
                                            <option value="READ_ONLY">Read Only</option>
                                            <option value="CUSTOM">Custom</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {form.accessScope === 'CUSTOM' && (
                                <div className="rounded-2xl border p-6"
                                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                    <h3 className="font-semibold mb-4" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Access Permissions</h3>
                                    <div className="space-y-3">
                                        {RESOURCES.map(resource => {
                                            const allChecked = ACTIONS.every(a => form.permissions[resource.key]?.[a]);
                                            const isOpen = expandedResource === resource.key;
                                            return (
                                                <div key={resource.key} className="rounded-xl overflow-hidden border"
                                                    style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                                    <button onClick={() => setExpandedResource(isOpen ? null : resource.key)}
                                                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                                        <span className="text-sm font-semibold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{resource.label}</span>
                                                        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                            style={{ color: darkMode ? '#64748B' : '#94A3B8' }} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                                                        </svg>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-4 pb-4 pt-3" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                                                            <label className="flex items-center gap-2 cursor-pointer mb-3 justify-end">
                                                                <input type="checkbox" checked={allChecked} onChange={() => toggleAllResource(resource.key)} className="w-4 h-4 rounded" />
                                                                <span className="text-xs font-medium" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Select All</span>
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {ACTIONS.map(action => (
                                                                    <label key={action} className="flex items-center gap-2 cursor-pointer">
                                                                        <input type="checkbox"
                                                                            checked={!!form.permissions[resource.key]?.[action]}
                                                                            onChange={() => togglePermission(resource.key, action)}
                                                                            className="w-4 h-4 rounded" />
                                                                        <span className="text-sm capitalize" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                                                            {action === 'findOne' ? 'Find One' : action.charAt(0).toUpperCase() + action.slice(1)}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TOKEN LIST ── */}
                    {!showCreate && (
                        <div className="rounded-2xl border overflow-hidden"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            {tokens.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-4xl mb-3">🔑</div>
                                    <h3 className="font-bold mb-1" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>No API Tokens Yet</h3>
                                    <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        Create an API token to allow external applications to access your CMS data.
                                    </p>
                                    <button onClick={() => setShowCreate(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg mx-auto"
                                        style={{ backgroundColor: COLORS.primary }}>
                                        <Plus size={16} /> New API Token
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            {['Name', 'Description', 'Created', 'Last Used', 'Expires', 'Actions'].map(h => (
                                                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                                                    style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tokens.map(t => (
                                            <tr key={t.id} className="border-b transition"
                                                style={{ borderColor: darkMode ? '#3F3F52' : '#F1F5F9' }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F8FAFC'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                <td className="px-4 py-3 text-sm font-semibold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{t.name}</td>
                                                <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{t.description || '—'}</td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{formatDate(t.createdAt)}</td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{formatDate(t.lastUsedAt)}</td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{formatDate(t.expiresAt)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => router.back()}
                                                            className="p-1.5 rounded-lg transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#EFF6FF'; e.currentTarget.style.color = COLORS.primary; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm(t.id)}
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
                            <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Delete API Token?</h3>
                        </div>
                        <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            This token will be permanently deleted. Any applications using it will lose access immediately.
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