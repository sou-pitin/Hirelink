import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Globe, Calendar, Star, Briefcase, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { CompanyLogo } from '@/components/CompanyLogo';
import { JobCard } from '@/components/JobCard';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/Modal';
import type { Company, Job, Review } from '@/types';

type Tab = 'about' | 'jobs' | 'reviews';

export function CompanyProfilePage({ companyId }: { companyId: string }) {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('about');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewIsCurrent, setReviewIsCurrent] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: comp }, { data: jobData }, { data: revData }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('jobs').select('*, company:companies(*)').eq('company_id', companyId).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, profiles:profiles(full_name)').eq('company_id', companyId).order('created_at', { ascending: false }),
      ]);
      setCompany(comp as Company | null);
      setJobs((jobData || []) as unknown as Job[]);
      setReviews((revData || []) as unknown as Review[]);
      setLoading(false);
    }
    fetchData();
  }, [companyId]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function submitReview() {
    if (!user) { navigate('/signin'); return; }
    setReviewLoading(true);
    const { error } = await supabase.from('reviews').insert({
      company_id: companyId,
      seeker_id: user.id,
      rating: reviewRating,
      title: reviewTitle,
      content: reviewContent,
      is_current_employee: reviewIsCurrent,
    });
    setReviewLoading(false);
    if (error) {
      alert('Failed to submit review: ' + error.message);
      return;
    }
    setShowReviewModal(false);
    setReviewTitle('');
    setReviewContent('');
    setReviewRating(5);
    // Refresh reviews
    const { data: revData } = await supabase
      .from('reviews')
      .select('*, profiles:profiles(full_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setReviews((revData || []) as unknown as Review[]);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-slate-500">Company not found.</p>
        <button onClick={() => navigate('/companies')} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
          Back to companies
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/companies')}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to companies
      </button>

      {/* Company header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <CompanyLogo name={company.name} logoUrl={company.logo_url} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{company.industry}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{company.location}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{company.company_size} employees</span>
              {company.founded_year && (
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Founded {company.founded_year}</span>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Globe className="h-4 w-4" />Website
                </a>
              )}
            </div>
            {reviews.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${n <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'about'} onClick={() => setTab('about')}>About</TabButton>
        <TabButton active={tab === 'jobs'} onClick={() => setTab('jobs')}>
          Open Jobs ({jobs.length})
        </TabButton>
        <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')}>
          Reviews ({reviews.length})
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === 'about' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">About {company.name}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{company.description}</p>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No open positions at this time.</p>
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {profile?.role === 'seeker' && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Write a Review
              </button>
            )}
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <Star className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{review.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        by {review.profiles?.full_name || 'Anonymous'} · {review.is_current_employee ? 'Current Employee' : 'Former Employee'}
                      </p>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.content && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.content}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title={`Review ${company.name}`}>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setReviewRating(n)}
                  className="transition hover:scale-110"
                >
                  <Star className={`h-7 w-7 ${n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Review Title</label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Great place to work!"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Experience</label>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              rows={4}
              placeholder="Share your experience working at this company..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={reviewIsCurrent}
              onChange={(e) => setReviewIsCurrent(e.target.checked)}
              className="accent-slate-900"
            />
            I am a current employee
          </label>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowReviewModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={submitReview}
              disabled={reviewLoading || !reviewTitle}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
        active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
