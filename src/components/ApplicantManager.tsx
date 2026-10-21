import { useState, useMemo } from 'react';
import {
  Search, Star, Download, Mail, X, ChevronDown, Filter,
  Phone, FileText, Calendar, Briefcase, MapPin, Check, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { callNotificationEdgeFunction } from '@/lib/supabase';
import type { Application, Job, ApplicationStatus, Company } from '@/types';
import { APPLICATION_STATUSES, STATUS_COLORS } from '@/types';

interface ApplicantManagerProps {
  applications: Application[];
  jobs: Job[];
  company: Company | null;
  onApplicationsChanged: () => void;
}

export default function ApplicantManager({
  applications,
  jobs,
  company,
  onApplicationsChanged,
}: ApplicantManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const jobMap = useMemo(() => {
    const map = new Map<string, Job>();
    jobs.forEach((j) => map.set(j.id, j));
    return map;
  }, [jobs]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (jobFilter !== 'all' && app.job_id !== jobFilter) return false;
      if (ratingFilter !== null && (app.rating === null || app.rating < ratingFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const job = jobMap.get(app.job_id);
        if (
          !app.candidate_name.toLowerCase().includes(q) &&
          !app.candidate_email.toLowerCase().includes(q) &&
          !(job?.title.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [applications, statusFilter, jobFilter, ratingFilter, searchQuery, jobMap]);

  const handleStatusChange = async (app: Application, newStatus: ApplicationStatus) => {
    setStatusUpdating(app.id);
    setNotificationStatus(null);

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', app.id);

      if (updateError) throw updateError;

      // Send email notification via edge function
      const job = jobMap.get(app.job_id);
      const notificationResult = await callNotificationEdgeFunction({
        applicationId: app.id,
        candidateName: app.candidate_name,
        candidateEmail: app.candidate_email,
        jobTitle: job?.title || 'the position',
        companyName: company?.name || 'the company',
        newStatus,
      });

      if (notificationResult.success) {
        setNotificationStatus({
          type: 'success',
          message: `${app.candidate_name}'s status updated to "${newStatus}". Notification sent to ${app.candidate_email}.`,
        });
      } else {
        setNotificationStatus({
          type: 'error',
          message: `Status updated, but notification failed: ${notificationResult.error}`,
        });
      }

      onApplicationsChanged();

      // Update selected app if it's the one being viewed
      if (selectedApp?.id === app.id) {
        setSelectedApp({ ...app, status: newStatus });
      }

      setTimeout(() => setNotificationStatus(null), 5000);
    } catch (err) {
      setNotificationStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update status',
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleRate = async (app: Application, rating: number) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ rating })
        .eq('id', app.id);
      if (error) throw error;
      onApplicationsChanged();
      if (selectedApp?.id === app.id) {
        setSelectedApp({ ...app, rating });
      }
    } catch (err) {
      setNotificationStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update rating',
      });
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const handleDownloadResume = (app: Application) => {
    if (app.resume_url) {
      window.open(app.resume_url, '_blank');
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Applicant Management</h2>
        <p className="text-slate-500 text-sm mt-1">Review, rate, and manage candidates across all job postings</p>
      </div>

      {/* Notification banner */}
      {notificationStatus && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium ${
            notificationStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {notificationStatus.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {notificationStatus.message}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or job title..."
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>

          {/* Job filter */}
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white"
          >
            <option value="all">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white"
          >
            <option value="all">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Rating filter */}
          <select
            value={ratingFilter ?? ''}
            onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white"
          >
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="5">5 Stars</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || jobFilter !== 'all' || ratingFilter !== null) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setJobFilter('all');
                setRatingFilter(null);
              }}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          Showing {filteredApps.length} of {applications.length} applicants
        </div>
      </div>

      {/* Applicants table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No applicants found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Candidate</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Job</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Rating</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Applied</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const job = jobMap.get(app.job_id);
                  const colors = STATUS_COLORS[app.status];
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                            {app.candidate_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{app.candidate_name}</p>
                            <p className="text-xs text-slate-500 truncate">{app.candidate_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-700 truncate max-w-[180px]">{job?.title || '—'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{job?.department}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {app.rating !== null ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`w-3.5 h-3.5 ${
                                  n <= app.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not rated</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-500">{formatDate(app.created_at)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {app.resume_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadResume(app);
                              }}
                              className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Download resume"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(app);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applicant Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-xl font-bold text-white">
                  {selectedApp.candidate_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.candidate_name}</h3>
                  <p className="text-sm text-slate-500">{selectedApp.candidate_email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Job & applied date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Applied for</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {jobMap.get(selectedApp.job_id)?.title || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Applied on</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(selectedApp.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{selectedApp.candidate_email}</span>
                </div>
                {selectedApp.candidate_phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{selectedApp.candidate_phone}</span>
                  </div>
                )}
                {jobMap.get(selectedApp.job_id)?.location && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{jobMap.get(selectedApp.job_id)?.location}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Candidate Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleRate(selectedApp, n)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          n <= (selectedApp.rating ?? 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  {selectedApp.rating !== null && (
                    <span className="ml-2 text-sm text-slate-500">{selectedApp.rating}/5</span>
                  )}
                </div>
              </div>

              {/* Cover letter */}
              {selectedApp.cover_letter && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">Cover Letter</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                    {selectedApp.cover_letter}
                  </div>
                </div>
              )}

              {/* Resume */}
              {selectedApp.resume_url && (
                <div className="flex items-center justify-between p-4 bg-sky-50 rounded-lg border border-sky-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Resume / CV</p>
                      <p className="text-xs text-slate-500">{selectedApp.candidate_name.replace(/\s+/g, '-').toLowerCase()}-resume.pdf</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadResume(selectedApp)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 bg-white hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}

              {/* Status change */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm font-medium text-slate-700 mb-3">Application Status</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {APPLICATION_STATUSES.map((status) => {
                    const colors = STATUS_COLORS[status];
                    const isActive = selectedApp.status === status;
                    const isUpdating = statusUpdating === selectedApp.id;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedApp, status)}
                        disabled={isUpdating || isActive}
                        className={`relative flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                          isActive
                            ? `${colors.bg} ${colors.text} ${colors.border} cursor-default`
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        {status}
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Changing status sends an automatic email notification to the candidate
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
