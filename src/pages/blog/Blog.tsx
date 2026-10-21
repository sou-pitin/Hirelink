import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ArrowRight, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost, BlogCategory } from '@/types';

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  'career-advice': 'Career Advice',
  'interview-tips': 'Interview Tips',
  'industry-news': 'Industry News',
  'company': 'Company',
};

const CATEGORY_COLORS: Record<BlogCategory, string> = {
  'career-advice': 'badge-info',
  'interview-tips': 'badge-success',
  'industry-news': 'badge-warning',
  'company': 'badge-neutral',
};

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function loadPosts() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*, author:profiles!blog_posts_author_id_fkey(*)')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false });
      setPosts((data as BlogPost[]) ?? []);
      setLoading(false);
    }
    loadPosts();
  }, []);

  const filtered = categoryFilter === 'all'
    ? posts
    : posts.filter((p) => p.category === categoryFilter);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-primary-600 mb-2">
          <Newspaper className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Career Advice & Insights</h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Expert tips, industry trends, and career guidance to help you land your next role.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            categoryFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {(Object.keys(CATEGORY_LABELS) as BlogCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === cat ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded mb-1" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No posts found in this category.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="card p-6 hover:shadow-md transition-all group flex flex-col"
            >
              <span className={`badge ${CATEGORY_COLORS[post.category]} self-start mb-3`}>
                {CATEGORY_LABELS[post.category]}
              </span>
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-700 transition-colors mb-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-gray-500 line-clamp-3 flex-1">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {post.author?.full_name ?? 'Admin'}
                </span>
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
