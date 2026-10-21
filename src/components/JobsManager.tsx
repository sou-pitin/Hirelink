import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Briefcase, Users, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Job, JobWithApplicantCount, Company } from '@/types';
import { EMPLOYMENT_TYPES } from '@/types';

interface JobsManagerProps {
  company: Company | null;
  jobs: JobWithApplicantCount[];
  onJobsChanged: () => void;
}

const emptyJobForm: Omit<Job, 'id' | 'company_id' | 'created_at' | 'updated_at'> = {
  title: '',
  department: '',
  location: '',
  type: 'Full-time',
  salary_min: null,
  salary_max: null,
  description: '',
  requirements: '',
  status: 'active',
};

export default function JobsManager({ company, jobs, onJobsChanged }: JobsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState(emptyJobForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (editingJob) {
      setForm({
        title: editingJob.title,
        department: editingJob.department || '',
        location: editingJob.location || '',
        type: editingJob.type,
        salary_min: editingJob.salary_min,
        salary_max: editingJob.salary_max,
        description: editingJob.description,
        requirements: editingJob.requirements,
        status: editingJob.status,
      });
    } else {
      setForm(emptyJobForm);
    }
  }, [editingJob]);

  const filteredJobs = filterStatus === 'all'
    ? jobs
    : jobs.filter((j) => j.status === filterStatus);

  const handleSave = async () => {
    if (!company) return;
    if (!form.title.trim()) {
      setError('Job title is required');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (editingJob) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingJob.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('jobs')
          .insert({
            ...form,
            company_id: company.id,
          });
        if (insertError) throw insertError;
      }
      setShowForm(false);
      setEditingJob(null);
      onJobsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const { error: deleteError } = await supabase.from('jobs').delete().eq('id', jobId);
      if (deleteError) throw deleteError;
      setDeleteConfirm(null);
      onJobsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const openNewForm = () => {
    setEditingJob(null);
    setForm(emptyJobForm);
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (job: Job) => {
    setEditingJob(job);
    setError(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Listings</h2>
          <p className="text-slate-500 text-sm mt-1">Create and manage your job postings</p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg transition-colors duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Post New Job
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {['all', 'active', 'closed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 capitalize ${
              filterStatus === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Jobs list */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No jobs found</p>
            <p className="text-sm text-slate-400 mt-1">
              {filterStatus === 'all' ? 'Post your first job to get started' : `No ${filterStatus} jobs`}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          job.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                      {job.department && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {job.department}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary_min && job.salary_max
                          ? `$${(job.salary_min / 1000).toFixed(0)}k–$${(job.salary_max / 1000).toFixed(0)}k`
                          : 'Not specified'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {job.applicant_count} {job.applicant_count === 1 ? 'applicant' : 'applicants'}
                      </span>
                    </div>
                    {job.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{job.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditForm(job)}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors duration-200"
                    title="Edit job"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {deleteConfirm === job.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(job.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingJob ? 'Edit Job Listing' : 'Post New Job'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingJob(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={form.department ?? ''}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Engineering"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={form.location ?? ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Employment Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white"
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Salary Min ($)</label>
                  <input
                    type="number"
                    value={form.salary_min ?? ''}
                    onChange={(e) => setForm({ ...form, salary_min: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 80000"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Salary Max ($)</label>
                  <input
                    type="number"
                    value={form.salary_max ?? ''}
                    onChange={(e) => setForm({ ...form, salary_max: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 120000"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Describe the role and responsibilities..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Requirements</label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  rows={3}
                  placeholder="List the required skills and qualifications..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingJob(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : editingJob ? 'Save Changes' : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


