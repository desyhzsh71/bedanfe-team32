import { api } from './api';
import { getToken } from './auth';

let blogConfigCache: {
    multiplePageId: string | null;
    projectId: string | null;
} = {
    multiplePageId: null,
    projectId: null,
};

export async function getBlogMultiplePageId(
    projectId: string,
    blogPageName: string = 'Blog Articles' // Default nama
): Promise<string> {
    // Return dari cache kalau sudah pernah fetch
    if (blogConfigCache.multiplePageId && blogConfigCache.projectId === projectId) {
        console.log('✅ Using cached Blog Page ID:', blogConfigCache.multiplePageId);
        return blogConfigCache.multiplePageId;
    }

    console.log('🔍 Fetching Blog Page ID for:', blogPageName);

    try {
        const token = getToken();
        if (!token) throw new Error('Not authenticated');

        // Fetch semua multiple pages dari project ini
        const response = await api.getMultiplePagesByProject(projectId, token);

        if (!response.success || !response.data) {
            throw new Error('Failed to fetch multiple pages');
        }

        console.log('📄 Available Multiple Pages:', response.data.map((p: any) => p.name));

        // Cari multiple page berdasarkan nama
        const blogPage = response.data.find(
            (page: any) => page.name === blogPageName
        );

        if (!blogPage) {
            throw new Error(
                `Multiple page "${blogPageName}" not found. Available: ${response.data.map((p: any) => p.name).join(', ')}`
            );
        }

        // Save ke cache
        blogConfigCache.multiplePageId = blogPage.id;
        blogConfigCache.projectId = projectId;

        console.log('✅ Found Blog Page ID:', blogPage.id);
        return blogPage.id;

    } catch (error) {
        console.error('❌ Error getting blog page ID:', error);
        throw error;
    }
}

export function clearBlogConfig() {
    blogConfigCache = {
        multiplePageId: null,
        projectId: null,
    };
    console.log('🗑️ Blog config cache cleared');
}