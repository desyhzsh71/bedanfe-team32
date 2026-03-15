'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    LogOut,
    Sun,
    Moon,
    CreditCard,
    Settings,
    ChevronDown,
    User,
    Camera,
    Mail,
    Briefcase,
    Building2,
    MapPin,
    LayoutDashboard,
    FolderOpen,
    FileText,
    Layers,
    GitPullRequest,
    Image,
    Plug,
    Bell,
    Menu,
    X
} from 'lucide-react';
import { getUser, logout, validateAuth, saveUser } from '../lib/auth';
import Logo from '../components/Logo';
import ProfilePhoto from '../components/ProfilePhoto';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import api from '../lib/api';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('Settings');
    const [darkMode, setDarkMode] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { profilePhoto: currentProfilePhoto, refreshPhoto } = useProfilePhoto();
    const [profilePhoto, setProfilePhoto] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<any>(null);
    const [countries, setCountries] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        setProfilePhoto(currentProfilePhoto);
    }, [currentProfilePhoto]);

    const colors = {
        primary: '#3A7AC3',
        secondary: '#38C0A8',
        accent: '#534581',
        error: '#F93232',
        warning: '#FFC973',
        success: '#38C0A8',
        info: '#3A7AC3',
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Organization Projects', path: '/organization-projects', icon: Building2 },
        { name: 'Personal Projects', path: '/personal-projects', icon: FolderOpen },
        { name: 'Plan & Billing', path: '/billing', icon: CreditCard },
        { name: 'Notification', path: '/invitations', icon: Bell },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    // dark mode
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        applyDarkMode(savedDarkMode);
    }, []);

    const applyDarkMode = (isDark: boolean) => {
        const html = document.documentElement;
        isDark ? html.classList.add('dark') : html.classList.remove('dark');
    };

    const handleDarkModeToggle = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', String(newDarkMode));
        applyDarkMode(newDarkMode);
    };

    useEffect(() => {
        if (!validateAuth()) {
            router.push('/login');
            return;
        }
        const userData = getUser();
        if (userData) {
            setUser(userData);
            setEditedUser(userData);
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await api.getCountries();
                if (response.success && Array.isArray(response.data)) {
                    setCountries(response.data);
                }
            } catch (err) {
                console.error('Error fetching countries:', err);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            router.push('/login');
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (user?.id) {
                    localStorage.setItem(`profilePhoto_${user.id}`, base64String);
                    refreshPhoto();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        if (confirm('Are you sure you want to remove your profile photo?')) {
            if (user?.id) {
                localStorage.removeItem(`profilePhoto_${user.id}`);
                refreshPhoto();
            }
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setEditedUser(user);
            setSaveMessage(null);
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field: string, value: string) => {
        setEditedUser((prev: any) => ({
            ...prev,
            [field]: value
        }));
        setSaveMessage(null);
    };

    const handleSave = () => {
        if (!editedUser.fullName || !editedUser.email || !editedUser.company || !editedUser.job || !editedUser.country) {
            setSaveMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedUser.email)) {
            setSaveMessage({ type: 'error', text: 'Please enter a valid email address' });
            return;
        }

        setSaving(true);

        setTimeout(() => {
            saveUser(editedUser);
            setUser(editedUser);
            setIsEditing(false);
            setSaving(false);
            setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });

            setTimeout(() => {
                setSaveMessage(null);
            }, 3000);
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colors.primary }}></div>
                    <p style={{ color: darkMode ? '#E0E0E0' : '#64748B' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen"
            style={{
                backgroundColor: darkMode ? '#1E1E2E' : '#F5F7FA',
                color: darkMode ? '#E0E0E0' : '#1E293B',
            }}>
            {/* Sidebar */}
            <div
                className="sticky top-0 h-screen overflow-y-auto transition-all duration-300"
                style={{
                    width: sidebarCollapsed ? '80px' : '260px',
                    backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    borderRight: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                }}>
                <div className="p-6 border-b sticky top-0 z-10"
                    style={{
                        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                    }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo size="small" variant={darkMode ? "alt" : "main"} />
                            {!sidebarCollapsed && (
                                <h1 className="text-xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    CMS
                                </h1>
                            )}
                        </div>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg hover:bg-opacity-10 transition-all"
                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    </div>
                </div>

                <nav className="p-4">
                    {menuItems.map((item) => {
                        const isActive = activeMenu === item.name;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.name}
                                onClick={() => { setActiveMenu(item.name); router.push(item.path); }}
                                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-left transition-all duration-200"
                                style={{
                                    backgroundColor: isActive ? colors.primary : 'transparent',
                                    color: isActive ? '#FFFFFF' : darkMode ? '#94A3B8' : '#64748B',
                                    fontWeight: isActive ? '600' : '400',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                <Icon size={20} />
                                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
                            </button>
                        );
                    })}

                    {/* Divider + Info */}
                    {!sidebarCollapsed && (
                        <div className="mt-6 mb-4 px-4">
                            <div className="border-t pt-4" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                    PROJECT TOOLS
                                </p>
                                <p className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Enter a project to access Content Builder, Workflow, and other tools
                                </p>
                            </div>
                        </div>
                    )}
                </nav>

                {!sidebarCollapsed && (
                    <div className="absolute bottom-0 w-full p-4 border-t"
                        style={{
                            borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        }}>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200"
                            style={{ color: colors.error }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                            <LogOut size={20} />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b transition-colors duration-300"
                    style={{
                        backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                    }}>
                    <div className="px-8 py-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs mb-1" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                Pages / Settings
                            </p>
                            <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                Settings
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDarkModeToggle}
                                className="p-2.5 rounded-lg transition-all duration-200"
                                style={{
                                    backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                    color: darkMode ? '#E0E0E0' : '#64748B',
                                }}
                                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200"
                                    style={{
                                        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                        color: darkMode ? '#E0E0E0' : '#1E293B',
                                    }}>
                                    <ProfilePhoto size="small" primaryColor={colors.primary} />
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-xs" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                            Welcome back
                                        </span>
                                        <span className="font-semibold text-sm">{user?.fullName}</span>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        style={{
                                            color: darkMode ? '#64748B' : '#94A3B8',
                                            transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s'
                                        }}
                                    />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50"
                                        style={{
                                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                                            borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
                                        }}>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setActiveMenu('Plan & Billing'); router.push('/billing'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <CreditCard size={18} style={{ color: colors.info }} />
                                            <span className="text-sm">Plan and Billing</span>
                                        </button>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setActiveMenu('Settings'); router.push('/settings'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                                            style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}>
                                            <Settings size={18} />
                                            <span className="text-sm">Settings</span>
                                        </button>
                                        <div className="border-t mt-2 pt-2"
                                            style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                                            <button
                                                onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                                                style={{ color: colors.error }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}>
                                                <LogOut size={18} />
                                                <span className="text-sm font-medium">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                            Account Settings
                        </h2>
                        <div className="flex items-center gap-3">
                            {saveMessage && (
                                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${saveMessage.type === 'success'
                                    ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                                    : darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {saveMessage.text}
                                </div>
                            )}
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleEditToggle}
                                        disabled={saving}
                                        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                                        style={{
                                            border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            color: darkMode ? '#94A3B8' : '#64748B',
                                        }}
                                        onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = darkMode ? '#3F3F52' : '#F1F5F9')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 hover:opacity-90"
                                        style={{ backgroundColor: colors.success }}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEditToggle}
                                    className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90"
                                    style={{ backgroundColor: colors.primary }}>
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="rounded-xl p-8 mb-6 transition-all duration-300"
                        style={{
                            backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                        }}>
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <User size={20} style={{ color: colors.primary }} />
                            <span style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>Profile Information</span>
                        </h3>

                        <div className="flex items-start gap-8">
                            {/* Profile Photo */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full object-cover border-4 transition-all duration-200"
                                            style={{ borderColor: colors.primary }}
                                        />
                                    ) : (
                                        <div
                                            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4"
                                            style={{
                                                backgroundColor: colors.primary,
                                                borderColor: colors.primary
                                            }}>
                                            {user?.fullName?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                    <button
                                        onClick={handlePhotoClick}
                                        className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                        style={{ backgroundColor: colors.secondary }}
                                        title="Change photo">
                                        <Camera size={18} className="text-white" />
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                                {profilePhoto && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        className="text-xs px-3 py-1 rounded-full transition-all duration-200"
                                        style={{
                                            color: colors.error,
                                            backgroundColor: darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FEE2E2'
                                        }}>
                                        Remove Photo
                                    </button>
                                )}
                                <p className="text-xs text-center" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                    Max 2MB, JPG/PNG
                                </p>
                            </div>

                            {/* User Details */}
                            <div className="flex-1 grid grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        <User size={16} />
                                        Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedUser?.fullName || ''}
                                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                                color: darkMode ? '#E0E0E0' : '#1E293B',
                                            }}
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 rounded-lg"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            }}>
                                            <p className="font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {user?.fullName || '-'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        <Mail size={16} />
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editedUser?.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                                color: darkMode ? '#E0E0E0' : '#1E293B',
                                            }}
                                            placeholder="Enter your email"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 rounded-lg"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            }}>
                                            <p className="font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {user?.email || '-'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        <Building2 size={16} />
                                        Company
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedUser?.company || ''}
                                            onChange={(e) => handleInputChange('company', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                                color: darkMode ? '#E0E0E0' : '#1E293B',
                                            }}
                                            placeholder="Enter your company"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 rounded-lg"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            }}>
                                            <p className="font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {user?.company || '-'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Job */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        <Briefcase size={16} />
                                        Job Title
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedUser?.job || ''}
                                            onChange={(e) => handleInputChange('job', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                                color: darkMode ? '#E0E0E0' : '#1E293B',
                                            }}
                                            placeholder="Enter your job title"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 rounded-lg"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            }}>
                                            <p className="font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {user?.job || '-'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Country */}
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                        <MapPin size={16} />
                                        Country
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editedUser?.country || ''}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                                color: darkMode ? '#E0E0E0' : '#1E293B',
                                            }}>
                                            <option value="">Select a country</option>
                                            {countries.map((country) => (
                                                <option key={country} value={country}>
                                                    {country}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="px-4 py-3 rounded-lg"
                                            style={{
                                                backgroundColor: darkMode ? '#1E1E2E' : '#F9FAFB',
                                                border: `2px solid ${darkMode ? '#3F3F52' : '#E2E8F0'}`,
                                            }}>
                                            <p className="font-medium" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                                {user?.country || '-'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}