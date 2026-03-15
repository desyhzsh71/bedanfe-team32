'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUser } from '../lib/auth';

export const PROFILE_PHOTO_UPDATED = 'cms:profilePhotoUpdated';

export const useProfilePhoto = () => {
    const [profilePhoto, setProfilePhoto] = useState<string>('');
    const [user, setUser] = useState<any>(null);

    const loadPhoto = useCallback(() => {
        const userData = getUser();
        if (userData) {
            setUser(userData);
            const savedPhoto = localStorage.getItem(`profilePhoto_${userData.id}`);
            setProfilePhoto(savedPhoto || '');
        }
    }, []);

    useEffect(() => {
        loadPhoto();

        const handleCustomEvent = () => {
            loadPhoto();
        };
        window.addEventListener(PROFILE_PHOTO_UPDATED, handleCustomEvent);

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key?.startsWith('profilePhoto_')) {
                loadPhoto();
            }
        };
        window.addEventListener('storage', handleStorageEvent);

        return () => {
            window.removeEventListener(PROFILE_PHOTO_UPDATED, handleCustomEvent);
            window.removeEventListener('storage', handleStorageEvent);
        };
    }, [loadPhoto]);

    const refreshPhoto = useCallback(() => {
        loadPhoto();
        window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_UPDATED));
    }, [loadPhoto]);

    return { profilePhoto, user, refreshPhoto };
};