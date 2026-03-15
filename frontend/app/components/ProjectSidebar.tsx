'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronDown, Search, FileText, Layers,
    Home, Menu, X, FolderOpen, GitPullRequest, 
    Image as ImageIcon, Plug, Puzzle
} from 'lucide-react';
import Logo from '@/app/components/Logo';

interface ContentItem {
    id: string;
    name: string;
}

interface ProjectSidebarProps {
    projectName: string;
    projectId: string;
    orgId: string;
    darkMode: boolean;
    currentPath?: string;
    singlePages?: ContentItem[];
    multiplePages?: ContentItem[];
    components?: ContentItem[];
}

const COLORS = {
    primary: '#3A7AC3',
    secondary: '#38C0A8',
    accent: '#534581',
};

export default function ProjectSidebar({
    projectName,
    projectId,
    orgId,
    darkMode,
    currentPath = '',
    singlePages = [],
    multiplePages = [],
    components = [],
}: ProjectSidebarProps) {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const base = `/organization-projects/${orgId}/${projectId}`;

    const p = {
        workflow: `${base}/workflow-approval`,
        wfCreate: `${base}/workflow-approval/create`,

        cbHome: `${base}/content-builder`,
        singleCreate: `${base}/content-builder/single-page/create`,
        singleView: (id: string) => `${base}/content-builder/single-page/${id}`,
        multipleCreate: `${base}/content-builder/multiple-page/create`,
        multiView: (id: string) => `${base}/content-builder/multiple-page/${id}`,
        compCreate: `${base}/content-builder/component/create`,
        compView: (id: string) => `${base}/content-builder/component/${id}`,

        cmHome: `${base}/content-management`,
        cmSingle: `${base}/content-management/single-page`,
        cmSingleView: (id: string) => `${base}/content-management/single-page/${id}`,
        cmMultiple: `${base}/content-management/multiple-page`,
        cmMultipleView: (id: string) => `${base}/content-management/multiple-page/${id}`,

        media: `${base}/media-assets`,
        api: `${base}/api-integration`,
    };

    const [expWF, setExpWF] = useState(currentPath.includes('/workflow-approval'));
    const [expCB, setExpCB] = useState(currentPath.includes('/content-builder'));
    const [expCM, setExpCM] = useState(currentPath.includes('/content-management'));

    // Content Builder expand 
    const [expSingle, setExpSingle] = useState(true);
    const [expMultiple, setExpMultiple] = useState(true);
    const [expComp, setExpComp] = useState(true);

    // Content Management expand 
    const [expCMSingle, setExpCMSingle] = useState(true);
    const [expCMMultiple, setExpCMMultiple] = useState(true);

    const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
    const go = (path: string) => router.push(path);
    const filter = (items: ContentItem[]) =>
        searchQuery ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) : items;

    const parentStyle = (active: boolean) => ({
        backgroundColor: active ? COLORS.primary : 'transparent',
        color: active ? '#FFFFFF' : darkMode ? '#94A3B8' : '#64748B',
    });
    const childStyle = (active: boolean) => ({
        backgroundColor: active ? `${COLORS.primary}20` : 'transparent',
        color: active ? COLORS.primary : darkMode ? '#94A3B8' : '#64748B',
        fontWeight: (active ? '600' : '400') as any,
    });
    const onHover = (e: React.MouseEvent<HTMLButtonElement>, active: boolean) => {
        if (!active) e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F1F5F9';
    };
    const offHover = (e: React.MouseEvent<HTMLButtonElement>, active: boolean) => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
    };

    const Chevron = ({ open }: { open: boolean }) => (
        <ChevronDown size={14} className="shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
    );

    const FileItem = ({ name, icon, viewPath }: { id: string; name: string; icon: string; viewPath: string }) => (
        <button onClick={() => go(viewPath)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
            style={childStyle(currentPath === viewPath)}
            onMouseEnter={e => onHover(e, currentPath === viewPath)}
            onMouseLeave={e => offHover(e, currentPath === viewPath)}>
            <span className="text-sm shrink-0">{icon}</span>
            <span className="text-xs truncate">{name}</span>
        </button>
    );

    const CreateBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
        <button onClick={onClick}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
            style={{ color: COLORS.primary, backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <span className="text-xs">{label}</span>
        </button>
    );

    const SectionHeader = ({ label, count, open, onToggle, Icon }: {
        label: string; count: number; open: boolean; onToggle: () => void; Icon: any;
    }) => (
        <button onClick={onToggle}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all"
            style={{ color: darkMode ? '#94A3B8' : '#64748B', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <Icon size={14} className="shrink-0" />
            <span className="text-xs font-semibold flex-1 truncate" style={{ color: darkMode ? '#E0E0E0' : '#374151' }}>
                {label}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full mr-1"
                style={{ backgroundColor: darkMode ? '#3F3F52' : '#DBEAFE', color: darkMode ? '#94A3B8' : '#2563EB' }}>
                {count}
            </span>
            <Chevron open={open} />
        </button>
    );

    return (
        <div
            className="sticky top-0 h-screen overflow-y-auto transition-all duration-300 shrink-0"
            style={{
                width: collapsed ? '60px' : '280px',
                backgroundColor: darkMode ? '#1A1A2E' : '#F8FAFC',
                borderRight: `1px solid ${darkMode ? '#2D2D3F' : '#E2E8F0'}`,
            }}>

            {/* HEADER */}
            <div className="p-4 border-b sticky top-0 z-10"
                style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0', backgroundColor: darkMode ? '#1A1A2E' : '#F8FAFC' }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Logo size="small" variant={darkMode ? "alt" : "main"} />
                        {!collapsed && (
                            <h2 className="font-bold text-sm truncate" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                {projectName}
                            </h2>
                        )}
                    </div>
                    <button onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg transition-all shrink-0"
                        style={{ color: darkMode ? '#94A3B8' : '#64748B', backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                        {collapsed ? <Menu size={16} /> : <X size={16} />}
                    </button>
                </div>
                {!collapsed && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14}
                            style={{ color: darkMode ? '#64748B' : '#94A3B8' }} />
                        <input type="text" placeholder="Search" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border outline-none"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', borderColor: darkMode ? '#2D2D3F' : '#E2E8F0', color: darkMode ? '#E0E0E0' : '#1E293B' }}
                            onFocus={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                            onBlur={e => { e.currentTarget.style.borderColor = darkMode ? '#2D2D3F' : '#E2E8F0'; }} />
                    </div>
                )}
            </div>

            {/* NAV */}
            <nav className="p-3 space-y-1">

                {/* WORKFLOW APPROVAL */}
                <div>
                    <button onClick={() => setExpWF(v => !v)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={parentStyle(isActive(p.workflow))}
                        onMouseEnter={e => onHover(e, isActive(p.workflow))}
                        onMouseLeave={e => offHover(e, isActive(p.workflow))}>
                        <GitPullRequest size={17} className="shrink-0" />
                        {!collapsed && <>
                            <span className="text-xs font-medium flex-1 truncate">Workflow Approval</span>
                            <Chevron open={expWF} />
                        </>}
                    </button>
                    {!collapsed && expWF && (
                        <div className="ml-3 mt-1 space-y-1 border-l-2 pl-3"
                            style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                            {[
                                { label: 'Home', path: p.workflow, Icon: Home },
                            ].map(item => (
                                <button key={item.path} onClick={() => go(item.path)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                                    style={childStyle(currentPath === item.path)}
                                    onMouseEnter={e => onHover(e, currentPath === item.path)}
                                    onMouseLeave={e => offHover(e, currentPath === item.path)}>
                                    <item.Icon size={15} className="shrink-0" />
                                    <span className="text-xs truncate">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* CONTENT BUILDER */}
                <div>
                    <button onClick={() => setExpCB(v => !v)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={parentStyle(false)}
                        onMouseEnter={e => onHover(e, false)}
                        onMouseLeave={e => offHover(e, false)}>
                        <Layers size={17} className="shrink-0" />
                        {!collapsed && <>
                            <span className="text-xs font-medium flex-1 truncate">Content Builder</span>
                            <Chevron open={expCB} />
                        </>}
                    </button>
                    {!collapsed && expCB && (
                        <div className="ml-3 mt-1 space-y-1 border-l-2 pl-3"
                            style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                            <button onClick={() => go(p.cbHome)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                                style={childStyle(currentPath === p.cbHome)}
                                onMouseEnter={e => onHover(e, currentPath === p.cbHome)}
                                onMouseLeave={e => offHover(e, currentPath === p.cbHome)}>
                                <Home size={15} className="shrink-0" />
                                <span className="text-xs truncate">Home</span>
                            </button>

                            <SectionHeader label="Single Page" count={singlePages.length}
                                open={expSingle} onToggle={() => setExpSingle(v => !v)} Icon={FileText} />
                            {expSingle && (
                                <div className="ml-3 space-y-0.5 border-l pl-2"
                                    style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                    {filter(singlePages).map(sp => (
                                        <FileItem key={sp.id} id={sp.id} name={sp.name} icon="📄" viewPath={p.singleView(sp.id)} />
                                    ))}
                                </div>
                            )}

                            <SectionHeader label="Multiple Page" count={multiplePages.length}
                                open={expMultiple} onToggle={() => setExpMultiple(v => !v)} Icon={FolderOpen} />
                            {expMultiple && (
                                <div className="ml-3 space-y-0.5 border-l pl-2"
                                    style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                    {filter(multiplePages).map(mp => (
                                        <FileItem key={mp.id} id={mp.id} name={mp.name} icon="📋" viewPath={p.multiView(mp.id)} />
                                    ))}
                                </div>
                            )}

                            <SectionHeader label="Component" count={components.length}
                                open={expComp} onToggle={() => setExpComp(v => !v)} Icon={Puzzle} />
                            {expComp && (
                                <div className="ml-3 space-y-0.5 border-l pl-2"
                                    style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                    {filter(components).map(c => (
                                        <FileItem key={c.id} id={c.id} name={c.name} icon="🧩" viewPath={p.compView(c.id)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CONTENT MANAGEMENT */}
                <div>
                    <button onClick={() => setExpCM(v => !v)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={parentStyle(false)}
                        onMouseEnter={e => onHover(e, false)}
                        onMouseLeave={e => offHover(e, false)}>
                        <FileText size={17} className="shrink-0" />
                        {!collapsed && <>
                            <span className="text-xs font-medium flex-1 truncate">Content Management</span>
                            <Chevron open={expCM} />
                        </>}
                    </button>
                    {!collapsed && expCM && (
                        <div className="ml-3 mt-1 space-y-1 border-l-2 pl-3"
                            style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>

                            {/* Home */}
                            <button onClick={() => go(p.cmHome)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                                style={childStyle(currentPath === p.cmHome)}
                                onMouseEnter={e => onHover(e, currentPath === p.cmHome)}
                                onMouseLeave={e => offHover(e, currentPath === p.cmHome)}>
                                <Home size={15} className="shrink-0" />
                                <span className="text-xs truncate">Home</span>
                            </button>

                            {/* Single Pages */}
                            <SectionHeader label="Single Pages" count={singlePages.length}
                                open={expCMSingle} onToggle={() => setExpCMSingle(v => !v)} Icon={FileText} />
                            {expCMSingle && (
                                <div className="ml-3 space-y-0.5 border-l pl-2"
                                    style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                    {filter(singlePages).map(sp => (
                                        <FileItem key={sp.id} id={sp.id} name={sp.name} icon="📄"
                                            viewPath={p.cmSingleView(sp.id)} />
                                    ))}
                                    {singlePages.length === 0 && (
                                        <p className="text-xs px-2 py-1.5 opacity-50"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            No single pages yet
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Multiple Pages */}
                            <SectionHeader label="Multiple Pages" count={multiplePages.length}
                                open={expCMMultiple} onToggle={() => setExpCMMultiple(v => !v)} Icon={FolderOpen} />
                            {expCMMultiple && (
                                <div className="ml-3 space-y-0.5 border-l pl-2"
                                    style={{ borderColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                    {filter(multiplePages).map(mp => (
                                        <FileItem key={mp.id} id={mp.id} name={mp.name} icon="📋"
                                            viewPath={p.cmMultipleView(mp.id)} />
                                    ))}
                                    {multiplePages.length === 0 && (
                                        <p className="text-xs px-2 py-1.5 opacity-50"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                            No multiple pages yet
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MEDIA ASSETS */}
                <button onClick={() => go(p.media)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={parentStyle(isActive(p.media))}
                    onMouseEnter={e => onHover(e, isActive(p.media))}
                    onMouseLeave={e => offHover(e, isActive(p.media))}>
                    <ImageIcon size={17} className="shrink-0" />
                    {!collapsed && <span className="text-xs font-medium truncate">Media Assets</span>}
                </button>

                {/* API INTEGRATION */}
                <button onClick={() => go(p.api)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={parentStyle(isActive(p.api))}
                    onMouseEnter={e => onHover(e, isActive(p.api))}
                    onMouseLeave={e => offHover(e, isActive(p.api))}>
                    <Plug size={17} className="shrink-0" />
                    {!collapsed && <span className="text-xs font-medium truncate">API Integration</span>}
                </button>

            </nav>
        </div>
    );
}