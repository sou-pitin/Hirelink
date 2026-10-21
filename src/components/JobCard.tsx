import { MapPin, DollarSign, Clock, Briefcase, Bookmark } from 'lucide-react';
import type { Job } from '@/types';
import { useRouter } from '@/context/RouterContext';
import { CompanyLogo } from '@/components/CompanyLogo';
import { formatSalary, timeAgo } from '@/lib/utils';
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS } from '@/types';

interface JobCardProps {
  job: Job;
  saved?: boolean;
  onToggleSave?: () => void;
}

export function JobCard({ job, saved, onToggleSave }: JobCardProps) {
  const { navigate } = useRouter();
  const company = job.company;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {company && <CompanyLogo name={company.name} logoUrl={company.logo_url} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-slate-700">
                {job.title}
              </h3>
              {company && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/companies/${company.id}`);
                  }}
                  className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
                >
                  {company.name}
                </button>
              )}
            </div>
            {onToggleSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
                className={`flex-shrink-0 rounded-lg p-1.5 transition ${
                  saved ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                <Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location || 'Remote'}
            </span>
            {job.remote_ok && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">Remote OK</span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {JOB_TYPE_LABELS[job.job_type]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {EXPERIENCE_LABELS[job.experience_level]}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {job.category}
            </span>
            <span className="text-xs text-slate-400">{timeAgo(job.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
