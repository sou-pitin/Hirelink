import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  ArrowLeft,
  Bookmark,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { supabase, type Job } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const jobTypeLabels: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  internship: 'Internship',
};

const expLabels: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  lead: 'Lead',
  executive: 'Executive',
};

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      const { data } = await supabase
        .from('jobs')
        .select('*, company:companies(*)')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setJob(data as Job);

        if (profile) {
          const [appRes, savedRes] = await Promise.all([
            supabase
              .from('applications')
              .select('id')
              .eq('job_id', id)
              .eq('applicant_id', profile.id)
              .maybeSingle(),
            supabase
              .from('saved_jobs')
              .select('id')
              .eq('job_id', id)
              .eq('user_id', profile.id)
              .maybeSingle(),
          ]);
          setApplied(!!appRes.data);
          setSaved(!!savedRes.data);
        }
      }
      setLoading(false);
    }
    loadJob();
  }, [id, profile]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      navigate('/login');
      return;
    }
    if (profile.user_type !== 'job_seeker') {
      alert('Only job seekers can apply for jobs.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('applications').insert({
      job_id: id,
      applicant_id: profile.id,
      cover_letter: coverLetter,
    });

    if (!error) {
      setApplied(true);
      setShowApplyForm(false);
    }
    setSubmitting(false);
  }

  async function toggleSave() {
    if (!profile) {
      navigate('/login');
      return;
    }

    if (saved) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('job_id', id)
        .eq('user_id', profile.id);
      setSaved(false);
    } else {
      await supabase.from('saved_jobs').insert({
        job_id: id,
        user_id: profile.id,
      });
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <div className="container-app py-20">
        <div className="h-96 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Job Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          This job may have been removed or is no longer active.
        </p>
        <Link to="/jobs">
          <Button className="mt-6">Browse all jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="container-app py-8">
        {/* Back link */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main content */}
          <div className="space-y-6">
            {/* Job header */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 overflow-hidden">
                  {job.company?.logo_url ? (
                    <img
                      src={job.company.logo_url}
                      alt={job.company.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {job.title}
                  </h1>
                  <Link
                    to={`/companies/${job.company?.slug}`}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {job.company?.name}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Badge variant="primary">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {jobTypeLabels[job.job_type] || job.job_type}
                </Badge>
                <Badge variant="gray">
                  <MapPin className="h-3 w-3 mr-1" />
                  {job.is_remote ? 'Remote' : job.location || 'TBD'}
                </Badge>
                <Badge variant="gray">
                  <Clock className="h-3 w-3 mr-1" />
                  {expLabels[job.experience_level] || job.experience_level}
                </Badge>
                {job.salary_min && job.salary_max && (
                  <Badge variant="success">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {job.salary_min}k - {job.salary_max}k {job.salary_currency}
                  </Badge>
                )}
              </div>

              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="accent">{tag}</Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Job Description
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {job.description || 'No description provided.'}
                </p>
              </div>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Requirements
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </p>
              </Card>
            )}

            {/* Apply form */}
            {showApplyForm && (
              <Card className="p-6 animate-scale-in">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Apply for this position
                </h2>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Cover Letter
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell the employer why you're a great fit..."
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting}>
                      <Send className="h-4 w-4" />
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowApplyForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-5 sticky top-20">
              {applied ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-success-500 mb-3" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Application Submitted
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    You've applied for this job
                  </p>
                </div>
              ) : (
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => {
                    if (!profile) {
                      navigate('/login');
                    } else {
                      setShowApplyForm(true);
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                  Apply Now
                </Button>
              )}

              <Button
                variant="outline"
                fullWidth
                className="mt-3"
                onClick={toggleSave}
              >
                <Bookmark
                  className="h-4 w-4"
                  fill={saved ? 'currentColor' : 'none'}
                />
                {saved ? 'Saved' : 'Save Job'}
              </Button>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Posted</span>
                  <span className="text-gray-900 dark:text-gray-200">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Category</span>
                  <span className="text-gray-900 dark:text-gray-200">
                    {job.category || 'General'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Job Type</span>
                  <span className="text-gray-900 dark:text-gray-200">
                    {jobTypeLabels[job.job_type] || job.job_type}
                  </span>
                </div>
              </div>
            </Card>

            {/* Company info */}
            {job.company && (
              <Card className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  About the Company
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 overflow-hidden">
                    {job.company.logo_url ? (
                      <img
                        src={job.company.logo_url}
                        alt={job.company.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {job.company.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {job.company.industry}
                    </p>
                  </div>
                </div>
                {job.company.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                    {job.company.description}
                  </p>
                )}
                <Link
                  to={`/companies/${job.company.slug}`}
                  className="block mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View company profile →
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
