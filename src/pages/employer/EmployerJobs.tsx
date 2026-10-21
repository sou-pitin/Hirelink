import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Briefcase, MapPin, Clock, Edit3, Trash2, Users, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Job, Application, JobStatus } from '@/types';
import { timeAgo } from '@/pages/Jobs';

const STATUS_BADGES: Record<string, { class: string; label: string }> = {
  active: { class: 'badge-success', label: 'Active' },
  draft: { class: 'badge-neutral', label: 'Draft' },
  closed: { class: 'badge-neutral', label: 'Closed' },
  approved: { class: 'badge-success', label: 'Approved' },
  pending: { class: 'badge-warning', label: 'Pending Review' },
  rejected: { class: 'badge-error', label: 'Rejected' },
  removed: { class: 'badge-neutral', label: 'Removed' },
};

export default function EmployerJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  const loadJobs = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false });
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function loadApplications(jobId: string) {
    const { data } = await supabase
      .from('applications')
      .select('*, candidate:profiles!applications_candidate_id_fkey(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    setApplications((data as Application[]) ?? []);
  }

  async function deleteJob(jobId: string) {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    await supabase.from('jobs').delete().eq('id', jobId);
    setJobs(jobs.filter((j) => j.id !== jobId));
    if (selectedJob?.id === jobId) setSelectedJob(null);
  }

  async function updateAppStatus(appId: string, status: string) {
    await supabase.from('applications').update({ status }).eq('id', appId);

    // Notify the candidate
    const app = applications.find((a) => a.id === appId);
    if (app && selectedJob) {
      await supabase.from('notifications').insert({
        user_id: app.candidate_id,
        type: 'application',
        title: `Application status update: ${selectedJob.title}`,
        body: `Your application status has been updated to: ${status}`,
        link: '/applications',
        read: false,
      });
    }

    setApplications(apps =>
      apps.map((a) => (a.id === appId ? { ...a, status: status as Application['status'] } : a))
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
          <p className="text-gray-500 mt-1">Manage your jobs and view applicants</p>
        </div>
        <Link to="/employer/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Post a Job
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No jobs posted yet</h3>
          <p className="text-gray-400 text-sm mt-1 mb-4">Create your first job posting to start receiving applications.</p>
          <Link to="/employer/jobs/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const badge = STATUS_BADGES[job.status] ?? { class: 'badge-neutral', label: String(job.status) };
            return (
              <div key={job.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                      <span className={badge.class}>{badge.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {timeAgo(job.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      if (selectedJob?.id === job.id) {
                        setSelectedJob(null);
                      } else {
                        setSelectedJob(job);
                        loadApplications(job.id);
                      }
                    }}
                    className="btn-secondary text-xs"
                  >
                    <Users className="w-3.5 h-3.5" /> View Applicants
                  </button>
                  <Link to={`/employer/jobs/${job.id}/edit`} className="btn-ghost text-xs">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button onClick={() => deleteJob(job.id)} className="btn-ghost text-error-500 text-xs">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {selectedJob?.id === job.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-down">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Applicants ({applications.length})
                    </h4>
                    {applications.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No applications yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {applications.map((app) => (
                          <div key={app.id} className="p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {app.candidate?.full_name ?? 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Applied {timeAgo(app.created_at)}
                                </p>
                              </div>
                              <span className={`badge ${
                                app.status === 'accepted' ? 'badge-success' :
                                app.status === 'rejected' ? 'badge-error' :
                                app.status === 'reviewed' ? 'badge-info' :
                                'badge-warning'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            {app.cover_letter && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{app.cover_letter}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <select
                                value={app.status}
                                onChange={(e) => updateAppStatus(app.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                              >
                                <option value="submitted">Submitted</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
