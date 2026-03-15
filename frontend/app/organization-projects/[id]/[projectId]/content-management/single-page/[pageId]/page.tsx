'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
    Languages, Save, Check,
} from 'lucide-react';
import { getToken } from '../../../../../../lib/auth';
import { api } from '../../../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../../../hooks/usagePageSetup';

interface Field {
    id: string; name: string; apiId: string; type: string;
    required: boolean; unique: boolean; options?: any;
}
interface SinglePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface MultiplePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface Component { id: string; name: string; apiId: string; fields?: any[] }

export default function SinglePageContentPage() {
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
    const [fields, setFields] = useState<Field[]>([]);
    const [content, setContent] = useState<Record<string, any>>({});
    const [seoData, setSeoData] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    /* translate */
    const [showTranslateModal, setShowTranslateModal] = useState(false);
    const [translateDir, setTranslateDir] = useState<'id-en' | 'en-id'>('id-en');
    const [translating, setTranslating] = useState(false);
    const [translatePreview, setTranslatePreview] = useState<Record<string, string>>({});

    const loadAll = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [pageRes, fieldRes, contentRes, spRes, mpRes, compRes] = await Promise.allSettled([
                api.getSinglePageById(pageId, token),
                api.getFieldsByParent('single-page', pageId, token),
                api.getCurrentContent(pageId, token),
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (pageRes.status === 'fulfilled' && pageRes.value.data) setPage(pageRes.value.data);
            if (fieldRes.status === 'fulfilled' && Array.isArray(fieldRes.value.data)) setFields(fieldRes.value.data);
            if (contentRes.status === 'fulfilled' && contentRes.value.data) {
                setContent(contentRes.value.data.content || contentRes.value.data || {});
                setSeoData(contentRes.value.data.seo || {});
            }
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [pageId, projectId, router]);

    useEffect(() => { initAuth(async () => { await loadAll(); }); }, [orgId, projectId, pageId]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.saveContent(pageId, { data: content }, getToken()!);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleFieldChange = (apiId: string, value: any) => {
        setContent(prev => ({ ...prev, [apiId]: value }));
    };

    /* ── Translate handler ── */
    const handleTranslate = async () => {
        const textFields = fields.filter(f => f.type === 'TEXT');
        if (textFields.length === 0) return;

        setTranslating(true);
        setTranslatePreview({});

        const [from, to] = translateDir === 'id-en' ? ['id', 'en'] : ['en', 'id'];

        try {
            const results: Record<string, string> = {};
            for (const field of textFields) {
                const original = content[field.apiId] || '';
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

    const applyTranslation = () => {
        setContent(prev => ({ ...prev, ...translatePreview }));
        setShowTranslateModal(false);
        setTranslatePreview({});
    };

    /* ── Render field ── */
    const inputStyle = {
        backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC',
        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
        color: darkMode ? '#E0E0E0' : '#1E293B',
    };

    const renderField = (field: Field) => {
        const value = content[field.apiId] ?? '';
        const sharedProps = {
            onFocus: (e: any) => { e.currentTarget.style.borderColor = COLORS.primary; },
            onBlur: (e: any) => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; },
            style: inputStyle,
            className: 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none',
        };

        switch (field.type) {
            case 'TEXT':
                if (field.options?.subtype === 'Rich Text' || field.options?.subtype === 'Long Text') return (
                    <textarea rows={field.options?.subtype === 'Rich Text' ? 5 : 3}
                        value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)}
                        placeholder={`Enter ${field.name}...`}
                        {...sharedProps} className={sharedProps.className + ' resize-none'} />
                );
                return <input type="text" value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)}
                    placeholder={`Enter ${field.name}...`} {...sharedProps} />;

            case 'MEDIA':
                return (
                    <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition"
                        style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }}>
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
                return <input type="number" value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)}
                    placeholder="0" {...sharedProps} />;

            case 'DATE':
                return <input
                    type={field.options?.subtype === 'Time' ? 'time' : field.options?.subtype === 'DateTime' ? 'datetime-local' : 'date'}
                    value={value} onChange={e => handleFieldChange(field.apiId, e.target.value)} {...sharedProps} />;

            default:
                return <input type="text" value={typeof value === 'object' ? JSON.stringify(value) : value}
                    onChange={e => handleFieldChange(field.apiId, e.target.value)}
                    placeholder={`Enter ${field.name}...`} {...sharedProps} />;
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
                                    Project / Content Management / Single Page / {page?.name}
                                </p>
                                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    <span>{page?.icon || '📄'}</span><span>{page?.name}</span>
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Translate button */}
                            <button onClick={() => setShowTranslateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#374151' }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                <Languages size={16} /> Translate
                            </button>

                            {/* Save */}
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                                style={{ backgroundColor: saved ? '#16A34A' : COLORS.primary }}>
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

                {/* content area */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="rounded-2xl border overflow-hidden"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>

                            {/* tabs */}
                            <div className="flex items-center border-b px-6" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                {(['content', 'seo'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className="py-4 px-1 mr-6 text-sm font-medium border-b-2 transition capitalize"
                                        style={{
                                            borderColor: activeTab === tab ? COLORS.primary : 'transparent',
                                            color: activeTab === tab ? COLORS.primary : darkMode ? '#64748B' : '#94A3B8',
                                        }}>
                                        {tab === 'seo' ? 'SEO Setting' : 'Content'}
                                    </button>
                                ))}
                                <div className="ml-auto">
                                    <button onClick={() => router.push(`/organization-projects/${orgId}/${projectId}/content-builder/single-page/${pageId}`)}
                                        className="text-xs px-3 py-1.5 rounded-lg transition"
                                        style={{ color: darkMode ? '#64748B' : '#94A3B8' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        ← Back to Builder
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                {activeTab === 'content' ? (
                                    fields.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-sm mb-3" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>No fields defined yet.</p>
                                            <button onClick={() => router.push(`/organization-projects/${orgId}/${projectId}/content-builder/single-page/${pageId}`)}
                                                className="text-sm" style={{ color: COLORS.primary }}>
                                                Go to Content Builder →
                                            </button>
                                        </div>
                                    ) : (
                                        fields.map(field => (
                                            <div key={field.id}>
                                                <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                                    {field.name}
                                                    {field.required && <span className="ml-1" style={{ color: COLORS.error }}>*</span>}
                                                </label>
                                                {renderField(field)}
                                            </div>
                                        ))
                                    )
                                ) : (
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Meta Title', key: 'title', placeholder: 'Meta title' },
                                            { label: 'Keywords', key: 'keywords', placeholder: 'keyword1, keyword2' },
                                        ].map(f => (
                                            <div key={f.key}>
                                                <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>{f.label}</label>
                                                <input type="text" value={seoData[f.key] || ''} onChange={e => setSeoData(s => ({ ...s, [f.key]: e.target.value }))}
                                                    placeholder={f.placeholder}
                                                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }} />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Meta Description</label>
                                            <textarea rows={3} value={seoData.description || ''} onChange={e => setSeoData(s => ({ ...s, description: e.target.value }))}
                                                placeholder="Meta description"
                                                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none resize-none"
                                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                                                onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Translate Modal ── */}
            {showTranslateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-lg mx-4 shadow-2xl border overflow-hidden"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>

                        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <div className="flex items-center gap-2">
                                <Languages size={20} style={{ color: COLORS.primary }} />
                                <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Translate Content</h3>
                            </div>
                            <button onClick={() => { setShowTranslateModal(false); setTranslatePreview({}); }}
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>✕</button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Direction picker */}
                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Translation Direction</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'id-en', label: '🇮🇩 Indonesian → 🇬🇧 English' },
                                        { value: 'en-id', label: '🇬🇧 English → 🇮🇩 Indonesian' },
                                    ].map(opt => (
                                        <button key={opt.value} onClick={() => { setTranslateDir(opt.value as any); setTranslatePreview({}); }}
                                            className="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition text-left"
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
                            <div>
                                <p className="text-sm font-medium mb-2" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                                    Text fields to translate ({fields.filter(f => f.type === 'TEXT').length})
                                </p>
                                <div className="rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto"
                                    style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F8FAFC', border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}` }}>
                                    {fields.filter(f => f.type === 'TEXT').map(f => (
                                        <div key={f.id} className="flex gap-2">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
                                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                {f.apiId}
                                            </span>
                                            <span className="text-xs truncate" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                {content[f.apiId] || <em>empty</em>}
                                            </span>
                                        </div>
                                    ))}
                                    {fields.filter(f => f.type === 'TEXT').length === 0 && (
                                        <p className="text-xs text-center py-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>No text fields found</p>
                                    )}
                                </div>
                            </div>

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
                                                <span className="text-xs" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setShowTranslateModal(false); setTranslatePreview({}); }}
                                    className="flex-1 py-2.5 font-medium rounded-lg transition text-sm"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                    Cancel
                                </button>
                                {Object.keys(translatePreview).length > 0 ? (
                                    <button onClick={applyTranslation}
                                        className="flex-1 py-2.5 text-white font-medium rounded-lg transition text-sm"
                                        style={{ backgroundColor: '#10B981' }}>
                                        ✓ Apply Translation
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