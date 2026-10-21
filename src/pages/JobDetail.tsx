import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Briefcase, Building2, Clock, ArrowLeft, CheckCircle, Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Job, Application, JobType } from '@/types';
import { rateLimit, validateMaxLength, sanitizeText } from '@/lib/validation';
import { timeAgo } from '@/pages/Jobs';

const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-Time',
  'part-time': 'Part-Time',
  'contract': 'Contract',
  'remote': 'Remote',
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      const { data, error } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_employer_id_fkey(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const jobData = data as Job;
      setJob(jobData);

      if (profile?.role === 'candidate') {
        const { data: appData } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('candidate_id', profile.id)
          .maybeSingle();
        setHasApplied(!!appData);
      }

      setLoading(false);
    }
    loadJob();
  }, [id, profile]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !job || !id) return;

    setError(null);

    const clCheck = validateMaxLength(coverLetter, 5000, 'Cover letter');
    if (!clCheck.valid) {
      setError(clCheck.message ?? null);
      return;
    }

    const rl = rateLimit('apply', 3, 60000);
    if (!rl.allowed) {
      setError(rl.message ?? null);
      return;
    }

    setApplying(true);

    const { error: insertError } = await supabase
      .from('applications')
      .insert({
        job_id: id,
        candidate_id: profile.id,
        cover_letter: coverLetter ? sanitizeText(coverLetter) : null,
        status: 'submitted',
      });

    if (insertError) {
      setError(insertError.message);
      setApplying(false);
      return;
    }

    // Notify the employer
    await supabase.from('notifications').insert({
      user_id: job.employer_id,
      type: 'application',
      title: `New application for "${job.title}"`,
      body: `${profile.full_name} applied for your job posting.`,
      link: '/employer/jobs',
      read: false,
    });

    setApplied(true);
    setHasApplied(true);
    setShowApplyForm(false);
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-700">Job not found</h2>
        <Link to="/jobs" className="btn-primary mt-4">Back to Jobs</Link>
      </div>
    );
  }

  const isOwner = profile?.id === job.employer_id;
  const canApply = (profile?.role === 'candidate' || (profile?.role as string) === 'seeker') && !hasApplied && ['approved', 'active'].includes(job.status);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      <div className="card p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-500 mt-1">{job.company}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {job.location || 'Remote'}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> {JOB_TYPE_LABELS[job.job_type]}
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-4 h-4" /> Posted {timeAgo(job.created_at)}
              </span>
              {job.salary_range && (
                <span className="badge-info">{job.salary_range}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold text-lg mb-3">Job Description</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {job.salary_range && (
          <div className="mt-6 p-4 rounded-lg bg-accent-50 border border-accent-100">
            <p className="text-sm text-accent-700">
              <span className="font-semibold">Salary Range:</span> {job.salary_range}
            </p>
          </div>
        )}
      </div>

      {/* Apply section */}
      <div className="card p-6">
        {isOwner ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">This is your job posting.</p>
            <Link to="/employer/jobs" className="btn-secondary mt-3">Manage My Jobs</Link>
          </div>
        ) : !profile ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-3">Sign in to apply for this position.</p>
            <Link to="/signin" className="btn-primary">Sign In</Link>
          </div>
        ) : applied ? (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-accent-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">Application Submitted!</p>
            <p className="text-sm text-gray-500 mt-1">The employer will be notified of your application.</p>
            <Link to="/applications" className="btn-secondary mt-3">View My Applications</Link>
          </div>
        ) : hasApplied ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-accent-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">You've already applied for this job.</p>
            <Link to="/applications" className="btn-secondary mt-3">View Application</Link>
          </div>
        ) : canApply ? (
          showApplyForm ? (
            <form onSubmit={handleApply} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">{error}</div>
              )}
              <div>
                <label className="label" htmlFor="coverLetter">Cover Letter (optional)</label>
                <textarea
                  id="coverLetter"
                  className="input min-h-[150px] resize-y"
                  placeholder="Tell the employer why you're a great fit..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  maxLength={5000}
                />
                <p className="text-xs text-gray-400 mt-1">{coverLetter.length}/5000 characters</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={applying}>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button type="button" onClick={() => setShowApplyForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">Ready to apply for this position?</p>
              <button onClick={() => setShowApplyForm(true)} className="btn-primary">
                Apply Now
              </button>
            </div>
          )
        ) : profile?.role === 'employer' ? (
          <p className="text-center text-gray-500 text-sm py-4">
            Employer accounts cannot apply for jobs.{' '}
            <Link to={`/messages?to=${job.employer_id}`} className="text-primary-600">
              Message the employer
            </Link>
          </p>
        ) : (
          <p className="text-center text-gray-500 text-sm py-4">This job is no longer accepting applications.</p>
        )}
      </div>

      {/* Message employer (for candidates) */}
      {profile?.role === 'candidate' && profile.id !== job.employer_id && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Have a question about this role?</p>
            <p className="text-xs text-gray-500">Send a message to the employer directly.</p>
          </div>
          <button
            onClick={() => navigate(`/messages?to=${job.employer_id}&subject=Question about "${job.title}"`)}
            className="btn-secondary"
          >
            <Mail className="w-4 h-4" /> Message Employer
          </button>
        </div>
      )}
    </div>
  );
}
