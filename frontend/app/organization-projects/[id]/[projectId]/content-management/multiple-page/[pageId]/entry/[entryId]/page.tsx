'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings,
    ArrowLeft, Save, Check, Trash2, Languages,
} from 'lucide-react';
import { getToken } from '../../../../../../../../lib/auth';
import { api } from '../../../../../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../../../../../hooks/usagePageSetup';

interface Field { id: string; name: string; apiId: string; type: string; required: boolean; unique: boolean; options?: any; }
interface SinglePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; }
interface MultiplePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; }
interface Component { id: string; name: string; apiId: string; }

async function googleTranslate(text: string, from: string, to: string): Promise<string> {
    if (!text.trim()) return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0]?.map((item: any) => item[0]).join('') || text;
}

export default function EditEntryPage() {
    const params = useParams();
    const orgId = params?.id as string;
    const projectId = params?.projectId as string;
    const pageId = params?.pageId as string;
    const entryId = params?.entryId as string;

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
    const [entry, setEntry] = useState<any>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [seoData, setSeoData] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // translate
    const [showTranslate, setShowTranslate] = useState(false);
    const [translateDir, setTranslateDir] = useState<'id-en' | 'en-id'>('id-en');
    const [translating, setTranslating] = useState(false);
    const [translatePreview, setTranslatePreview] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [pageRes, entryRes, fieldRes, spRes, mpRes, compRes] = await Promise.allSettled([
                api.getMultiplePageById(pageId, token),
                api.getEntryById(entryId, token),
                api.getFieldsByParent('multiple-page', pageId, token),
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (pageRes.status === 'fulfilled' && pageRes.value.data) setPage(pageRes.value.data);
            if (entryRes.status === 'fulfilled' && entryRes.value.data) {
                const e = entryRes.value.data;
                setEntry(e); setFormData(e.data || {}); setSeoData(e.data?.seo || {});
            }
            if (fieldRes.status === 'fulfilled' && Array.isArray(fieldRes.value.data)) setFields(fieldRes.value.data);
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [pageId, entryId, projectId, router]);

    useEffect(() => { initAuth(async () => { await load(); }); }, [orgId, projectId, pageId, entryId]);

    const goBack = () => router.push(`/organization-projects/${orgId}/${projectId}/content-management/multiple-page/${pageId}`);

    const handleSave = async () => {
        const missing = fields.filter(f => f.required && !formData[f.apiId]);
        if (missing.length > 0) { setError(`Required: ${missing.map(f => f.name).join(', ')}`); return; }
        try {
            setSaving(true); setError('');
            await api.updateEntry(entryId, { data: { ...formData, seo: seoData } }, getToken()!);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e: any) { setError(e.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const handleTogglePublish = async () => {
        try {
            await api.togglePublishEntry(entryId, getToken()!);
            setEntry((prev: any) => ({ ...prev, published: !prev?.published }));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await api.deleteEntry(entryId, getToken()!);
            goBack();
        } catch (e) { console.error(e); } finally { setDeleting(false); }
    };

    const handleFieldChange = (apiId: string, value: any) => setFormData(prev => ({ ...prev, [apiId]: value }));

    const handleTranslate = async () => {
        const textFields = fields.filter(f => f.type === 'TEXT');
        if (!textFields.length) return;
        setTranslating(true); setTranslatePreview({});
        const [from, to] = translateDir === 'id-en' ? ['id', 'en'] : ['en', 'id'];
        try {
            const results: Record<string, string> = {};
            for (const field of textFields) {
                const original = formData[field.apiId] || '';
                results[field.apiId] = original.trim() ? await googleTranslate(original, from, to) : '';
            }
            setTranslatePreview(results);
        } catch (e) { console.error(e); } finally { setTranslating(false); }
    };

    const applyTranslation = () => {
        setFormData(prev => ({ ...prev, ...translatePreview }));
        setShowTranslate(false); setTranslatePreview({});
    };

    // shared input styles
    const inputStyle = { backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#4A4A62' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' };
    const inputCls = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none';
    const focusOn = (e: any) => { e.currentTarget.style.borderColor = COLORS.primary; };
    const focusOff = (e: any) => { e.currentTarget.style.borderColor = darkMode ? '#4A4A62' : '#E2E8F0'; };

    const renderField = (field: Field) => {
        const value = formData[field.apiId] ?? '';
        const shared = { style: inputStyle, className: inputCls, onFocus: focusOn, onBlur: focusOff };

        switch (field.type) {
            case 'TEXT':
                if (field.options?.subtype === 'Rich Text' || field.options?.subtype === 'Long Text')
                    return <textarea rows={field.options.subtype === 'Rich Text' ? 6 : 3} value={value}
                        onChange={e => handleFieldChange(field.apiId, e.target.value)}
                        placeholder={`Enter ${field.name}...`} {...shared} className={inputCls + ' resize-none'} />;
                return <input type="text" value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)}
                    placeholder={`Enter ${field.name}...`} {...shared} />;

            case 'MEDIA':
                return (
                    <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition"
                        style={{ borderColor: darkMode ? '#4A4A62' : '#E2E8F0', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#4A4A62' : '#E2E8F0'; }}>
                        {value ? (
                            <img src={value} alt={field.name} className="max-h-40 rounded-lg object-cover" />
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                    <svg className="w-6 h-6" style={{ color: darkMode ? '#64748B' : '#94A3B8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Click to add media from media asset</p>
                            </>
                        )}
                    </div>
                );

            case 'NUMBER':
                return <input type="number" value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)} placeholder="0" {...shared} />;

            case 'DATE':
                return <input
                    type={field.options?.subtype === 'Time' ? 'time' : field.options?.subtype === 'DateTime' ? 'datetime-local' : 'date'}
                    value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)} {...shared} />;

            case 'LOCATION':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {[{ key: 'lat', label: 'Latitude', placeholder: '-6.200000' }, { key: 'lng', label: 'Longitude', placeholder: '106.816666' }].map(loc => (
                            <div key={loc.key}>
                                <label className="text-xs mb-1 block" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{loc.label}</label>
                                <input type="number" step="any" value={value?.[loc.key] ?? ''}
                                    onChange={e => handleFieldChange(field.apiId, { ...value, [loc.key]: e.target.value })}
                                    placeholder={loc.placeholder} {...shared} />
                            </div>
                        ))}
                    </div>
                );

            default:
                return <input type="text" value={typeof value === 'object' ? JSON.stringify(value) : value}
                    onChange={e => handleFieldChange(field.apiId, e.target.value)}
                    placeholder={`Enter ${field.name}...`} {...shared} />;
        }
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

                {/* ── top bar ── */}
                <div className="sticky top-0 z-40 border-b shrink-0"
                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={goBack}
                                className="p-2 rounded-lg transition-all" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Content Management / {page?.name} / Edit Entry
                                </p>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Edit Entry</h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: entry?.published
                                                ? (darkMode ? 'rgba(16,185,129,0.15)' : '#D1FAE5')
                                                : (darkMode ? '#3F3F52' : '#F1F5F9'),
                                            color: entry?.published ? '#10B981' : (darkMode ? '#64748B' : '#94A3B8'),
                                        }}>
                                        {entry?.published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowTranslate(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#374151' }}>
                                <Languages size={16} /> Translate
                            </button>
                            <button onClick={handleTogglePublish}
                                className="px-4 py-2 text-sm font-medium rounded-lg border transition"
                                style={{
                                    borderColor: entry?.published ? (darkMode ? '#3F3F52' : '#E2E8F0') : COLORS.primary,
                                    color: entry?.published ? (darkMode ? '#94A3B8' : '#64748B') : COLORS.primary,
                                    backgroundColor: 'transparent',
                                }}>
                                {entry?.published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="p-2.5 rounded-lg transition" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; e.currentTarget.style.color = COLORS.error; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#64748B' : '#94A3B8'; }}>
                                <Trash2 size={18} />
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                                style={{ backgroundColor: saved ? '#10B981' : COLORS.primary }}>
                                {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : <><Save size={16} /> Save</>}
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

                {/* ── content ── */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-4">

                        {error && (
                            <div className="px-4 py-3 rounded-xl text-sm border"
                                style={{ backgroundColor: darkMode ? 'rgba(249,50,50,0.1)' : '#FEF2F2', color: COLORS.error, borderColor: darkMode ? 'rgba(249,50,50,0.3)' : '#FECACA' }}>
                                {error}
                            </div>
                        )}

                        {/* main card */}
                        <div className="rounded-2xl border overflow-hidden"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>

                            {/* tabs */}
                            <div className="flex items-center border-b px-6" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                {(['content', 'seo'] as const).map(t => (
                                    <button key={t} onClick={() => setActiveTab(t)}
                                        className="py-4 px-1 mr-6 text-sm font-medium border-b-2 transition capitalize"
                                        style={{
                                            borderColor: activeTab === t ? COLORS.primary : 'transparent',
                                            color: activeTab === t ? COLORS.primary : darkMode ? '#64748B' : '#94A3B8',
                                        }}>
                                        {t === 'seo' ? 'SEO Setting' : 'Content'}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-5">
                                {activeTab === 'content' ? (
                                    fields.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>No fields defined yet.</p>
                                        </div>
                                    ) : fields.map(field => (
                                        <div key={field.id}>
                                            <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                                {field.name}
                                                {field.required && <span className="ml-1" style={{ color: COLORS.error }}>*</span>}
                                                <span className="text-xs font-normal ml-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                    ({field.options?.subtype || field.type})
                                                </span>
                                            </label>
                                            {renderField(field)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Meta Title', key: 'title', placeholder: 'Meta title' },
                                            { label: 'Keywords', key: 'keywords', placeholder: 'keyword1, keyword2' },
                                            { label: 'Canonical URL', key: 'canonical', placeholder: 'https://example.com/page' },
                                        ].map(f => (
                                            <div key={f.key}>
                                                <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>{f.label}</label>
                                                <input type="text" value={seoData[f.key] || ''}
                                                    onChange={e => setSeoData(s => ({ ...s, [f.key]: e.target.value }))}
                                                    placeholder={f.placeholder} className={inputCls} style={inputStyle}
                                                    onFocus={focusOn} onBlur={focusOff} />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Meta Description</label>
                                            <textarea rows={3} value={seoData.description || ''}
                                                onChange={e => setSeoData(s => ({ ...s, description: e.target.value }))}
                                                placeholder="Meta description"
                                                className={inputCls + ' resize-none'} style={inputStyle}
                                                onFocus={focusOn} onBlur={focusOff} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* entry info card */}
                        <div className="rounded-xl border p-4"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Entry Info
                            </p>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                {[
                                    { label: 'Created', value: entry?.createdAt ? new Date(entry.createdAt).toLocaleString() : '—' },
                                    { label: 'Updated', value: entry?.updatedAt ? new Date(entry.updatedAt).toLocaleString() : '—' },
                                    { label: 'Status', value: entry?.published ? 'Published' : 'Draft', colored: true },
                                    { label: 'ID', value: entryId, mono: true },
                                ].map(item => (
                                    <div key={item.label} className="flex gap-2">
                                        <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{item.label}:</span>
                                        <span className={item.mono ? 'font-mono text-xs break-all' : ''}
                                            style={{ color: item.colored ? (entry?.published ? '#10B981' : darkMode ? '#94A3B8' : '#64748B') : (darkMode ? '#E0E0E0' : '#374151') }}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete Modal ── */}
            {showDeleteConfirm && (
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
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                                className="flex-1 py-2.5 font-medium rounded-lg"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 text-white font-medium rounded-lg disabled:opacity-60"
                                style={{ backgroundColor: COLORS.error }}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Translate Modal ── */}
            {showTranslate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-md mx-4 shadow-2xl border overflow-hidden"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b"
                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <div className="flex items-center gap-2">
                                <Languages size={20} style={{ color: COLORS.primary }} />
                                <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Translate Content</h3>
                            </div>
                            <button onClick={() => { setShowTranslate(false); setTranslatePreview({}); }}
                                className="text-lg leading-none" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Direction</label>
                                <div className="flex gap-3">
                                    {([{ value: 'id-en', label: '🇮🇩 ID  →  🇬🇧 EN' }, { value: 'en-id', label: '🇬🇧 EN  →  🇮🇩 ID' }] as const).map(opt => (
                                        <button key={opt.value} onClick={() => { setTranslateDir(opt.value); setTranslatePreview({}); }}
                                            className="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition"
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

                            {Object.keys(translatePreview).filter(k => translatePreview[k]).length > 0 && (
                                <div className="rounded-xl p-4 space-y-3 border"
                                    style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F0FDF4', borderColor: darkMode ? '#10B981' : '#BBF7D0' }}>
                                    <p className="text-xs font-semibold" style={{ color: '#10B981' }}>Translation Preview</p>
                                    {Object.entries(translatePreview).filter(([, v]) => v).map(([key, val]) => (
                                        <div key={key}>
                                            <p className="text-xs font-mono mb-0.5" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{key}</p>
                                            <p className="text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{val}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => { setShowTranslate(false); setTranslatePreview({}); }}
                                    className="flex-1 py-2.5 font-medium rounded-lg text-sm"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                    Cancel
                                </button>
                                {Object.keys(translatePreview).length > 0 ? (
                                    <button onClick={applyTranslation}
                                        className="flex-1 py-2.5 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-1.5"
                                        style={{ backgroundColor: '#10B981' }}>
                                        <Check size={15} /> Apply
                                    </button>
                                ) : (
                                    <button onClick={handleTranslate}
                                        disabled={translating || fields.filter(f => f.type === 'TEXT').length === 0}
                                        className="flex-1 py-2.5 text-white font-medium rounded-lg text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: COLORS.primary }}>
                                        {translating
                                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Translating...</>
                                            : <><Languages size={15} /> Translate</>}
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