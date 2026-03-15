'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getToken, isAuthenticated, logout } from '../lib/auth';

export function usePageSetup() {
    const router = useRouter();
    const profileRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // dark mode
    useEffect(() => {
        const saved = localStorage.getItem('darkMode') === 'true';
        setDarkMode(saved);
        document.documentElement.classList.toggle('dark', saved);
    }, []);

    const handleDarkModeToggle = useCallback(() => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('darkMode', String(next));
            document.documentElement.classList.toggle('dark', next);
            return next;
        });
    }, []);

    // auth check
    const initAuth = useCallback(async (onSuccess: (token: string) => Promise<void>) => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        const userData = getUser();
        if (!userData) { router.push('/login'); return; }
        setUser(userData);

        const token = getToken();
        if (token) await onSuccess(token);

        setLoading(false);
    }, [router]);

    // close profile on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = useCallback(() => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    }, [router]);

    return {
        router,
        user,
        loading,
        setLoading,
        darkMode,
        handleDarkModeToggle,
        showProfileMenu,
        setShowProfileMenu,
        sidebarCollapsed,
        setSidebarCollapsed,
        profileRef,
        initAuth,
        handleLogout,
        getToken,
    };
}

// Warna dan menu — konstanta shared
export const COLORS = {
    primary: '#3A7AC3',
    secondary: '#38C0A8',
    accent: '#534581',
    error: '#F93232',
    warning: '#FFC973',
    success: '#38C0A8',
    info: '#3A7AC3',
} as const;

export const FIELD_TYPES = [
    { id: 'text', name: 'Text Field', icon: '📝', description: 'Short text like titles, names', color: '#8B5CF6' },
    { id: 'textarea', name: 'Textarea', icon: '📄', description: 'Long text content', color: '#F59E0B' },
    { id: 'richtext', name: 'Rich Text / Editor', icon: '✏️', description: 'Formatted text with bold, italic, links', color: '#3B82F6' },
    { id: 'media', name: 'Media Field', icon: '🖼️', description: 'Upload images, videos, documents', color: '#EC4899' },
    { id: 'number', name: 'Number Field', icon: '🔢', description: 'Numeric values', color: '#10B981' },
    { id: 'date', name: 'Date and Time', icon: '📅', description: 'Calendar inputs and time', color: '#06B6D4' },
    { id: 'select', name: 'Select / Dropdown', icon: '📋', description: 'Single choice from options', color: '#8B5CF6' },
    { id: 'relation', name: 'Relation', icon: '🔗', description: 'Link entities across content types', color: '#6366F1' },
] as const;

export const generateApiId = (text: string) =>
    text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_')
        .replace(/^_+|_+$/g, '');