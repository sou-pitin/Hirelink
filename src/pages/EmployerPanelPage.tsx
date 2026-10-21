import { useState, useEffect } from 'react';
import { Plus, Building2, Briefcase, Users, ChevronRight, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/Modal';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { Company, Job, Application } from '@/types';
import { formatSalary, timeAgo } from '@/lib/utils';
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS, APPLICATION_STATUSES } from '@/types';

type Tab = 'overview' | 'jobs' | 'applications';

export function EmployerPanelPage() {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<(Application & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: '', description: '', industry: '', website: '', location: '', company_size: '51-200', founded_year: '',
  });

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: '', description: '', requirements: '', category: 'Engineering', job_type: 'full-time',
    experience_level: 'mid', location: '', remote_ok: false, salary_min: '', salary_max: '',
  });

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    if (profile && profile.role !== 'employer') { navigate('/dashboard'); return; }
    fetchData();
  }, [user, profile, navigate]);

  async function fetchData() {
    if (!user) return;
    const { data: comp } = await supabase
      .from('companies')
      .select('*')
      .eq('employer_id', user.id)
      .maybeSingle();
    setCompany(comp as Company | null);

    if (comp) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', (comp as Company).id)
        .order('created_at', { ascending: false });
      setJobs((jobData || []) as Job[]);

      const { data: appData } = await supabase
        .from('applications')
        .select('*, job:jobs(*)')
        .in('job_id', (jobData || []).map((j) => (j as Job).id))
        .order('created_at', { ascending: false });
      setApplications((appData || []) as unknown as (Application & { job?: Job })[]);
    }
    setLoading(false);
  }

  async function createCompany() {
    if (!user) return;
    const { data, error } = await supabase
      .from('companies')
      .insert({
        employer_id: user.id,
        name: companyForm.name,
        description: companyForm.description,
        industry: companyForm.industry || null,
        website: companyForm.website || null,
        location: companyForm.location,
        company_size: companyForm.company_size,
        founded_year: companyForm.founded_year ? parseInt(companyForm.founded_year) : null,
      })
      .select('*')
      .single();
    if (error) { alert('Failed to create company: ' + error.message); return; }
    setCompany(data as unknown as Company);
    setShowCompanyModal(false);
  }

  async function createOrUpdateJob() {
    if (!company || !user) return;
    const payload = {
      company_id: company.id,
      posted_by: user.id,
      title: jobForm.title,
      description: jobForm.description,
      requirements: jobForm.requirements,
      category: jobForm.category,
      job_type: jobForm.job_type,
      experience_level: jobForm.experience_level,
      location: jobForm.location,
      remote_ok: jobForm.remote_ok,
      salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
      salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
    };

    if (editingJob) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingJob.id);
      if (error) { alert('Failed to update job: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('jobs').insert(payload);
      if (error) { alert('Failed to create job: ' + error.message); return; }
    }

    setShowJobModal(false);
    setEditingJob(null);
    setJobForm({
      title: '', description: '', requirements: '', category: 'Engineering', job_type: 'full-time',
      experience_level: 'mid', location: '', remote_ok: false, salary_min: '', salary_max: '',
    });
    fetchData();
  }

  function openEditJob(job: Job) {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      category: job.category,
      job_type: job.job_type,
      experience_level: job.experience_level,
      location: job.location,
      remote_ok: job.remote_ok,
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
    });
    setShowJobModal(true);
  }

  async function toggleJobActive(job: Job) {
    await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id);
    fetchData();
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job posting? All applications will also be removed.')) return;
    await supabase.from('jobs').delete().eq('id', id);
    fetchData();
  }

  async function updateApplicationStatus(appId: string, status: string) {
    await supabase.from('applications').update({ status }).eq('id', appId);
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: status as Application['status'] } : a));
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /></div>;
  }

  if (!user) return null;

  // No company yet
  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900">Set up your company profile</h2>
          <p className="mt-2 text-sm text-slate-500">Create a company profile to start posting jobs and receiving applications.</p>
          <button
            onClick={() => setShowCompanyModal(true)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Create Company Profile
          </button>
        </div>
        <CompanyModal
          open={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          form={companyForm}
          setForm={setCompanyForm}
          onSave={createCompany}
        />
      </div>
    );
  }

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.is_active).length,
    totalApps: applications.length,
    newApps: applications.filter((a) => a.status === 'Applied').length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CompanyLogo name={company.name} logoUrl={company.logo_url} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <p className="text-sm text-slate-500">{company.industry} · {company.location}</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingJob(null); setJobForm({ title: '', description: '', requirements: '', category: 'Engineering', job_type: 'full-time', experience_level: 'mid', location: '', remote_ok: false, salary_min: '', salary_max: '' }); setShowJobModal(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Post a Job
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Jobs" value={stats.totalJobs} icon={Briefcase} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Active" value={stats.activeJobs} icon={Briefcase} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Applications" value={stats.totalApps} icon={Users} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="New" value={stats.newApps} icon={Users} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabBtn>
        <TabBtn active={tab === 'jobs'} onClick={() => setTab('jobs')}>Jobs ({jobs.length})</TabBtn>
        <TabBtn active={tab === 'applications'} onClick={() => setTab('applications')}>Applications ({applications.length})</TabBtn>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-slate-900">Recent Jobs</h3>
            {jobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No jobs posted yet.</p>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">{timeAgo(job.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {job.is_active ? 'Active' : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-slate-900">Recent Applications</h3>
            {applications.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{app.job?.title}</p>
                      <p className="text-xs text-slate-500">{timeAgo(app.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs tab */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">No jobs posted yet.</p>
              <button onClick={() => setShowJobModal(true)} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
                Post your first job
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{job.category}</span>
                      <span>{JOB_TYPE_LABELS[job.job_type]}</span>
                      <span>{EXPERIENCE_LABELS[job.experience_level]}</span>
                      <span>{job.location}</span>
                      <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleJobActive(job)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {job.is_active ? 'Active' : 'Closed'}
                    </button>
                    <button onClick={() => openEditJob(job)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                      Edit
                    </button>
                    <button onClick={() => deleteJob(job.id)} className="rounded-lg p-1.5 text-slate-400 transition hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Applications tab */}
      {tab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">No applications received yet.</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{app.job?.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">Applied {timeAgo(app.created_at)}</p>
                    {app.cover_letter && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{app.cover_letter}</p>
                    )}
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Job modal */}
      <JobModal
        open={showJobModal}
        onClose={() => { setShowJobModal(false); setEditingJob(null); }}
        form={jobForm}
        setForm={setJobForm}
        onSave={createOrUpdateJob}
        isEdit={!!editingJob}
      />

      {/* Company modal */}
      <CompanyModal
        open={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        form={companyForm}
        setForm={setCompanyForm}
        onSave={createCompany}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: typeof Briefcase; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`border-b-2 px-4 py-3 text-sm font-medium transition ${active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
      {children}
    </button>
  );
}

function JobModal({ open, onClose, form, setForm, onSave, isEdit }: {
  open: boolean; onClose: () => void;
  form: { title: string; description: string; requirements: string; category: string; job_type: string; experience_level: string; location: string; remote_ok: boolean; salary_min: string; salary_max: string };
  setForm: (f: typeof form) => void; onSave: () => void; isEdit: boolean;
}) {
  const categories = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance', 'Operations', 'Customer Support', 'Data', 'HR', 'Legal', 'Other'];
  const types = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
  const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Job' : 'Post a New Job'} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Title</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Type</label>
            <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400">
              {types.map((t) => <option key={t} value={t}>{JOB_TYPE_LABELS[t as keyof typeof JOB_TYPE_LABELS]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience Level</label>
            <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400">
              {levels.map((l) => <option key={l} value={l}>{EXPERIENCE_LABELS[l as keyof typeof EXPERIENCE_LABELS]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. San Francisco, CA"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Min Salary ($)</label>
            <input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
              placeholder="80000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Max Salary ($)</label>
            <input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
              placeholder="120000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.remote_ok} onChange={(e) => setForm({ ...form, remote_ok: e.target.checked })}
            className="accent-slate-900" />
          Remote work allowed
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4} placeholder="Describe the role..."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Requirements</label>
          <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            rows={3} placeholder="List required skills and experience..."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button onClick={onSave} disabled={!form.title || !form.description}
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60">
            {isEdit ? 'Update Job' : 'Post Job'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CompanyModal({ open, onClose, form, setForm, onSave }: {
  open: boolean; onClose: () => void;
  form: { name: string; description: string; industry: string; website: string; location: string; company_size: string; founded_year: string };
  setForm: (f: typeof form) => void; onSave: () => void;
}) {
  const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  return (
    <Modal open={open} onClose={onClose} title="Create Company Profile" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Company Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. TechCorp"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Industry</label>
            <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="e.g. Technology"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Company Size</label>
            <select value={form.company_size} onChange={(e) => setForm({ ...form, company_size: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400">
              {sizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. San Francisco, CA"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Founded Year</label>
            <input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
              placeholder="e.g. 2015"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Website</label>
          <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">About the Company</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} placeholder="Describe your company..."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button onClick={onSave} disabled={!form.name}
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60">
            Create Company
          </button>
        </div>
      </div>
    </Modal>
  );
}
