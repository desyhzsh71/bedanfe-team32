'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import { api } from '../../lib/api';
import { getToken } from '../../lib/auth';
import { getBlogMultiplePageId } from '../../lib/blog-config';

interface BlogEntry {
    id: string;
    content: {
        id: {
            title: string;
            slug: string;
            excerpt: string;
            content: string;
            thumbnail: {
                url: string;
                filename: string;
            };
            category: string;
            author: {
                id: string;
                name: string;
                avatar?: string;
            };
        };
    };
    seo?: {
        id?: {
            metaTitle?: string;
            metaDescription?: string;
        };
    };
    published: boolean;
    publishedDate: string;
}

export default function BlogArticlePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [article, setArticle] = useState<BlogEntry | null>(null);
    const [loading, setLoading] = useState(true);

    // ⚠️ GANTI HANYA INI SAJA!
    const PROJECT_ID = 'your-project-id-here';
    const BLOG_PAGE_NAME = 'Blog Articles';

    useEffect(() => {
        if (slug) {
            fetchArticle();
        }
    }, [slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const token = getToken();

            if (!token) {
                router.push('/login');
                return;
            }

            // Auto-fetch Blog Page ID
            const blogPageId = await getBlogMultiplePageId(PROJECT_ID, BLOG_PAGE_NAME);

            // Fetch all entries and find by slug
            const response = await api.getEntriesByMultiplePage(
                blogPageId,
                token,
                {
                    published: true,
                    locale: 'id'
                }
            );

            if (response.success && response.data) {
                const foundArticle = response.data.find(
                    (entry: BlogEntry) => entry.content.id.slug === slug
                );

                if (foundArticle) {
                    setArticle(foundArticle);
                } else {
                    alert('Article not found');
                    router.push('/blog');
                }
            }
        } catch (error: any) {
            console.error('Error fetching article:', error);
            alert(error.message || 'Failed to load article');
            router.push('/blog');
        } finally {
            setLoading(false);
        }
    };

    // ... rest sama seperti sebelumnya

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading article...</p>
                </div>
            </div>
        );
    }

    if (!article) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ... sama seperti code sebelumnya ... */}
        </div>
    );
}