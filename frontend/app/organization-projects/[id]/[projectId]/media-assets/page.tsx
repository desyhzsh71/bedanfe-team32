'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
    X, Image as ImageIcon, Upload, Search,
    Trash2, Download, Eye, AlertCircle, CheckCircle, Copy, Grid, List,
    ArrowUpDown, RefreshCw, Plus,
    FolderPlus, MoreVertical, Folder, Filter,
} from 'lucide-react';
import { getToken } from '../../../../lib/auth';
import { api } from '../../../../lib/api';
import ProfilePhoto from '@/app/components/ProfilePhoto';
import MainSidebar from '@/app/components/MainSidebar';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import { usePageSetup, COLORS } from '../../../../hooks/usagePageSetup';
import type { MediaAsset } from '../../../../types/media';

type FilterType = 'all' | 'image' | 'video' | 'document';
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc';
type ViewMode = 'grid' | 'list';

const BACKEND_URL = 'http://localhost:3000';

interface DetailModalProps {
    asset: MediaAsset;
    darkMode: boolean;
    onClose: () => void;
    onSave: (assetId: string, data: Record<string, any>) => Promise<void>;
    onReplace: (assetId: string, file: File) => Promise<void>;
    onDelete: (assetId: string) => Promise<void>;
    folders: { id: string; name: string }[];
    currentUser: any;
}

function DetailModal({ asset, darkMode, onClose, onSave, onReplace, onDelete, folders, currentUser }: DetailModalProps) {
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(asset.title || asset.fileName || '');
    const [description, setDescription] = useState((asset as any).description || '');
    const [altText, setAltText] = useState((asset as any).altText || '');
    const [tags, setTags] = useState((asset as any).tags || '');
    const [folder, setFolder] = useState((asset as any).folderId || '');
    const [language, setLanguage] = useState((asset as any).language || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveOk, setSaveOk] = useState(false);
    const [isGeneratingAlt, setIsGeneratingAlt] = useState(false);
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isImage = (asset.mimeType || '').startsWith('image/');
    const isVideo = (asset.mimeType || '').startsWith('video/');
    const ext = (asset.fileName || '').split('.').pop()?.toUpperCase() || '—';
    const fileType = isImage ? 'Image' : isVideo ? 'Video' : 'Document';

    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    const formatFileSize = (bytes: number) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(asset.id, {
                title, description, altText,
                tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                language, folderId: folder || null,
            });
            setSaveOk(true);
            setTimeout(() => setSaveOk(false), 2000);
        } finally { setIsSaving(false); }
    };

    const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await onReplace(asset.id, file);
        if (replaceInputRef.current) replaceInputRef.current.value = '';
    };

    const handleSmartAlt = async () => {
        setIsGeneratingAlt(true);
        await new Promise(r => setTimeout(r, 900));
        const name = (asset.title || asset.fileName || '').replace(/[-_\.]/g, ' ').replace(/\.[^.]+$/, '');
        setAltText(`${name} — ${fileType.toLowerCase()} asset`);
        setIsGeneratingAlt(false);
    };

    const handleSmartTags = async () => {
        setIsGeneratingTags(true);
        await new Promise(r => setTimeout(r, 900));
        const name = (asset.title || asset.fileName || '').replace(/\.[^.]+$/, '');
        const words = name.split(/[-_\s]+/).filter(Boolean).slice(0, 5);
        setTags([...words, fileType.toLowerCase()].join(', '));
        setIsGeneratingTags(false);
    };

    const bg = darkMode ? '#1A1A2E' : '#FFFFFF';
    const cardBg = darkMode ? '#2A2A3E' : '#F5F5F5';
    const border = darkMode ? '#3F3F52' : '#E0E0E0';
    const textMain = darkMode ? '#E0E0E0' : '#1A1A1A';
    const textSub = darkMode ? '#94A3B8' : '#666666';

    const inp: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: '8px',
        border: `1px solid ${border}`,
        backgroundColor: darkMode ? '#2A2A3E' : '#FFFFFF',
        color: textMain, fontSize: '14px', outline: 'none',
    };
    const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: textSub };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ backgroundColor: bg, width: '100%', maxWidth: '820px', maxHeight: 'calc(100vh - 32px)', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: textMain, margin: 0 }}>Details</h2>
                    <button onClick={onClose} style={{ padding: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: darkMode ? '#3F3F52' : '#F5F5F5', color: textSub, display: 'flex', alignItems: 'center' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    {/* LEFT */}
                    <div style={{ width: '44%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', overflowY: 'auto', borderRight: `1px solid ${border}` }}>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, minHeight: '200px', maxHeight: '260px' }}>
                            {isImage && asset.fileUrl && !imgError ? (
                                <img src={`${BACKEND_URL}${asset.fileUrl}`} alt={altText || asset.title} className="w-full h-full object-contain" onError={() => setImgError(true)} />
                            ) : isVideo && asset.fileUrl ? (
                                <video src={`${BACKEND_URL}${asset.fileUrl}`} controls className="w-full max-h-80 object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <span className="text-5xl font-light" style={{ color: '#999' }}>Image</span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl p-5" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                            <p className="text-sm font-bold mb-4" style={{ color: textMain }}>Image tools</p>
                            <div className="flex gap-3">
                                {isImage && (
                                    <button className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg"
                                        style={{ backgroundColor: '#42AFED' }}
                                        onClick={() => window.open(`${BACKEND_URL}${asset.fileUrl}`, '_blank')}>Edit Image</button>
                                )}
                                <button className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg"
                                    style={{ backgroundColor: '#42AFED' }}
                                    onClick={() => { const a = document.createElement('a'); a.href = `${BACKEND_URL}${asset.fileUrl}`; a.download = asset.fileName; a.click(); }}>Download</button>
                                <input ref={replaceInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleReplace} />
                                <button className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg"
                                    style={{ backgroundColor: '#42AFED' }}
                                    onClick={() => replaceInputRef.current?.click()}>Replace</button>
                            </div>
                        </div>

                        <div className="rounded-xl p-5" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                            <p className="text-sm font-bold mb-4" style={{ color: textMain }}>Asset Informations</p>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                {[
                                    ['Size', formatFileSize(asset.fileSize || 0)],
                                    ['Type', fileType],
                                    ['Extension', ext],
                                    ['Created at', fmt(asset.createdAt)],
                                    ['Dimension', (asset as any).dimensions ? `${(asset as any).dimensions.width} × ${(asset as any).dimensions.height} px` : '—'],
                                    ['Updated at', fmt((asset as any).updatedAt)],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex gap-1">
                                        <span style={{ color: textSub, minWidth: '80px' }}>{k}</span>
                                        <span style={{ color: textSub }}>:</span>
                                        <span style={{ color: textMain }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={lbl}>Language</label>
                                <select value={language} onChange={e => setLanguage(e.target.value)} style={inp}>
                                    <option value=""></option>
                                    <option value="id">🇮🇩 Indonesia</option>
                                    <option value="en">🇬🇧 English</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <p className="text-sm font-bold mb-4" style={{ color: textMain }}>Metadata</p>
                                <div className="space-y-4">
                                    <div>
                                        <label style={lbl}>Title / File name</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Asset title..." style={inp} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Description</label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this asset..." rows={3} style={{ ...inp, resize: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Alt Text</label>
                                        <input type="text" value={altText} onChange={e => setAltText(e.target.value)} placeholder="Describe image for accessibility..." style={inp} />
                                        <p className="text-xs mt-1" style={{ color: textSub }}>This text appears when the asset cannot be displayed properly</p>
                                        <button onClick={handleSmartAlt} disabled={isGeneratingAlt}
                                            className="mt-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
                                            style={{ backgroundColor: '#42AFED' }}>
                                            {isGeneratingAlt ? 'Generating…' : 'Smart Alt Text'}
                                        </button>
                                    </div>
                                    <div>
                                        <label style={lbl}>Tags</label>
                                        <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3..." style={inp} />
                                        <button onClick={handleSmartTags} disabled={isGeneratingTags}
                                            className="mt-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
                                            style={{ backgroundColor: '#42AFED' }}>
                                            {isGeneratingTags ? 'Generating…' : 'Smart Tags'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold mb-4" style={{ color: textMain }}>Other Information</p>
                                <div className="space-y-4">
                                    <div>
                                        <label style={lbl}>Manage Folder</label>
                                        <select value={folder} onChange={e => setFolder(e.target.value)} style={inp}>
                                            <option value="">— No folder —</option>
                                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={lbl}>Author</label>
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: darkMode ? '#2A2A3E' : '#F5F5F5', border: `1px solid ${border}` }}>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: '#42AFED' }}>
                                                {(currentUser?.fullName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: textMain }}>{currentUser?.fullName || 'Unknown'}</p>
                                                <p className="text-xs" style={{ color: textSub }}>{currentUser?.role || 'Editor'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                            <button onClick={handleSave} disabled={isSaving}
                                style={{ width: '100%', padding: '12px', color: '#fff', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: saveOk ? COLORS.success : COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSaving ? 0.6 : 1, fontSize: '15px' }}>
                                {isSaving
                                    ? <><div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                                    : saveOk ? <><CheckCircle size={17} /> Saved!</> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Folder Card ──────────────────────────────────────────────────────────────
function FolderCard({ folder, darkMode, onDelete, onClick }: { folder: { id: string; name: string }; darkMode: boolean; onDelete: () => void; onClick: () => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const bg = darkMode ? '#3A5080' : '#CBE0F5';
    const textColor = darkMode ? '#E0E0E0' : '#1A1A1A';

    return (
        <div className="relative rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer transition-all"
            style={{ backgroundColor: bg, minHeight: '160px' }}
            onClick={onClick}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            <div className="absolute top-3 left-3 w-5 h-5 rounded border-2" style={{ borderColor: darkMode ? '#64748B' : '#94A3B8' }} />
            <div className="absolute top-3 right-3">
                <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 rounded" style={{ color: textColor }}>
                    <MoreVertical size={16} />
                </button>
                {showMenu && (
                    <div className="absolute right-0 mt-1 w-36 rounded-lg shadow-lg border py-1 z-50"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                        <button onClick={e => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2" style={{ color: COLORS.error }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <Trash2 size={14} /> Delete folder
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-1 flex items-center justify-center">
                <Folder size={64} style={{ color: darkMode ? '#6B9FD4' : '#5B8FD4' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: textColor }}>{folder.name}</p>
        </div>
    );
}

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({ item, darkMode, selected, onSelect, onClick, onDelete, onDownload, onCopyUrl, copiedUrl }: any) {
    const bg = darkMode ? '#3A5080' : '#CBE0F5';
    const textColor = darkMode ? '#E0E0E0' : '#1A1A1A';
    const isImage = (item.mimeType || '').startsWith('image/');
    const isVideo = (item.mimeType || '').startsWith('video/');
    const typeLabel = isImage ? 'Image' : isVideo ? 'Video' : 'Document';
    const tagColor = isImage ? '#E040A0' : isVideo ? '#9C27B0' : '#FF5722';

    return (
        <div className="relative rounded-xl overflow-hidden cursor-pointer transition-all group"
            style={{ backgroundColor: bg, border: selected ? `2px solid ${COLORS.primary}` : '2px solid transparent' }}
            onClick={onClick}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            <div className="absolute top-3 left-3 z-10" onClick={e => { e.stopPropagation(); onSelect(); }}>
                <input type="checkbox" checked={selected} readOnly className="w-5 h-5 rounded cursor-pointer" style={{ accentColor: COLORS.primary }} />
            </div>
            <div className="aspect-square flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #6B1FD7 100%)' }}>
                {isImage && item.fileUrl ? (
                    <img src={`${BACKEND_URL}${item.fileUrl}`} alt={item.title} className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                    <span className="text-white text-xl font-light opacity-80">{typeLabel}</span>
                )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                <button onClick={e => { e.stopPropagation(); onClick(); }} className="p-2 rounded-lg text-white" style={{ backgroundColor: COLORS.info }} title="Details"><Eye size={16} /></button>
                <button onClick={e => { e.stopPropagation(); onDownload(); }} className="p-2 rounded-lg text-white" style={{ backgroundColor: COLORS.success }} title="Download"><Download size={16} /></button>
                <button onClick={e => { e.stopPropagation(); onCopyUrl(e); }} className="p-2 rounded-lg text-white" style={{ backgroundColor: copiedUrl ? COLORS.warning : COLORS.accent }} title="Copy URL"><Copy size={16} /></button>
                <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg text-white" style={{ backgroundColor: COLORS.error }} title="Delete"><Trash2 size={16} /></button>
            </div>
            <div className="px-3 py-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: textColor }}>{item.title || item.fileName}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: tagColor }}>{typeLabel}</span>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaAssetsPage() {
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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    const [singlePages, setSinglePages] = useState<any[]>([]);
    const [multiplePages, setMultiplePages] = useState<any[]>([]);
    const [components, setComponents] = useState<any[]>([]);

    const [media, setMedia] = useState<MediaAsset[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const [usageData, setUsageData] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [detailAsset, setDetailAsset] = useState<MediaAsset | null>(null);

    const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(false);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const loadMedia = useCallback(async (folderId?: string | null) => {
        try {
            const token = getToken(); if (!token) return;
            const queryParams: Record<string, any> = { sortBy: 'createdAt', sortOrder: 'desc' };
            if (folderId) queryParams.folderId = folderId;
            const res = await api.getAllMediaAssets(orgId, token, queryParams);
            if (res.success && res.data?.assets) setMedia(res.data.assets);
            else if (res.success && res.data?.data) setMedia(res.data.data);
            else if (res.success && Array.isArray(res.data)) setMedia(res.data);
        } catch (e) { console.error(e); }
    }, [orgId]);

    const loadFolders = useCallback(async () => {
        try {
            setFoldersLoading(true);
            const token = getToken(); if (!token) return;
            const res = await api.getAllMediaFolders(orgId, token);
            if (res.success && res.data?.folders) setFolders(res.data.folders);
            else if (res.success && res.data?.data) setFolders(res.data.data);
            else if (res.success && Array.isArray(res.data)) setFolders(res.data);
        } catch (e) { console.error(e); } finally { setFoldersLoading(false); }
    }, [orgId]);

    const loadUsageData = useCallback(async () => {
        try {
            const token = getToken(); if (!token) return;
            const [subRes, usageRes] = await Promise.all([
                api.getCurrentSubscription(orgId, token),
                api.getCurrentUsage(orgId, token),
            ]);
            if (subRes.success && subRes.data) setSubscription(subRes.data.subscription);
            if (usageRes.success && usageRes.data) setUsageData(usageRes.data.usage);
        } catch (e) { console.error(e); }
    }, [orgId]);

    useEffect(() => {
        initAuth(async () => {
            await Promise.all([loadFolders(), loadMedia(), loadUsageData()]);
        });
    }, [orgId, projectId]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) setShowSortDropdown(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (usageData && subscription) {
            const limit = subscription.plan.mediaAssetLimit;
            const current = usageData.mediaAssets || 0;
            if (limit !== 'unlimited' && current >= parseInt(limit)) {
                setError(`Media limit reached (${current}/${limit}). Please upgrade your plan.`);
                setTimeout(() => router.push('/billing/plans'), 2000);
                return;
            }
        }
        try {
            setIsUploading(true); setError(null); setSuccess(null); setUploadProgress(0);
            const token = getToken(); if (!token) return;
            const formData = new FormData();
            Array.from(files).forEach(file => formData.append('files', file));
            const uploadRes = await api.uploadMediaAsset(orgId, formData, token);
            setUploadProgress(100);

            // Kalau sedang di dalam folder, assign folderId ke semua asset yang baru diupload
            if (activeFolderId && uploadRes.success) {
                const newAssets: any[] = uploadRes.data?.assets ?? uploadRes.data ?? [];
                await Promise.all(
                    newAssets.map((asset: any) =>
                        api.updateMediaAsset(orgId, asset.id, { folderId: activeFolderId }, token)
                    )
                );
            }

            setSuccess(`${files.length} file(s) uploaded!`);
            await Promise.all([loadMedia(activeFolderId), loadUsageData()]);
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            if (e.message?.includes('limit')) { setError(e.message); setTimeout(() => router.push('/billing/plans'), 2000); }
            else setError(e.message || 'Upload failed');
        } finally {
            setIsUploading(false); setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteMedia = async (assetId: string) => {
        if (!confirm('Delete this file permanently?')) return;
        try {
            const token = getToken(); if (!token) return;
            await api.deleteMediaAsset(orgId, assetId, token);
            setSuccess('File deleted');
            setSelectedMedia(prev => prev.filter(id => id !== assetId));
            if (detailAsset?.id === assetId) setDetailAsset(null);
            await Promise.all([loadMedia(activeFolderId), loadUsageData()]);
            setTimeout(() => setSuccess(null), 2000);
        } catch { setError('Delete failed'); }
    };

    const handleBulkDelete = async () => {
        if (!selectedMedia.length || !confirm(`Delete ${selectedMedia.length} file(s)?`)) return;
        try {
            const token = getToken(); if (!token) return;
            await api.bulkDeleteMediaAssets(orgId, selectedMedia, token);
            setSuccess(`${selectedMedia.length} file(s) deleted`);
            setSelectedMedia([]);
            await Promise.all([loadMedia(activeFolderId), loadUsageData()]);
            setTimeout(() => setSuccess(null), 2000);
        } catch { setError('Bulk delete failed'); }
    };

    const handleSaveMetadata = async (assetId: string, data: Record<string, any>) => {
        try {
            const token = getToken(); if (!token) return;
            await api.updateMediaAsset(orgId, assetId, data, token);
            setSuccess('Asset updated!');
            await loadMedia(activeFolderId);
            setTimeout(() => setSuccess(null), 2000);
        } catch { setError('Failed to save metadata'); }
    };

    const handleReplaceFile = async (assetId: string, file: File) => {
        try {
            const token = getToken(); if (!token) return;
            const formData = new FormData();
            formData.append('file', file);
            await api.replaceMediaAsset(orgId, assetId, formData, token);
            setSuccess('File replaced!');
            await loadMedia(activeFolderId);
            setTimeout(() => setSuccess(null), 2000);
        } catch { setError('Replace failed'); }
    };

    const copyUrl = (url: string, assetId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url).then(() => { setCopiedUrl(assetId); setTimeout(() => setCopiedUrl(null), 1500); });
    };

    const toggleSelect = (assetId: string) =>
        setSelectedMedia(prev => prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]);

    const handleOpenFolder = (folderId: string) => {
        setActiveFolderId(folderId); setSelectedMedia([]); loadMedia(folderId);
    };

    const handleBackToRoot = () => {
        setActiveFolderId(null); setSelectedMedia([]); loadMedia(null);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const token = getToken(); if (!token) return;
            const res = await api.createMediaFolder(orgId, { name: newFolderName.trim() }, token);
            if (res.success) { setSuccess('Folder created!'); await loadFolders(); setTimeout(() => setSuccess(null), 2000); }
        } catch { setError('Failed to create folder'); }
        setNewFolderName(''); setShowCreateFolder(false);
    };

    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        if (!confirm(`Delete folder "${folderName}"? Assets inside will be moved to root.`)) return;
        try {
            const token = getToken(); if (!token) return;
            await api.deleteMediaFolder(orgId, folderId, token);
            setSuccess('Folder deleted');
            if (activeFolderId === folderId) handleBackToRoot();
            await loadFolders();
            setTimeout(() => setSuccess(null), 2000);
        } catch { setError('Failed to delete folder'); }
    };

    const filteredMedia = useMemo(() => {
        let list = [...media];
        // Client-side folder filter sebagai fallback kalau API tidak support folderId query
        if (activeFolderId) {
            const hasServerFilter = list.every(m => (m as any).folderId === activeFolderId || !(m as any).folderId);
            if (!hasServerFilter) list = list.filter(m => (m as any).folderId === activeFolderId);
        } else {
            // Root: tampilkan asset yang tidak punya folderId
            list = list.filter(m => !(m as any).folderId);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(m => (m.title || '').toLowerCase().includes(q) || (m.fileName || '').toLowerCase().includes(q));
        }
        if (filterType !== 'all') {
            list = list.filter(m => {
                const mt = (m.mimeType || '').toLowerCase();
                if (filterType === 'image') return mt.startsWith('image/');
                if (filterType === 'video') return mt.startsWith('video/');
                if (filterType === 'document') return mt.includes('pdf') || mt.includes('doc') || mt.includes('text');
                return true;
            });
        }
        list.sort((a, b) => {
            if (sortOption === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortOption === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortOption === 'name-asc') return (a.title || '').localeCompare(b.title || '');
            if (sortOption === 'name-desc') return (b.title || '').localeCompare(a.title || '');
            if (sortOption === 'size-desc') return (b.fileSize || 0) - (a.fileSize || 0);
            return 0;
        });
        return list;
    }, [media, searchQuery, filterType, sortOption, activeFolderId]);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
        return `${(bytes / 1073741824).toFixed(2)} GB`;
    };

    const getFileIcon = (type: string) => {
        if ((type || '').startsWith('image/')) return '🖼️';
        if ((type || '').startsWith('video/')) return '🎥';
        if ((type || '').includes('pdf')) return '📄';
        return '📁';
    };

    const sortOptions: { key: SortOption; label: string }[] = [
        { key: 'newest', label: 'Newest first' },
        { key: 'oldest', label: 'Oldest first' },
        { key: 'name-asc', label: 'Name A → Z' },
        { key: 'name-desc', label: 'Name Z → A' },
        { key: 'size-desc', label: 'Largest first' },
    ];

    const bg = darkMode ? '#1E1E2E' : '#F5F7FA';
    const panelBg = darkMode ? '#2D2D3F' : '#FFFFFF';
    const border = darkMode ? '#3F3F52' : '#E2E8F0';
    const textMain = darkMode ? '#E0E0E0' : '#1A1A1A';
    const textSub = darkMode ? '#94A3B8' : '#666';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: COLORS.primary }} />
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: bg, color: textMain }}>

            <MainSidebar darkMode={darkMode} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} onLogout={handleLogout} />
            <ProjectSidebar
                projectName="Project" projectId={projectId} orgId={orgId}
                darkMode={darkMode} currentPath={currentPath}
                singlePages={singlePages} multiplePages={multiplePages} components={components}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b shrink-0"
                    style={{ backgroundColor: panelBg, borderColor: border }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()}
                                className="p-2 rounded-lg transition-all" style={{ color: textSub }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-xs mb-1" style={{ color: textSub }}>Project / Media Assets</p>
                                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Media Assets</h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowCreateFolder(true)}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg"
                                style={{ backgroundColor: COLORS.accent }}>
                                <FolderPlus size={16} /> New Folder
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                style={{ backgroundColor: COLORS.primary }}>
                                <Plus size={16} />
                                {isUploading ? `Uploading ${uploadProgress}%` : 'Add assets'}
                            </button>
                            <button onClick={handleDarkModeToggle} className="p-2.5 rounded-lg"
                                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div className="relative" ref={profileRef}>
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg"
                                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: textMain }}>
                                    <ProfilePhoto size="small" primaryColor={COLORS.primary} />
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-xs" style={{ color: textSub }}>Welcome back</span>
                                        <span className="font-semibold text-sm">{user?.fullName}</span>
                                    </div>
                                    <ChevronDown size={16} style={{ color: textSub, transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50"
                                        style={{ backgroundColor: panelBg, borderColor: border }}>
                                        {[
                                            { label: 'Plan and Billing', path: '/billing', icon: CreditCard },
                                            { label: 'Settings', path: '/settings', icon: Settings },
                                        ].map(it => (
                                            <button key={it.path} onClick={() => { setShowProfileMenu(false); router.push(it.path); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left" style={{ color: textSub }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                <it.icon size={18} style={{ color: COLORS.info }} /><span className="text-sm">{it.label}</span>
                                            </button>
                                        ))}
                                        <div className="border-t mt-2 pt-2" style={{ borderColor: border }}>
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Alerts */}
                    {error && (
                        <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ backgroundColor: darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2', borderLeft: `4px solid ${COLORS.error}` }}>
                            <AlertCircle size={20} style={{ color: COLORS.error }} />
                            <p className="text-sm flex-1" style={{ color: COLORS.error }}>{error}</p>
                            <button onClick={() => setError(null)} style={{ color: COLORS.error }}><X size={16} /></button>
                        </div>
                    )}
                    {success && (
                        <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ backgroundColor: darkMode ? 'rgba(56,192,168,0.1)' : '#D1FAE5', borderLeft: `4px solid ${COLORS.success}` }}>
                            <CheckCircle size={20} style={{ color: COLORS.success }} />
                            <p className="text-sm" style={{ color: COLORS.success }}>{success}</p>
                        </div>
                    )}

                    {/* Create Folder Modal */}
                    {showCreateFolder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                            onClick={e => { if (e.target === e.currentTarget) setShowCreateFolder(false); }}>
                            <div className="rounded-2xl p-6 w-80 shadow-2xl border"
                                style={{ backgroundColor: panelBg, borderColor: border }}>
                                <h3 className="text-lg font-bold mb-4" style={{ color: textMain }}>Create New Folder</h3>
                                <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="Folder name..."
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none mb-4"
                                    style={{ borderColor: border, backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: textMain }}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }} />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowCreateFolder(false)} className="flex-1 py-2 rounded-lg border text-sm font-semibold"
                                        style={{ borderColor: border, color: textSub }}>Cancel</button>
                                    <button onClick={handleCreateFolder} className="flex-1 py-2 rounded-lg text-white text-sm font-semibold"
                                        style={{ backgroundColor: COLORS.accent }}>Create</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="rounded-xl mb-4 px-4 py-3 relative"
                        style={{ backgroundColor: darkMode ? '#23233A' : '#F0F2F5', border: `1px solid ${border}` }}>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative flex items-center">
                                <Search size={15} className="absolute left-3 pointer-events-none" style={{ color: textSub }} />
                                <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', color: textMain, border: 'none' }} />
                            </div>
                            <div className="relative" ref={sortDropdownRef}>
                                <button onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                                    style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', color: textMain }}>
                                    <ArrowUpDown size={14} />
                                    <span>{sortOptions.find(s => s.key === sortOption)?.label}</span>
                                    <ChevronDown size={13} style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute right-0 mt-1 w-40 rounded-lg shadow-lg border py-1 z-50"
                                        style={{ backgroundColor: panelBg, borderColor: border }}>
                                        {sortOptions.map(s => (
                                            <button key={s.key} onClick={() => { setSortOption(s.key); setShowSortDropdown(false); }}
                                                className="w-full text-left px-4 py-2 text-xs transition"
                                                style={{ color: sortOption === s.key ? COLORS.primary : textSub, fontWeight: sortOption === s.key ? 600 : 400 }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex rounded-lg overflow-hidden" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                                <button onClick={() => setViewMode('grid')} className="p-2 transition"
                                    style={{ backgroundColor: viewMode === 'grid' ? COLORS.primary : 'transparent', color: viewMode === 'grid' ? '#fff' : textSub }}>
                                    <Grid size={16} />
                                </button>
                                <button onClick={() => setViewMode('list')} className="p-2 transition"
                                    style={{ backgroundColor: viewMode === 'list' ? COLORS.primary : 'transparent', color: viewMode === 'list' ? '#fff' : textSub }}>
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            {([
                                { key: 'all', label: 'All', icon: '📂', count: media.length },
                                { key: 'image', label: 'Images', icon: '🖼️', count: media.filter(m => (m.mimeType || '').startsWith('image/')).length },
                                { key: 'video', label: 'Videos', icon: '🎥', count: media.filter(m => (m.mimeType || '').startsWith('video/')).length },
                                { key: 'document', label: 'Documents', icon: '📄', count: media.filter(m => { const mt = (m.mimeType || '').toLowerCase(); return mt.includes('pdf') || mt.includes('doc') || mt.includes('text'); }).length },
                            ] as { key: FilterType; label: string; icon: string; count: number }[]).map(fb => (
                                <button key={fb.key} onClick={() => setFilterType(fb.key)}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition"
                                    style={{ backgroundColor: filterType === fb.key ? COLORS.primary : (darkMode ? '#2D2D3F' : '#FFFFFF'), color: filterType === fb.key ? '#fff' : textSub }}>
                                    <span>{fb.icon}</span><span>{fb.label}</span><span className="opacity-70">({fb.count})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bulk actions */}
                    {selectedMedia.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl"
                            style={{ backgroundColor: darkMode ? 'rgba(58,122,195,0.12)' : '#EFF6FF', border: `1px solid ${COLORS.primary}40` }}>
                            <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>{selectedMedia.length} selected</span>
                            <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: COLORS.error }}>
                                <Trash2 size={14} /> Delete Selected
                            </button>
                            <button onClick={() => setSelectedMedia([])} className="text-sm" style={{ color: textSub }}>Clear</button>
                        </div>
                    )}

                    {/* Folders Section */}
                    {!activeFolderId && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-xl font-bold" style={{ color: textMain }}>Folders</h3>
                                <span className="px-2.5 py-0.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: COLORS.accent }}>
                                    {foldersLoading ? '…' : folders.length}
                                </span>
                            </div>
                            {foldersLoading ? (
                                <div className="flex items-center gap-2 py-4" style={{ color: textSub }}>
                                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary }} />
                                    <span className="text-sm">Loading folders…</span>
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="rounded-xl py-10 text-center border" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB', borderColor: border }}>
                                    <Folder size={36} className="mx-auto mb-2" style={{ color: textSub }} />
                                    <p className="text-sm" style={{ color: textSub }}>No folders yet. Create one with the button above.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {folders.map(folder => (
                                        <FolderCard key={folder.id} folder={folder} darkMode={darkMode}
                                            onClick={() => handleOpenFolder(folder.id)}
                                            onDelete={() => handleDeleteFolder(folder.id, folder.name)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assets Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            {activeFolderId && (
                                <button onClick={handleBackToRoot}
                                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition"
                                    style={{ color: COLORS.primary, backgroundColor: darkMode ? 'rgba(58,122,195,0.1)' : '#EFF6FF' }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                    <ArrowLeft size={14} /> Back
                                </button>
                            )}
                            <h3 className="text-xl font-bold" style={{ color: textMain }}>
                                {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name || 'Folder' : 'Assets'}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: COLORS.accent }}>
                                {filteredMedia.length}
                            </span>
                        </div>

                        {filteredMedia.length === 0 && (
                            <div className="rounded-xl p-16 text-center border" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#F9FAFB', borderColor: border }}>
                                <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                    <ImageIcon size={40} style={{ color: textSub }} />
                                </div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: textMain }}>
                                    {media.length === 0 ? 'No media files yet' : 'No results match your filter'}
                                </h3>
                                <p className="text-sm mb-5" style={{ color: textSub }}>
                                    {media.length === 0 ? 'Upload your first file to get started.' : 'Try adjusting your search or filter.'}
                                </p>
                                {media.length === 0 && (
                                    <button onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg"
                                        style={{ backgroundColor: COLORS.secondary }}>
                                        <Upload size={18} /> Upload Files
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Grid View */}
                        {filteredMedia.length > 0 && viewMode === 'grid' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredMedia.map(item => (
                                    <AssetCard key={item.id} item={item} darkMode={darkMode}
                                        selected={selectedMedia.includes(item.id)}
                                        onSelect={() => toggleSelect(item.id)}
                                        onClick={() => setDetailAsset(item)}
                                        onDelete={() => handleDeleteMedia(item.id)}
                                        onDownload={() => { const a = document.createElement('a'); a.href = `${BACKEND_URL}${item.fileUrl}`; a.download = item.fileName; a.click(); }}
                                        onCopyUrl={(e: React.MouseEvent) => copyUrl(`${BACKEND_URL}${item.fileUrl}`, item.id, e)}
                                        copiedUrl={copiedUrl === item.id}
                                    />
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {filteredMedia.length > 0 && viewMode === 'list' && (
                            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                                <div className="flex items-center px-4 py-3 border-b" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#F8FAFC', borderColor: border }}>
                                    <input type="checkbox"
                                        checked={filteredMedia.length > 0 && filteredMedia.every(m => selectedMedia.includes(m.id))}
                                        onChange={() => {
                                            const allFiltered = filteredMedia.map(m => m.id);
                                            const allSelected = allFiltered.every(id => selectedMedia.includes(id));
                                            setSelectedMedia(allSelected ? selectedMedia.filter(id => !allFiltered.includes(id)) : [...new Set([...selectedMedia, ...allFiltered])]);
                                        }}
                                        className="w-4 h-4 mr-4 cursor-pointer" style={{ accentColor: COLORS.primary }} />
                                    {['Name', 'Type', 'Size', ''].map(col => (
                                        <span key={col} className={`text-xs font-semibold ${col === 'Name' ? 'flex-1' : col === '' ? 'w-32' : 'w-24 text-right'}`} style={{ color: textSub }}>{col}</span>
                                    ))}
                                </div>
                                {filteredMedia.map(item => (
                                    <div key={item.id}
                                        className="flex items-center px-4 py-3 border-b group cursor-pointer transition"
                                        style={{ borderColor: border, backgroundColor: selectedMedia.includes(item.id) ? (darkMode ? 'rgba(58,122,195,0.1)' : '#EFF6FF') : (darkMode ? '#1E1E2E' : '#FFFFFF') }}
                                        onClick={() => setDetailAsset(item)}
                                        onMouseEnter={e => { if (!selectedMedia.includes(item.id)) e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F8FAFC'; }}
                                        onMouseLeave={e => { if (!selectedMedia.includes(item.id)) e.currentTarget.style.backgroundColor = darkMode ? '#1E1E2E' : '#FFFFFF'; }}>
                                        <input type="checkbox" checked={selectedMedia.includes(item.id)} readOnly
                                            onClick={e => { e.stopPropagation(); toggleSelect(item.id); }}
                                            className="w-4 h-4 mr-4 cursor-pointer" style={{ accentColor: COLORS.primary }} />
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9' }}>
                                                {(item.mimeType || '').startsWith('image/') && item.fileUrl
                                                    ? <img src={`${BACKEND_URL}${item.fileUrl}`} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    : <span className="text-lg">{getFileIcon(item.mimeType)}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: textMain }}>{item.title}</p>
                                                <p className="text-xs" style={{ color: textSub }}>{item.fileName}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs w-24 text-right" style={{ color: textSub }}>{(item.mimeType || '').split('/')[1]?.toUpperCase() || '—'}</span>
                                        <span className="text-xs w-24 text-right" style={{ color: textSub }}>{formatFileSize(item.fileSize || 0)}</span>
                                        <div className="w-32 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {[
                                                { title: 'Details', icon: <Eye size={16} />, color: COLORS.primary, action: (e: React.MouseEvent) => { e.stopPropagation(); setDetailAsset(item); } },
                                                { title: 'Download', icon: <Download size={16} />, color: textSub, action: (e: React.MouseEvent) => { e.stopPropagation(); const a = document.createElement('a'); a.href = `${BACKEND_URL}${item.fileUrl}`; a.download = item.fileName; a.click(); } },
                                                { title: 'Copy URL', icon: <Copy size={16} />, color: copiedUrl === item.id ? COLORS.success : textSub, action: (e: React.MouseEvent) => copyUrl(`${BACKEND_URL}${item.fileUrl}`, item.id, e) },
                                                { title: 'Delete', icon: <Trash2 size={16} />, color: COLORS.error, action: (e: React.MouseEvent) => { e.stopPropagation(); handleDeleteMedia(item.id); } },
                                            ].map(btn => (
                                                <button key={btn.title} onClick={btn.action} className="p-1.5 rounded-lg transition" style={{ color: btn.color }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }} title={btn.title}>
                                                    {btn.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {detailAsset && (
                <DetailModal
                    asset={detailAsset} darkMode={darkMode} currentUser={user} folders={folders}
                    onClose={() => setDetailAsset(null)}
                    onSave={handleSaveMetadata}
                    onReplace={handleReplaceFile}
                    onDelete={async (id) => { await handleDeleteMedia(id); setDetailAsset(null); }}
                />
            )}
        </div>
    );
}