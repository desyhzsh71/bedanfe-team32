'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';
import { getBlogMultiplePageId } from '../lib/blog-config';

interface BlogEntry {
  id: string;
  content: {
    id: {
      title: string;
      slug: string;
      excerpt: string;
      thumbnail: {
        url: string;
        filename: string;
      };
      category: string;
      author: {
        id: string;
        name: string;
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

export default function BlogPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ⚠️ GANTI HANYA INI SAJA!
  const PROJECT_ID = 'your-project-id-here';
  const BLOG_PAGE_NAME = 'Blog Articles'; // Nama multiple page di CMS

  useEffect(() => {
    initBlog();
  }, []);

  const initBlog = async () => {
    try {
      setLoading(true);

      // Auto-fetch Blog Page ID berdasarkan nama
      const blogPageId = await getBlogMultiplePageId(PROJECT_ID, BLOG_PAGE_NAME);
      
      console.log('📝 Blog Page ID:', blogPageId);

      // Fetch articles
      await fetchArticles(blogPageId);
    } catch (error: any) {
      console.error('Error initializing blog:', error);
      alert(error.message || 'Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (blogPageId: string) => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await api.getEntriesByMultiplePage(
        blogPageId,
        token,
        {
          published: true,
          locale: 'id'
        }
      );

      if (response.success && response.data) {
        setArticles(response.data);
        console.log('✅ Loaded articles:', response.data.length);
      }
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.content.id.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.id.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.content.id.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(articles.map(a => a.content.id.category)))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog Articles</h1>
          <p className="text-gray-600">Discover our latest insights and stories</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? 'No articles found' : 'No articles yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/blog/${article.content.id.slug}`)}>
                
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  {article.content.id.thumbnail?.url ? (
                    <img
                      src={article.content.id.thumbnail.url}
                      alt={article.content.id.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                    {article.content.id.category}
                  </span>

                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition">
                    {article.content.id.title}
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.content.id.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User size={16} />
                      <span>{article.content.id.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatDate(article.publishedDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-blue-600 font-medium group">
                    <span>Read More</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}