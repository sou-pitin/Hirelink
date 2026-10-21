import { Briefcase, Users, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { JobWithApplicantCount, Application, Company } from '@/types';
import { STATUS_COLORS, type ApplicationStatus } from '@/types';

interface DashboardOverviewProps {
  company: Company | null;
  jobs: JobWithApplicantCount[];
  applications: Application[];
  onViewJobs: () => void;
  onViewApplicants: () => void;
}

export default function DashboardOverview({
  company,
  jobs,
  applications,
  onViewJobs,
  onViewApplicants,
}: DashboardOverviewProps) {
  const activeJobs = jobs.filter((j) => j.status === 'active');
  const totalApplicants = applications.length;
  const reviewingCount = applications.filter((a) => a.status === 'Reviewing').length;
  const interviewCount = applications.filter((a) => a.status === 'Interview').length;
  const offerCount = applications.filter((a) => a.status === 'Offer').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  const avgRating = applications.length > 0
    ? (applications.filter(a => a.rating !== null).reduce((sum, a) => sum + (a.rating || 0), 0) / Math.max(applications.filter(a => a.rating !== null).length, 1)).toFixed(1)
    : '0.0';

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: 'Active Jobs',
      value: activeJobs.length,
      icon: Briefcase,
      color: 'sky',
      trend: `${jobs.length} total`,
      trendUp: true,
    },
    {
      label: 'Total Applicants',
      value: totalApplicants,
      icon: Users,
      color: 'cyan',
      trend: '+12% this week',
      trendUp: true,
    },
    {
      label: 'In Interview',
      value: interviewCount,
      icon: TrendingUp,
      color: 'amber',
      trend: `${reviewingCount} reviewing`,
      trendUp: true,
    },
    {
      label: 'Offers Extended',
      value: offerCount,
      icon: Clock,
      color: 'emerald',
      trend: `${rejectedCount} rejected`,
      trendUp: offerCount > 0,
    },
  ];

  const colorClasses: Record<string, { bg: string; iconBg: string; text: string }> = {
    sky: { bg: 'bg-sky-50', iconBg: 'bg-sky-500', text: 'text-sky-600' },
    cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-500', text: 'text-cyan-600' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-500', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', text: 'text-emerald-600' },
  };

  const pipelineData = [
    { status: 'Reviewing' as ApplicationStatus, count: reviewingCount, percentage: totalApplicants > 0 ? (reviewingCount / totalApplicants) * 100 : 0 },
    { status: 'Interview' as ApplicationStatus, count: interviewCount, percentage: totalApplicants > 0 ? (interviewCount / totalApplicants) * 100 : 0 },
    { status: 'Offer' as ApplicationStatus, count: offerCount, percentage: totalApplicants > 0 ? (offerCount / totalApplicants) * 100 : 0 },
    { status: 'Rejected' as ApplicationStatus, count: rejectedCount, percentage: totalApplicants > 0 ? (rejectedCount / totalApplicants) * 100 : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back to {company?.name || 'your company'}'s hiring dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Avg. Candidate Rating</span>
          <span className="font-semibold text-slate-900">{avgRating}</span>
          <span className="text-amber-400">/ 5</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = colorClasses[stat.color];
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {stat.trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{stat.trend}</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-900">Application Pipeline</h3>
            <button
              onClick={onViewApplicants}
              className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-4">
            {pipelineData.map((stage) => {
              const colors = STATUS_COLORS[stage.status];
              return (
                <div key={stage.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <span className="text-sm font-medium text-slate-700">{stage.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{stage.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.dot} rounded-full transition-all duration-500`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Applicants</h3>
          <div className="space-y-3">
            {recentApplications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No applications yet</p>
            ) : (
              recentApplications.map((app) => {
                const colors = STATUS_COLORS[app.status];
                const job = jobs.find((j) => j.id === app.job_id);
                return (
                  <div key={app.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                      {app.candidate_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{app.candidate_name}</p>
                      <p className="text-xs text-slate-500 truncate">{job?.title || 'Unknown role'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} shrink-0`}>
                      {app.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Active Job Listings</h3>
          <button
            onClick={onViewJobs}
            className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Manage jobs →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeJobs.length === 0 ? (
            <p className="text-sm text-slate-400 col-span-2 text-center py-6">No active jobs</p>
          ) : (
            activeJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-sky-200 hover:bg-sky-50/30 transition-all duration-200"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.department} · {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{job.applicant_count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
