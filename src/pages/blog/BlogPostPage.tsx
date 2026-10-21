import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/types';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      const { data } = await supabase
        .from('blog_posts')
        .select('*, author:profiles!blog_posts_author_id_fkey(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      setPost((data as BlogPost) ?? null);
      setLoading(false);
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return <div className="max-w-3xl mx-auto animate-pulse text-gray-400">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Post not found</h2>
        <Link to="/blog" className="btn-primary mt-4">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <article className="card p-8 md:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" /> {post.author?.full_name ?? 'Admin'}
          </span>
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {new Date(post.published_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          <span className="badge-neutral capitalize">{post.category.replace('-', ' ')}</span>
        </div>

        {post.excerpt && (
          <p className="text-lg text-gray-500 leading-relaxed mb-6 italic">{post.excerpt}</p>
        )}

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{post.body}</p>
        </div>
      </article>
    </div>
  );
}
