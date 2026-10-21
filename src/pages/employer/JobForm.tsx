import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { validateRequired, validateMaxLength, sanitizeText, rateLimit } from '@/lib/validation';
import type { JobType } from '@/types';

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
];

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState(profile?.company_name ?? '');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<JobType>('full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);

  // Load existing job if editing
  useEffect(() => {
    if (!isEdit || !id || !profile) return;
    (async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('employer_id', profile.id)
        .maybeSingle();
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setCompany(data.company);
        setLocation(data.location);
        setJobType(data.job_type);
        setSalaryRange(data.salary_range ?? '');
      }
      setLoaded(true);
    })();
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);

    const titleCheck = validateRequired(title, 'Job title');
    if (!titleCheck.valid) return setError(titleCheck.message ?? null);

    const descCheck = validateRequired(description, 'Job description');
    if (!descCheck.valid) return setError(descCheck.message ?? null);

    const companyCheck = validateRequired(company, 'Company name');
    if (!companyCheck.valid) return setError(companyCheck.message ?? null);

    const rl = rateLimit('job_post', 3, 60000);
    if (!rl.allowed) return setError(rl.message ?? null);

    setLoading(true);

    const payload = {
      employer_id: profile.id,
      title: sanitizeText(title),
      description: sanitizeText(description),
      company: sanitizeText(company),
      location: sanitizeText(location),
      job_type: jobType,
      salary_range: salaryRange ? sanitizeText(salaryRange) : null,
    };

    if (isEdit && id) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update(payload)
        .eq('id', id)
        .eq('employer_id', profile.id);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('jobs').insert({
        ...payload,
        status: 'pending',
      });
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Notify admins of new job pending review
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((admin) => ({
            user_id: admin.id,
            type: 'job_status' as const,
            title: `New job pending approval: ${title}`,
            body: `${profile.full_name} posted "${title}" at ${company}. Review it in the admin panel.`,
            link: '/admin',
            read: false,
          }))
        );
      }
    }

    setLoading(false);
    navigate('/employer/jobs');
  }

  if (!loaded) {
    return <div className="animate-pulse text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/employer/jobs')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Jobs
      </button>

      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Job Posting' : 'Post a New Job'}
      </h1>

      <div className="card p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error-50 text-error-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {isEdit && (
          <div className="mb-4 p-3 rounded-lg bg-warning-50 text-warning-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Editing will reset the job to pending status for admin re-review.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Job Title</label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="Senior Frontend Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="label" htmlFor="company">Company Name</label>
            <input
              id="company"
              type="text"
              className="input"
              placeholder="Acme Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                className="input"
                placeholder="San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className="label" htmlFor="jobType">Job Type</label>
              <select
                id="jobType"
                className="input"
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="salary">Salary Range (optional)</label>
            <input
              id="salary"
              type="text"
              className="input"
              placeholder="$80k - $120k"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="label" htmlFor="description">Job Description</label>
            <textarea
              id="description"
              className="input min-h-[200px] resize-y"
              placeholder="Describe the role, responsibilities, requirements, and what you're looking for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={10000}
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/10000 characters</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Job' : 'Submit for Review'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/employer/jobs')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
