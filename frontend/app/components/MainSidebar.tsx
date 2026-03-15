'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    Menu, X, LogOut, LayoutDashboard, Building2,
    FolderOpen, CreditCard, Bell, Settings,
} from 'lucide-react';
import Logo from '@/app/components/Logo';
import { COLORS } from '../hooks/usagePageSetup';

const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Organization Projects', path: '/organization-projects', icon: Building2 },
    { name: 'Personal Projects', path: '/personal-projects', icon: FolderOpen },
    { name: 'Plan & Billing', path: '/billing', icon: CreditCard },
    { name: 'Notification', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
];

interface MainSidebarProps {
    darkMode: boolean;
    collapsed: boolean;
    onCollapse: (v: boolean) => void;
    onLogout: () => void;
}

export default function MainSidebar({ darkMode, collapsed, onCollapse, onLogout }: MainSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const bg = darkMode ? '#2D2D3F' : '#FFFFFF';
    const border = darkMode ? '#3F3F52' : '#E2E8F0';

    return (
        <div
            className="sticky top-0 h-screen flex flex-col shrink-0 transition-all duration-300"
            style={{ width: collapsed ? '80px' : '260px', backgroundColor: bg, borderRight: `1px solid ${border}` }}
        >
            {/* ── logo ── */}
            <div
                className="p-6 border-b sticky top-0 z-10"
                style={{ borderColor: border, backgroundColor: bg }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size="small" variant="alt" />
                        {!collapsed && (
                            <h1 className="text-xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>CMS</h1>
                        )}
                    </div>
                    <button
                        onClick={() => onCollapse(!collapsed)}
                        className="p-2 rounded-lg"
                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                    >
                        {collapsed ? <Menu size={20} /> : <X size={20} />}
                    </button>
                </div>
            </div>

            {/* ── nav ── */}
            <nav className="flex-1 p-4 overflow-y-auto">
                {menuItems.map(item => {
                    const isActive = pathname?.startsWith(item.path) ?? false;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.name}
                            onClick={() => router.push(item.path)}
                            className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-left transition-all"
                            style={{
                                backgroundColor: isActive ? COLORS.primary : 'transparent',
                                color: isActive ? '#FFF' : darkMode ? '#94A3B8' : '#64748B',
                                fontWeight: isActive ? '600' : '400',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <Icon size={20} />
                            {!collapsed && <span className="text-sm">{item.name}</span>}
                        </button>
                    );
                })}

                {!collapsed && (
                    <div className="mt-6 px-4 border-t pt-4" style={{ borderColor: border }}>
                        <p className="text-xs font-medium mb-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>PROJECT TOOLS</p>
                        <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                            Content Builder, Workflow, dan tools lainnya tersedia di dalam project
                        </p>
                    </div>
                )}
            </nav>

            {/* ── logout ── */}
            {!collapsed && (
                <div className="p-4 border-t" style={{ borderColor: border, backgroundColor: bg }}>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                        style={{ color: COLORS.error }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <LogOut size={20} />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}