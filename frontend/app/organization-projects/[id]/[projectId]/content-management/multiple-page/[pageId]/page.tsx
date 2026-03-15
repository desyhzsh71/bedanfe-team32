'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
    Plus, Trash2, Pencil, Languages,
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

export default function MultiplePageEntriesPage() {
    const params = useParams();
    const orgId = params?.id as string;
    const projectId = params?.projectId as string;
    const pageId = params?.pageId as string;

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

    const [page, setPage] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showTranslateModal, setShowTranslateModal] = useState(false);
    const [translateDir, setTranslateDir] = useState<'id-en' | 'en-id'>('id-en');
    const [translating, setTranslating] = useState(false);
    const [translateEntryId, setTranslateEntryId] = useState<string | null>(null);
    const [translatePreview, setTranslatePreview] = useState<Record<string, string>>({});

    const loadAll = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [pageRes, entryRes, fieldRes, spRes, mpRes, compRes] = await Promise.allSettled([
                api.getMultiplePageById(pageId, token),
                api.getEntriesByMultiplePage(pageId, token),
                api.getFieldsByParent('multiple-page', pageId, token),
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (pageRes.status === 'fulfilled' && pageRes.value.data) setPage(pageRes.value.data);
            if (entryRes.status === 'fulfilled') setEntries(Array.isArray(entryRes.value.data) ? entryRes.value.data : []);
            if (fieldRes.status === 'fulfilled') setFields(Array.isArray(fieldRes.value.data) ? fieldRes.value.data : []);
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [pageId, projectId, router]);

    useEffect(() => { initAuth(async () => { await loadAll(); }); }, [orgId, projectId, pageId]);

    const handleDeleteEntry = async (id: string) => {
        try {
            setDeleting(true);
            await api.deleteEntry(id, getToken()!);
            setEntries(prev => prev.filter(e => e.id !== id));
            setDeleteConfirm(null);
        } catch (e) { console.error(e); } finally { setDeleting(false); }
    };

    const handleTogglePublish = async (id: string) => {
        try {
            await api.togglePublishEntry(id, getToken()!);
            setEntries(prev => prev.map(e => e.id === id ? { ...e, published: !e.published } : e));
        } catch (e) { console.error(e); }
    };

    const handleBulkDelete = async () => {
        try {
            await api.bulkDeleteEntries(selectedEntries, getToken()!);
            setEntries(prev => prev.filter(e => !selectedEntries.includes(e.id)));
            setSelectedEntries([]);
        } catch (e) { console.error(e); }
    };

    const openTranslate = (entryId: string) => {
        setTranslateEntryId(entryId);
        setTranslatePreview({});
        setShowTranslateModal(true);
    };

    const handleTranslate = async () => {
        const entry = entries.find(e => e.id === translateEntryId);
        if (!entry) return;

        const textFields = fields.filter(f => f.type === 'TEXT');
        if (textFields.length === 0) return;

        setTranslating(true);
        setTranslatePreview({});

        const [from, to] = translateDir === 'id-en' ? ['id', 'en'] : ['en', 'id'];

        try {
            const results: Record<string, string> = {};
            for (const field of textFields) {
                const original = entry.data?.[field.apiId] || '';
                if (!original.trim()) { results[field.apiId] = ''; continue; }
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(original)}`;
                const res = await fetch(url);
                const data = await res.json();
                results[field.apiId] = data[0]?.map((item: any) => item[0]).join('') || original;
            }
            setTranslatePreview(results);
        } catch (e) {
            console.error('Translation failed', e);
        } finally {
            setTranslating(false);
        }
    };

    const applyTranslation = async () => {
        if (!translateEntryId) return;
        const entry = entries.find(e => e.id === translateEntryId);
        if (!entry) return;
        try {
            const newData = { ...entry.data, ...translatePreview };
            await api.updateEntry(translateEntryId, { data: newData }, getToken()!);
            setEntries(prev => prev.map(e => e.id === translateEntryId ? { ...e, data: newData } : e));
            setShowTranslateModal(false);
            setTranslatePreview({});
            setTranslateEntryId(null);
        } catch (e) { console.error(e); }
    };

    const navCreate = () => router.push(`/organization-projects/${orgId}/${projectId}/content-management/multiple-page/${pageId}/entry/create`);
    const navEdit = (entryId: string) => router.push(`/organization-projects/${orgId}/${projectId}/content-management/multiple-page/${pageId}/entry/${entryId}`);
    const navToBuilder = () => router.push(`/organization-projects/${orgId}/${projectId}/content-builder/multiple-page/${pageId}`);

    const getEntryTitle = (entry: any) => {
        const firstTextField = fields.find(f => f.type === 'TEXT');
        if (firstTextField && entry.data) return entry.data[firstTextField.apiId] || `Entry ${entry.id.slice(0, 8)}`;
        return `Entry ${entry.id?.slice(0, 8) || '—'}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: COLORS.primary }} />
        </div>
    );

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

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
                                    Project / Content Management / Multiple Page / {page?.name}
                                </p>
                                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    <span>📋</span><span>{page?.name}</span>
                                    <span className="text-sm font-normal px-2 py-0.5 rounded-full ml-1"
                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        {entries.length} entries
                                    </span>
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedEntries.length > 0 && (
                                <button onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
                                    style={{ backgroundColor: darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2', color: COLORS.error }}>
                                    <Trash2 size={15} /> Delete ({selectedEntries.length})
                                </button>
                            )}
                            <button onClick={navToBuilder}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#374151' }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                Edit Structure
                            </button>
                            <button onClick={navCreate}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition"
                                style={{ backgroundColor: COLORS.primary }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                <Plus size={16} /> Create Entry
                            </button>
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

                {/* entries table */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        {entries.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-3">📋</div>
                                <h3 className="font-bold mb-1" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>No Entries Yet</h3>
                                <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    {fields.length === 0
                                        ? 'First define the fields in Content Builder, then create entries here.'
                                        : 'Start creating entries to populate this collection.'}
                                </p>
                                {fields.length === 0
                                    ? <button onClick={navToBuilder} className="px-4 py-2 text-white text-sm font-medium rounded-lg" style={{ backgroundColor: COLORS.primary }}>Go to Builder</button>
                                    : <button onClick={navCreate} className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg mx-auto" style={{ backgroundColor: COLORS.primary }}><Plus size={16} /> Create First Entry</button>
                                }
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b" style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        <th className="w-10 px-4 py-3">
                                            <input type="checkbox"
                                                checked={selectedEntries.length === entries.length && entries.length > 0}
                                                onChange={e => setSelectedEntries(e.target.checked ? entries.map(en => en.id) : [])}
                                                className="w-4 h-4 rounded border-gray-300" />
                                        </th>
                                        {['Title', 'Status', 'Updated', 'Actions'].map(h => (
                                            <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                                                style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="border-b transition"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#F1F5F9' }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#F8FAFC'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <td className="px-4 py-3">
                                                <input type="checkbox"
                                                    checked={selectedEntries.includes(entry.id)}
                                                    onChange={e => setSelectedEntries(prev => e.target.checked ? [...prev, entry.id] : prev.filter(id => id !== entry.id))}
                                                    className="w-4 h-4 rounded border-gray-300" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => navEdit(entry.id)}
                                                    className="font-medium text-sm hover:underline" style={{ color: COLORS.primary }}>
                                                    {getEntryTitle(entry)}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: entry.published ? (darkMode ? 'rgba(16,185,129,0.15)' : '#D1FAE5') : (darkMode ? '#3F3F52' : '#F1F5F9'),
                                                        color: entry.published ? '#10B981' : darkMode ? '#64748B' : '#94A3B8',
                                                    }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.published ? '#10B981' : '#94A3B8' }} />
                                                    {entry.published ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleTogglePublish(entry.id)}
                                                        className="px-3 py-1 text-xs font-medium rounded-full transition"
                                                        style={{
                                                            backgroundColor: entry.published ? (darkMode ? '#3F3F52' : '#F1F5F9') : (darkMode ? 'rgba(58,122,195,0.15)' : '#EFF6FF'),
                                                            color: entry.published ? (darkMode ? '#94A3B8' : '#64748B') : COLORS.primary,
                                                        }}>
                                                        {entry.published ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    {/* translate per entry */}
                                                    <button onClick={() => openTranslate(entry.id)}
                                                        className="p-1.5 rounded-lg transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                        title="Translate"
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; e.currentTarget.style.color = COLORS.primary; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                        <Languages size={15} />
                                                    </button>
                                                    <button onClick={() => navEdit(entry.id)}
                                                        className="p-1.5 rounded-lg transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#EFF6FF'; e.currentTarget.style.color = COLORS.primary; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(entry.id)}
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
                </div>
            </div>

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                                <Trash2 size={18} style={{ color: COLORS.error }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Delete Entry?</h3>
                        </div>
                        <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            This entry will be permanently deleted. This action <strong>cannot be undone</strong>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                                className="flex-1 py-2.5 font-medium rounded-lg transition"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDeleteEntry(deleteConfirm)} disabled={deleting}
                                className="flex-1 py-2.5 text-white font-medium rounded-lg transition disabled:opacity-60"
                                style={{ backgroundColor: COLORS.error }}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Translate */}
            {showTranslateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-lg mx-4 shadow-2xl border overflow-hidden"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>

                        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <div className="flex items-center gap-2">
                                <Languages size={20} style={{ color: COLORS.primary }} />
                                <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Translate Entry</h3>
                            </div>
                            <button onClick={() => { setShowTranslateModal(false); setTranslatePreview({}); setTranslateEntryId(null); }}
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>✕</button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Translation Direction</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'id-en', label: '🇮🇩 Indonesian → 🇬🇧 English' },
                                        { value: 'en-id', label: '🇬🇧 English → 🇮🇩 Indonesian' },
                                    ].map(opt => (
                                        <button key={opt.value} onClick={() => { setTranslateDir(opt.value as any); setTranslatePreview({}); }}
                                            className="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition"
                                            style={{
                                                borderColor: translateDir === opt.value ? COLORS.primary : darkMode ? '#3F3F52' : '#E2E8F0',
                                                backgroundColor: translateDir === opt.value ? (darkMode ? 'rgba(58,122,195,0.15)' : '#EFF6FF') : (darkMode ? '#3F3F52' : '#F8FAFC'),
                                                color: translateDir === opt.value ? COLORS.primary : darkMode ? '#94A3B8' : '#64748B',
                                            }}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fields preview */}
                            {translateEntryId && (() => {
                                const entry = entries.find(e => e.id === translateEntryId);
                                const textFields = fields.filter(f => f.type === 'TEXT');
                                return (
                                    <div>
                                        <p className="text-sm font-medium mb-2" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                            Text fields to translate ({textFields.length})
                                        </p>
                                        <div className="rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto"
                                            style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F8FAFC', border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}` }}>
                                            {textFields.map(f => (
                                                <div key={f.id} className="flex gap-2">
                                                    <span className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
                                                        style={{ backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                        {f.apiId}
                                                    </span>
                                                    <span className="text-xs truncate" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                        {entry?.data?.[f.apiId] || <em>empty</em>}
                                                    </span>
                                                </div>
                                            ))}
                                            {textFields.length === 0 && (
                                                <p className="text-xs text-center py-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>No text fields found</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Preview results */}
                            {Object.keys(translatePreview).length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Translation Preview</p>
                                    <div className="rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto"
                                        style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F0FDF4', border: `1px solid ${darkMode ? '#10B981' : '#BBF7D0'}` }}>
                                        {Object.entries(translatePreview).map(([key, val]) => (
                                            <div key={key} className="flex gap-2">
                                                <span className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
                                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#D1FAE5', color: '#10B981' }}>
                                                    {key}
                                                </span>
                                                <span className="text-xs" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{val as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setShowTranslateModal(false); setTranslatePreview({}); setTranslateEntryId(null); }}
                                    className="flex-1 py-2.5 font-medium rounded-lg transition text-sm"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                    Cancel
                                </button>
                                {Object.keys(translatePreview).length > 0 ? (
                                    <button onClick={applyTranslation}
                                        className="flex-1 py-2.5 text-white font-medium rounded-lg transition text-sm"
                                        style={{ backgroundColor: '#10B981' }}>
                                        ✓ Apply & Save
                                    </button>
                                ) : (
                                    <button onClick={handleTranslate} disabled={translating || fields.filter(f => f.type === 'TEXT').length === 0}
                                        className="flex-1 py-2.5 text-white font-medium rounded-lg transition text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: COLORS.primary }}>
                                        {translating ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Translating...</>
                                        ) : (
                                            <><Languages size={16} /> Translate Now</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}