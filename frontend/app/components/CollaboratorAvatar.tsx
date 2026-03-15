'use client';

import { useEffect, useState } from 'react';

interface CollaboratorAvatarProps {
    userId: number;
    fullName: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    colorClass?: string;
}

export default function CollaboratorAvatar({ 
    userId, 
    fullName, 
    size = 'medium',
    className = '',
    colorClass = 'bg-blue-400'
}: CollaboratorAvatarProps) {
    const [profilePhoto, setProfilePhoto] = useState<string>('');

    useEffect(() => {
        const savedPhoto = localStorage.getItem(`profilePhoto_${userId}`);
        if (savedPhoto) {
            setProfilePhoto(savedPhoto);
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === `profilePhoto_${userId}`) {
                setProfilePhoto(e.newValue || '');
            }
        };

        const handleCustomStorageChange = () => {
            const savedPhoto = localStorage.getItem(`profilePhoto_${userId}`);
            setProfilePhoto(savedPhoto || '');
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storage', handleCustomStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storage', handleCustomStorageChange);
        };
    }, [userId]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const sizeClasses = {
        small: 'w-8 h-8 text-xs',
        medium: 'w-10 h-10 text-sm',
        large: 'w-12 h-12 text-base'
    };

    return (
        <>
            {profilePhoto ? (
                <img 
                    src={profilePhoto} 
                    alt={fullName}
                    className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
                />
            ) : (
                <div 
                    className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold ${className}`}>
                    {getInitials(fullName)}
                </div>
            )}
        </>
    );
}