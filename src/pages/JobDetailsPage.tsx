import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, DollarSign, Clock, Briefcase, Bookmark, CheckCircle, Building2, Calendar, Share2, FileText, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Modal } from '@/components/Modal';
import { JobCard } from '@/components/JobCard';
import { formatSalary, timeAgo } from '@/lib/utils';
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS } from '@/types';
import type { Job, Resume } from '@/types';

export function JobDetailsPage({ jobId }: { jobId: string }) {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companies(*)')
        .eq('id', jobId)
        .maybeSingle();
      if (error || !data) {
        setJob(null);
        setLoading(false);
        return;
      }
      setJob(data as unknown as Job);

      // Fetch related jobs
      const { data: related } = await supabase
        .from('jobs')
        .select('*, company:companies(*)')
        .eq('is_active', true)
        .eq('category', (data as unknown as Job).category)
        .neq('id', jobId)
        .limit(3);
      setRelatedJobs((related || []) as unknown as Job[]);

      if (user) {
        // Check if saved
        const { data: savedData } = await supabase
          .from('saved_jobs')
          .select('id')
          .eq('job_id', jobId)
          .eq('user_id', user.id)
          .maybeSingle();
        setSaved(!!savedData);

        // Check if applied
        const { data: appData } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('seeker_id', user.id)
          .maybeSingle();
        setApplied(!!appData);

        // Fetch resumes
        const { data: resumeData } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        setResumes((resumeData || []) as Resume[]);
        if (resumeData && resumeData.length > 0) {
          setSelectedResume(resumeData[0].id);
        }
      }
      setLoading(false);
    }
    fetchJob();
  }, [jobId, user]);

  async function toggleSave() {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (saved) {
      await supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('user_id', user.id);
      setSaved(false);
    } else {
      await supabase.from('saved_jobs').insert({ job_id: jobId, user_id: user.id });
      setSaved(true);
    }
  }

  async function handleApply() {
    if (!user || !job) return;
    setApplyLoading(true);

    const resumeData = resumes.find((r) => r.id === selectedResume);
    const { error } = await supabase.from('applications').insert({
      job_id: jobId,
      seeker_id: user.id,
      cover_letter: coverLetter || null,
      resume_data: resumeData || null,
      status: 'Applied',
    });

    setApplyLoading(false);
    if (error) {
      console.error('Apply error:', error);
      alert('Failed to submit application: ' + error.message);
      return;
    }
    setApplied(true);
    setShowApplyModal(false);
  }

  function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-slate-500">Job not found.</p>
        <button onClick={() => navigate('/jobs')} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
          Back to jobs
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/jobs')}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </button>

      {/* Job header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {job.company && <CompanyLogo name={job.company.name} logoUrl={job.company.logo_url} size="lg" />}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              {job.company && (
                <button
                  onClick={() => navigate(`/companies/${job.company!.id}`)}
                  className="mt-1 flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:underline"
                >
                  <Building2 className="h-4 w-4" />
                  {job.company.name}
                </button>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location || 'Remote'}</span>
                {job.remote_ok && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Remote OK</span>}
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{JOB_TYPE_LABELS[job.job_type]}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{EXPERIENCE_LABELS[job.experience_level]}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSave}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                saved ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:text-slate-600"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-slate-900">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" />
              {timeAgo(job.created_at)}
            </span>
          </div>

          {applied ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              Application Submitted
            </div>
          ) : (
            <button
              onClick={() => {
                if (!user) { navigate('/signin'); return; }
                setShowApplyModal(true);
              }}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>

      {/* Job content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Job Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Requirements</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.requirements}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {job.company && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">About the Company</h3>
              <div className="flex items-center gap-3">
                <CompanyLogo name={job.company.name} logoUrl={job.company.logo_url} />
                <div>
                  <button
                    onClick={() => navigate(`/companies/${job.company!.id}`)}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {job.company.name}
                  </button>
                  <p className="text-xs text-slate-500">{job.company.industry || 'Technology'}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Size</dt>
                  <dd className="font-medium text-slate-700">{job.company.company_size}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-700">{job.company.location}</dd>
                </div>
                {job.company.founded_year && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Founded</dt>
                    <dd className="font-medium text-slate-700">{job.company.founded_year}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 line-clamp-3 text-sm text-slate-500">{job.company.description}</p>
              <button
                onClick={() => navigate(`/companies/${job.company!.id}`)}
                className="mt-3 text-sm font-medium text-slate-900 hover:underline"
              >
                View company profile →
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Job Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Category</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{job.category}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Job Type</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{JOB_TYPE_LABELS[job.job_type]}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Experience Level</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{EXPERIENCE_LABELS[job.experience_level]}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Salary Range</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Related jobs */}
      {relatedJobs.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Similar Jobs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedJobs.map((rj) => (
              <JobCard key={rj.id} job={rj} />
            ))}
          </div>
        </div>
      )}

      {/* Apply modal */}
      <Modal open={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for this job" maxWidth="max-w-xl">
        <div className="space-y-5">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-medium text-slate-900">{job.title}</p>
            <p className="text-sm text-slate-500">{job.company?.name} · {job.location}</p>
          </div>

          {/* Resume selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Select a resume</label>
            {resumes.length > 0 ? (
              <div className="space-y-2">
                {resumes.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      selectedResume === r.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      checked={selectedResume === r.id}
                      onChange={() => setSelectedResume(r.id)}
                      className="accent-slate-900"
                    />
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500">Updated {timeAgo(r.updated_at)}</p>
                    </div>
                    {r.is_default && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Default</span>}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No resumes yet.{' '}
                <button onClick={() => navigate('/resume-builder')} className="font-medium text-slate-900 hover:underline">
                  Create one
                </button>
              </p>
            )}
          </div>

          {/* Resume upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Or upload a PDF resume</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-4 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              {resumeFileName || 'Click to upload a PDF'}
              <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
            </label>
          </div>

          {/* Cover letter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Cover Letter <span className="text-slate-400">(optional)</span></label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell the employer why you're a great fit..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowApplyModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={applyLoading}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {applyLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
