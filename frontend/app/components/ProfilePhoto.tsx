'use client';

import { useProfilePhoto } from '../hooks/useProfilePhoto';

interface ProfilePhotoProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
    primaryColor?: string;
}

export default function ProfilePhoto({
    size = 'medium',
    className = '',
    primaryColor = '#3A7AC3'
}: ProfilePhotoProps) {
    const { profilePhoto, user } = useProfilePhoto();

    const sizeClasses = {
        small: 'w-8 h-8 text-sm',
        medium: 'w-10 h-10 text-base',
        large: 'w-32 h-32 text-4xl'
    };

    return (
        <>
            {profilePhoto ? (
                <img
                    src={profilePhoto}
                    alt="Profile"
                    className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
                />
            ) : (
                <div
                    className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
                    style={{ backgroundColor: primaryColor }}>
                    {user?.fullName?.charAt(0) || 'A'}
                </div>
            )}
        </>
    );
}