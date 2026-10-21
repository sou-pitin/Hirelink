import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Application } from '@/types';
import { timeAgo } from '@/pages/Jobs';

const STATUS_BADGES: Record<string, { class: string; label: string }> = {
  submitted: { class: 'badge-warning', label: 'Submitted' },
  reviewed: { class: 'badge-info', label: 'Reviewed' },
  accepted: { class: 'badge-success', label: 'Accepted' },
  rejected: { class: 'badge-error', label: 'Rejected' },
};

export default function Applications() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      if (!profile) return;
      const { data } = await supabase
        .from('applications')
        .select('*, job:jobs!applications_job_id_fkey(*), candidate:profiles!applications_candidate_id_fkey(*)')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false });
      setApplications((data as Application[]) ?? []);
      setLoading(false);
    }
    loadApplications();
  }, [profile]);

  if (loading) {
    return <div className="animate-pulse text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1">Track your job applications and their status</p>
      </div>

      {applications.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No applications yet</h3>
          <p className="text-gray-400 text-sm mt-1 mb-4">Browse the job board and apply to positions that interest you.</p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badge = STATUS_BADGES[app.status] ?? STATUS_BADGES.submitted;
            return (
              <div key={app.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <Link
                        to={`/jobs/${app.job_id}`}
                        className="font-semibold text-gray-900 hover:text-primary-700 transition-colors"
                      >
                        {app.job?.title ?? 'Unknown position'}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500">{app.job?.company ?? 'Unknown company'}</p>
                    {app.cover_letter && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Applied {timeAgo(app.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className={badge.class}>{badge.label}</span>
                </div>

                {app.status === 'accepted' && (
                  <div className="mt-3 p-3 rounded-lg bg-accent-50 border border-accent-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent-600" />
                    <p className="text-sm text-accent-700">
                      Congratulations! Your application has been accepted.
                    </p>
                  </div>
                )}
                {app.status === 'rejected' && (
                  <div className="mt-3 p-3 rounded-lg bg-error-50 border border-error-100 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-error-600" />
                    <p className="text-sm text-error-700">
                      Your application was not selected for this position.
                    </p>
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
