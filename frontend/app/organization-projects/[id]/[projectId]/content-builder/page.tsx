'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Sun, Moon, ChevronDown, LogOut, CreditCard, Settings, ArrowLeft,
  X, Plus, Trash2,
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

export default function ContentBuilderPage() {
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'single' | 'multiple' | 'component'; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  /* ── delete handler ── */
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      const token = getToken()!;
      if (deleteConfirm.type === 'single') await api.deleteSinglePage(deleteConfirm.id, token);
      else if (deleteConfirm.type === 'multiple') await api.deleteMultiplePage(deleteConfirm.id, token);
      else await api.deleteComponent(deleteConfirm.id, token);
      setDeleteConfirm(null);
      loadData();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  /* ── navigate to create pages ── */
  const goCreate = (type: 'single' | 'multiple' | 'component') => {
    const base = `/organization-projects/${orgId}/${projectId}/content-builder`;
    if (type === 'single') router.push(`${base}/single-page/create`);
    if (type === 'multiple') router.push(`${base}/multiple-page/create`);
    if (type === 'component') router.push(`${base}/component/create`);
  };

  const typeLabel = (t: string) =>
    t === 'single' ? 'Single Page' : t === 'multiple' ? 'Multiple Page' : 'Component';

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
              <button onClick={() => router.back()}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Project / Content Builder</p>
                <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Content Builder</h2>
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
              <h2 className="text-3xl font-bold mb-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Content Builder</h2>
              <p className="text-lg mb-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Build your first layout.</p>
              <p className="text-sm mb-6" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                The Content Builder allows you to visually create and structure your page using flexible and customizable components.
                It supports various content types to suit your project needs.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { title: '• Single Page', desc: 'Use this when the layout is connected to only one content entry. Suitable for pages like "Home" or "Profile".' },
                  { title: '• Multiple Page', desc: 'Designed for dynamic collections such as blog posts or product listings. Design once, display multiple entries.' },
                  { title: '• Component', desc: 'Reusable visual components like text sections or images that can be arranged freely to match your desired structure.' },
                ].map(item => (
                  <div key={item.title}>
                    <strong className="text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{item.title}</strong>
                    <p className="text-sm mt-0.5 ml-3" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'Create Single Page', color: COLORS.primary, type: 'single' as const },
                  { label: 'Create Multiple Page', color: COLORS.secondary, type: 'multiple' as const },
                  { label: 'Create Component', color: COLORS.accent, type: 'component' as const },
                ].map(btn => (
                  <button key={btn.type} onClick={() => goCreate(btn.type)}
                    className="px-5 py-2.5 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                    style={{ backgroundColor: btn.color }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                    <Plus size={16} /> {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── delete confirm modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border"
            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                <Trash2 size={18} style={{ color: COLORS.error }} />
              </div>
              <h3 className="text-lg font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                Delete "{deleteConfirm.name}"?
              </h3>
            </div>
            <p className="text-sm mb-5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
              This will permanently delete this {typeLabel(deleteConfirm.type)} and all its fields. This action <strong>cannot be undone</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                className="flex-1 py-2.5 font-medium rounded-lg transition"
                style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', color: darkMode ? '#E0E0E0' : '#64748B' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
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