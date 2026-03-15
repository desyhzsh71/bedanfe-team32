'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
    Plus, GripVertical, Trash2, X,
} from 'lucide-react';
import { getToken } from '../../../../../../lib/auth';
import { api } from '../../../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../../../hooks/usagePageSetup';

interface Field {
    id: string; name: string; apiId: string; type: string;
    required: boolean; unique: boolean; validations?: any; options?: any; order?: number;
}
interface PageData {
    id: string; name: string; apiId: string;
    multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean;
    published?: boolean; icon?: string;
}
interface SinglePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface MultiplePage { id: string; name: string; apiId: string; multiLanguage: boolean; seoEnabled: boolean; workflowEnabled: boolean; fields?: any[] }
interface Component { id: string; name: string; apiId: string; fields?: any[] }

const FIELD_TYPES = [
    { type: 'TEXT', label: 'Text Field', desc: 'Short or long texts, titles, names, rich texts, etc.', subtypes: ['Short Text', 'Long Text', 'Rich Text'] },
    { type: 'MEDIA', label: 'Media Field', desc: 'Images, videos, audios or documents.', subtypes: ['Single Media', 'Multiple Media'] },
    { type: 'NUMBER', label: 'Number Field', desc: 'Numeric values with options for integers and decimals.', subtypes: ['Integer', 'Decimal'] },
    { type: 'DATE', label: 'Date and Time', desc: 'Temporal data with calendar inputs, time, and formatting.', subtypes: ['Date', 'Time', 'DateTime'] },
    { type: 'LOCATION', label: 'Location', desc: 'Geographic data via address inputs or map coordinates.', subtypes: [] },
    { type: 'MULTIPLE_CONTENT', label: 'Multiple Content', desc: 'Managing multiple content with flexible component combinations.', subtypes: [] },
    { type: 'RELATION', label: 'Relation', desc: 'Link entries across content types with configurable cardinality.', subtypes: [] },
];

const TYPE_COLORS: Record<string, string> = {
    TEXT: '#8B5CF6', MEDIA: '#F59E0B', NUMBER: '#3B82F6',
    DATE: '#06B6D4', LOCATION: '#10B981', MULTIPLE_CONTENT: '#EC4899', RELATION: '#6366F1',
};

export default function SinglePageBuilderPage() {
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

    const [page, setPage] = useState<PageData | null>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [showFieldTypeModal, setShowFieldTypeModal] = useState(false);
    const [showPageMenu, setShowPageMenu] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fieldSubtype, setFieldSubtype] = useState('');
    const [fieldConfig, setFieldConfig] = useState({
        name: '', apiId: '', required: false, unique: false,
        configSection: 'basic' as 'basic' | 'advanced',
    });
    const dragIndex = useRef<number | null>(null);

    const loadAll = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { router.push('/login'); return; }
            const [pageRes, fieldRes, spRes, mpRes, compRes] = await Promise.allSettled([
                api.getSinglePageById(pageId, token),
                api.getFieldsByParent('single-page', pageId, token),
                api.getSinglePagesByProject(projectId, token),
                api.getMultiplePagesByProject(projectId, token),
                api.getComponentsByProject(projectId, token),
            ]);
            if (pageRes.status === 'fulfilled' && pageRes.value.data) setPage(pageRes.value.data);
            if (fieldRes.status === 'fulfilled' && Array.isArray(fieldRes.value.data)) setFields(fieldRes.value.data);
            if (spRes.status === 'fulfilled') setSinglePages(Array.isArray(spRes.value.data) ? spRes.value.data : []);
            if (mpRes.status === 'fulfilled') setMultiplePages(Array.isArray(mpRes.value.data) ? mpRes.value.data : []);
            if (compRes.status === 'fulfilled') setComponents(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        } catch (e) { console.error(e); }
    }, [pageId, projectId, router]);

    useEffect(() => { initAuth(async () => { await loadAll(); }); }, [orgId, projectId, pageId]);

    useEffect(() => {
        if (selectedField) {
            setFieldConfig({ name: selectedField.name, apiId: selectedField.apiId, required: selectedField.required, unique: selectedField.unique, configSection: 'basic' });
            if (selectedField.options?.subtype) setFieldSubtype(selectedField.options.subtype);
        }
    }, [selectedField]);

    const handleAddField = async (type: string, subtype?: string) => {
        try {
            const token = getToken()!;
            const name = FIELD_TYPES.find(f => f.type === type)?.label || 'Field';
            const res = await api.createField({ name, type, singlePageId: pageId, options: subtype ? { subtype } : undefined }, token);
            if (res.data) { setFields(prev => [...prev, res.data]); setSelectedField(res.data); }
            setShowFieldTypeModal(false);
        } catch (e) { console.error(e); }
    };

    const handleSaveField = async () => {
        if (!selectedField) return;
        try {
            setSaving(true);
            await api.updateField(selectedField.id, { name: fieldConfig.name, apiId: fieldConfig.apiId, required: fieldConfig.required, unique: fieldConfig.unique }, getToken()!);
            setFields(prev => prev.map(f => f.id === selectedField.id ? { ...f, ...fieldConfig } : f));
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleDeleteField = async (id: string) => {
        try {
            await api.deleteField(id, getToken()!);
            setFields(prev => prev.filter(f => f.id !== id));
            if (selectedField?.id === id) setSelectedField(null);
        } catch (e) { console.error(e); }
    };

    const handleDeletePage = async () => {
        try {
            setDeleting(true);
            await api.deleteSinglePage(pageId, getToken()!);
            router.push(`/organization-projects/${orgId}/${projectId}/content-builder`);
        } catch (e) {
            console.error(e);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDragStart = (i: number) => { dragIndex.current = i; };
    const handleDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault();
        if (dragIndex.current === null || dragIndex.current === i) return;
        const arr = [...fields]; const [d] = arr.splice(dragIndex.current, 1);
        arr.splice(i, 0, d); dragIndex.current = i; setFields(arr);
    };
    const handleDragEnd = async () => {
        dragIndex.current = null;
        try { await api.reorderFields(fields.map(f => f.id), getToken()!); } catch (e) { console.error(e); }
    };

    const goBack = () => router.push(`/organization-projects/${orgId}/${projectId}/content-builder`);
    const goToContentManagement = () => router.push(`/organization-projects/${orgId}/${projectId}/content-management/single-page/${pageId}`);

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

                <div className="sticky top-0 z-40 border-b shrink-0"
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
                                    Project / Content Builder / Single Page / {page?.name}
                                </p>
                                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    <span>{page?.icon || '📄'}</span><span>{page?.name || 'Single Page Builder'}</span>
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* page menu */}
                            <div className="relative">
                                <button onClick={() => setShowPageMenu(!showPageMenu)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-lg font-bold transition-all"
                                    style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    ···
                                </button>
                                {showPageMenu && (
                                    <div className="absolute top-11 right-0 rounded-xl shadow-xl border py-1 z-20 w-52"
                                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                        <button onClick={() => { goToContentManagement(); setShowPageMenu(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2"
                                            style={{ color: darkMode ? '#E0E0E0' : '#374151' }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <span>📝</span> To Content Management
                                        </button>
                                        <div className="border-t my-1" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }} />
                                        {/* delete page */}
                                        <button
                                            onClick={() => { setShowPageMenu(false); setShowDeleteConfirm(true); }}
                                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2"
                                            style={{ color: COLORS.error }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <Trash2 size={15} /> Delete Page
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => router.push(`/organization-projects/${orgId}/${projectId}/content-builder/single-page/${pageId}/create-field-group`)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#374151' }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                📁 Create Field Group
                            </button>

                            <button onClick={() => setShowFieldTypeModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition"
                                style={{ backgroundColor: COLORS.primary }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                <Plus size={16} /> Add Field
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

                {/* fields list */}
                <div className="flex-1 overflow-y-auto p-6" style={{ marginRight: selectedField ? '320px' : '0' }}>
                    {fields.length === 0 ? (
                        <div className="rounded-2xl p-12 text-center"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}` }}>
                            <div className="text-4xl mb-3">📄</div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>No Content Structure Yet</h3>
                            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                Start building your content structure. Add field groups and custom fields based on your needs.
                            </p>
                            <button onClick={() => setShowFieldTypeModal(true)}
                                className="px-5 py-2.5 text-white text-sm font-medium rounded-lg transition"
                                style={{ backgroundColor: COLORS.primary }}>
                                + Add First Field
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={e => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setSelectedField(field)}
                                    className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
                                    style={{
                                        backgroundColor: selectedField?.id === field.id ? (darkMode ? 'rgba(58,122,195,0.15)' : '#EFF6FF') : (darkMode ? '#2D2D3F' : '#FFFFFF'),
                                        borderColor: selectedField?.id === field.id ? COLORS.primary : (darkMode ? '#3F3F52' : '#E2E8F0'),
                                    }}>
                                    <GripVertical size={20} className="shrink-0 cursor-grab" style={{ color: darkMode ? '#4A5568' : '#CBD5E0' }} />
                                    <div className="w-16 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                        style={{ backgroundColor: TYPE_COLORS[field.type] || '#6B7280' }}>
                                        {field.type.slice(0, 3)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{field.name}</p>
                                        <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            {field.options?.subtype || FIELD_TYPES.find(f => f.type === field.type)?.subtypes?.[0] || field.type}
                                        </p>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }}
                                        className="p-2 rounded-lg transition" style={{ color: COLORS.error }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* right config panel */}
            {selectedField && (
                <aside className="fixed right-0 top-0 h-full w-80 flex flex-col z-30 border-l"
                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <span className="font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Setting Configuration</span>
                        <button onClick={() => setSelectedField(null)} style={{ color: darkMode ? '#94A3B8' : '#64748B' }}><X size={20} /></button>
                    </div>
                    <div className="flex border-b" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        {(['basic', 'advanced'] as const).map(sec => (
                            <button key={sec} onClick={() => setFieldConfig(c => ({ ...c, configSection: sec }))}
                                className="flex-1 py-3 text-sm font-medium transition"
                                style={{ color: fieldConfig.configSection === sec ? (darkMode ? '#E0E0E0' : '#1E293B') : (darkMode ? '#64748B' : '#94A3B8'), borderBottom: fieldConfig.configSection === sec ? `2px solid ${COLORS.primary}` : '2px solid transparent' }}>
                                {sec === 'basic' ? 'Basic' : 'Advanced'}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {fieldConfig.configSection === 'basic' ? (
                            <>
                                {[{ label: 'Name', key: 'name' as const }, { label: 'API ID', key: 'apiId' as const }].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>{f.label}</label>
                                        <input type="text" value={fieldConfig[f.key]} onChange={e => setFieldConfig(c => ({ ...c, [f.key]: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
                                            style={{ backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                                            onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; }} />
                                        {f.key === 'apiId' && <p className="mt-1 text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Generated automatically and used to generate API routes</p>}
                                    </div>
                                ))}
                                {[
                                    { label: 'Required', key: 'required' as const, desc: 'Field must be filled before saving. Empty entries will be rejected.' },
                                    { label: 'Unique', key: 'unique' as const, desc: 'Duplicate entries are not allowed. Value must be unique across all records.' },
                                ].map(f => (
                                    <label key={f.key} className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" checked={fieldConfig[f.key]} onChange={e => setFieldConfig(c => ({ ...c, [f.key]: e.target.checked }))} className="mt-0.5 w-4 h-4 rounded" />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{f.label}</p>
                                            <p className="text-xs mt-0.5" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>{f.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </>
                        ) : (
                            <div className="space-y-4">
                                {(FIELD_TYPES.find(f => f.type === selectedField.type)?.subtypes?.length ?? 0) > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>Subtype</label>
                                        <select value={fieldSubtype} onChange={e => setFieldSubtype(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
                                            style={{ backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                            {FIELD_TYPES.find(f => f.type === selectedField.type)?.subtypes?.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                )}
                                <p className="text-sm" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>More advanced options depend on field type.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <button onClick={handleSaveField} disabled={saving}
                            className="w-full py-2.5 text-white font-medium rounded-lg transition disabled:opacity-60 text-sm"
                            style={{ backgroundColor: COLORS.primary }}>
                            {saving ? 'Saving...' : 'Save Field'}
                        </button>
                    </div>
                </aside>
            )}

            {/* add field type modal */}
            {showFieldTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-2xl mx-4 shadow-2xl border"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#F8FAFC', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                            <h3 className="text-xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Add Field Type</h3>
                            <button onClick={() => setShowFieldTypeModal(false)} style={{ color: darkMode ? '#94A3B8' : '#64748B' }}><X size={20} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-3">
                            {FIELD_TYPES.map(ft => (
                                <button key={ft.type} onClick={() => handleAddField(ft.type, ft.subtypes?.[0])}
                                    className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF', borderColor: 'transparent' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                                        style={{ backgroundColor: TYPE_COLORS[ft.type] || '#F97316' }}>
                                        {ft.type.slice(0, 3)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{ft.label}</p>
                                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{ft.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* delete page confirm */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                                <Trash2 size={18} style={{ color: COLORS.error }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Delete "{page?.name}"?
                            </h3>
                        </div>
                        <p className="text-sm mb-6" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            This will permanently delete this page and all its fields. This action <strong>cannot be undone</strong>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                                className="flex-1 py-2.5 font-medium rounded-lg transition"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeletePage} disabled={deleting}
                                className="flex-1 py-2.5 text-white font-medium rounded-lg transition disabled:opacity-60"
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