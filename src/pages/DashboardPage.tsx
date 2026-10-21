import { useState, useEffect } from 'react';
import { Briefcase, Bookmark, FileText, TrendingUp, CheckCircle, Clock, Users, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { JobCard } from '@/components/JobCard';
import type { Application, SavedJob, Job, ApplicationStatus } from '@/types';
import { formatSalary, timeAgo } from '@/lib/utils';
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS } from '@/types';

type Tab = 'overview' | 'applications' | 'saved';

const STATUS_CONFIG: Record<ApplicationStatus, { color: string; bg: string; icon: typeof CheckCircle }> = {
  Applied: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
  Reviewing: { color: 'text-amber-700', bg: 'bg-amber-50', icon: Users },
  Interview: { color: 'text-violet-700', bg: 'bg-violet-50', icon: Users },
  Offer: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  Rejected: { color: 'text-rose-700', bg: 'bg-rose-50', icon: XCircle },
};

export function DashboardPage() {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<(SavedJob & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    async function fetchData() {
      if (!user) return;
      const [{ data: apps }, { data: saved }] = await Promise.all([
        supabase
          .from('applications')
          .select('*, job:jobs(*, company:companies(*))')
          .eq('seeker_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('saved_jobs')
          .select('*, job:jobs(*, company:companies(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      setApplications((apps || []) as unknown as Application[]);
      setSavedJobs((saved || []) as unknown as (SavedJob & { job?: Job })[]);
      setLoading(false);
    }
    fetchData();
  }, [user, navigate]);

  if (!user) return null;

  const stats = {
    applied: applications.length,
    reviewing: applications.filter((a) => a.status === 'Reviewing').length,
    interview: applications.filter((a) => a.status === 'Interview').length,
    offer: applications.filter((a) => a.status === 'Offer').length,
    saved: savedJobs.length,
  };

  const filteredApps = statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
        <p className="mt-1 text-sm text-slate-500">Track your applications and manage your job search</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Applied" value={stats.applied} icon={Briefcase} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Reviewing" value={stats.reviewing} icon={Users} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Interviews" value={stats.interview} icon={Clock} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="Saved Jobs" value={stats.saved} icon={Bookmark} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
        <TabButton active={tab === 'applications'} onClick={() => setTab('applications')}>
          Applications ({applications.length})
        </TabButton>
        <TabButton active={tab === 'saved'} onClick={() => setTab('saved')}>
          Saved Jobs ({savedJobs.length})
        </TabButton>
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Applications</h3>
              <button onClick={() => setTab('applications')} className="text-sm text-slate-500 hover:text-slate-900">
                View all →
              </button>
            </div>
            {applications.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No applications yet.{' '}
                <button onClick={() => navigate('/jobs')} className="font-medium text-slate-900 hover:underline">Browse jobs</button>
              </p>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 4).map((app) => {
                  const config = STATUS_CONFIG[app.status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={app.id}
                      onClick={() => app.job && navigate(`/jobs/${app.job!.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{app.job?.title}</p>
                        <p className="truncate text-xs text-slate-500">{app.job?.company?.name}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Saved Jobs</h3>
              <button onClick={() => setTab('saved')} className="text-sm text-slate-500 hover:text-slate-900">
                View all →
              </button>
            </div>
            {savedJobs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No saved jobs.{' '}
                <button onClick={() => navigate('/jobs')} className="font-medium text-slate-900 hover:underline">Browse jobs</button>
              </p>
            ) : (
              <div className="space-y-3">
                {savedJobs.slice(0, 4).map((saved) => (
                  saved.job && (
                    <div
                      key={saved.id}
                      onClick={() => navigate(`/jobs/${saved.job!.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{saved.job.title}</p>
                        <p className="truncate text-xs text-slate-500">{saved.job.company?.name} · {saved.job.location}</p>
                      </div>
                      <span className="text-xs text-slate-400">{timeAgo(saved.created_at)}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-5 lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">AI Job Recommendations</h3>
                <p className="text-sm text-slate-300">Discover jobs matched to your skills and profile</p>
              </div>
              <button
                onClick={() => navigate('/recommendations')}
                className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                View <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications tab */}
      {tab === 'applications' && (
        <div>
          {/* Status filter pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
              All ({applications.length})
            </FilterPill>
            {(['Applied', 'Reviewing', 'Interview', 'Offer', 'Rejected'] as ApplicationStatus[]).map((status) => {
              const count = applications.filter((a) => a.status === status).length;
              if (count === 0) return null;
              return (
                <FilterPill key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
                  {status} ({count})
                </FilterPill>
              );
            })}
          </div>

          {filteredApps.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">No applications in this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => {
                const config = STATUS_CONFIG[app.status];
                const Icon = config.icon;
                return (
                  <div
                    key={app.id}
                    onClick={() => app.job && navigate(`/jobs/${app.job!.id}`)}
                    className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 group-hover:text-slate-700">{app.job?.title}</p>
                      <p className="truncate text-sm text-slate-500">
                        {app.job?.company?.name} · {app.job?.location}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium text-slate-700">{formatSalary(app.job?.salary_min ?? null, app.job?.salary_max ?? null)}</p>
                      <p className="text-xs text-slate-400">Applied {timeAgo(app.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                      {app.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Saved jobs tab */}
      {tab === 'saved' && (
        <div>
          {savedJobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Bookmark className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">You haven't saved any jobs yet.</p>
              <button onClick={() => navigate('/jobs')} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
                Browse jobs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((saved) =>
                saved.job && (
                  <JobCard
                    key={saved.id}
                    job={saved.job}
                    saved
                    onToggleSave={async () => {
                      await supabase.from('saved_jobs').delete().eq('id', saved.id);
                      setSavedJobs((prev) => prev.filter((s) => s.id !== saved.id));
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string;
  value: number;
  icon: typeof Briefcase;
  color: string;
  bg: string;
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

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
