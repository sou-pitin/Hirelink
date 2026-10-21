import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { validateRequired, validateMaxLength, sanitizeText, slugify, rateLimit } from '@/lib/validation';
import type { BlogCategory, BlogStatus } from '@/types';

const CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: 'career-advice', label: 'Career Advice' },
  { value: 'interview-tips', label: 'Interview Tips' },
  { value: 'industry-news', label: 'Industry News' },
  { value: 'company', label: 'Company' },
];

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<BlogCategory>('career-advice');
  const [status, setStatus] = useState<BlogStatus>('draft');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit || !id || !profile) return;
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        setTitle(data.title);
        setExcerpt(data.excerpt ?? '');
        setBody(data.body);
        setCategory(data.category);
        setStatus(data.status);
        setSlug(data.slug);
        setSlugEdited(true);
      }
      setLoaded(true);
    })();
  }, [id, isEdit, profile]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited]);

  async function handleSubmit(publishStatus: BlogStatus) {
    if (!profile) return;
    setError(null);

    const titleCheck = validateRequired(title, 'Title');
    if (!titleCheck.valid) return setError(titleCheck.message ?? null);

    const bodyCheck = validateRequired(body, 'Body');
    if (!bodyCheck.valid) return setError(bodyCheck.message ?? null);

    const slugCheck = validateRequired(slug, 'Slug');
    if (!slugCheck.valid) return setError(slugCheck.message ?? null);

    const rl = rateLimit('blog_post', 5, 60000);
    if (!rl.allowed) return setError(rl.message ?? null);

    setSaving(true);

    const payload = {
      author_id: profile.id,
      title: sanitizeText(title),
      slug: slugify(slug) || slugify(title),
      excerpt: excerpt ? sanitizeText(excerpt) : null,
      body: sanitizeText(body),
      category,
      status: publishStatus,
      published_at: publishStatus === 'published' ? new Date().toISOString() : null,
    };

    if (isEdit && id) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('blog_posts').insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    navigate('/admin');
  }

  if (!loaded) {
    return <div className="animate-pulse text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit('draft')}
            className="btn-secondary"
            disabled={saving}
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSubmit('published')}
            className="btn-primary"
            disabled={saving}
          >
            <Eye className="w-4 h-4" /> {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Blog Post' : 'New Blog Post'}
      </h1>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-50 text-error-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="input text-lg font-medium"
            placeholder="10 Tips for Acing Your Next Interview"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        <div>
          <label className="label" htmlFor="slug">URL Slug</label>
          <input
            id="slug"
            type="text"
            className="input"
            placeholder="10-tips-for-acing-your-next-interview"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            maxLength={200}
          />
          <p className="text-xs text-gray-400 mt-1">
            The URL will be: /blog/{slug || 'your-post-slug'}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="category">Category</label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as BlogCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="excerpt">Excerpt (optional)</label>
          <input
            id="excerpt"
            type="text"
            className="input"
            placeholder="A brief summary shown in the blog listing..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={300}
          />
          <p className="text-xs text-gray-400 mt-1">{excerpt.length}/300 characters</p>
        </div>

        <div>
          <label className="label" htmlFor="body">Content</label>
          <textarea
            id="body"
            className="input min-h-[300px] resize-y font-mono text-sm"
            placeholder="Write your blog post content here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={50000}
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}/50000 characters</p>
        </div>
      </div>

      {/* Preview card */}
      {title && (
        <div className="card p-6 bg-gray-50/50">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Preview
          </p>
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          {excerpt && <p className="text-sm text-gray-500 mt-2">{excerpt}</p>}
          <p className="text-sm text-gray-600 mt-3 line-clamp-3 whitespace-pre-wrap">{body}</p>
        </div>
      )}
    </div>
  );
}
