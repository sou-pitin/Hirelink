import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, MapPin, Clock, Building2, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Job, JobType } from '@/types';
import { useAuth } from '@/context/AuthContext';

const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-Time',
  'part-time': 'Part-Time',
  'contract': 'Contract',
  'remote': 'Remote',
};

export default function Jobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select('*, employer:profiles!jobs_employer_id_fkey(*)')
      .in('status', ['approved', 'active'])
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company.ilike.%${search}%`);
    }
    if (jobTypeFilter !== 'all') {
      query = query.eq('job_type', jobTypeFilter);
    }
    if (locationFilter) {
      query = query.ilike('location', `%${locationFilter}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading jobs:', error);
    } else {
      setJobs((data as Job[]) ?? []);
    }
    setLoading(false);
  }, [search, jobTypeFilter, locationFilter]);

  useEffect(() => {
    const timer = setTimeout(loadJobs, 200);
    return () => clearTimeout(timer);
  }, [loadJobs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
        <p className="text-gray-500 mt-1">Browse {jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by title, company, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
          </select>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Job listings */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No jobs found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="card p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-700 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500">{job.company}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" /> {job.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Briefcase className="w-4 h-4" /> {JOB_TYPE_LABELS[job.job_type]}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-4 h-4" /> {timeAgo(job.created_at)}
                    </span>
                    {job.salary_range && (
                      <span className="badge-info">{job.salary_range}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!profile && (
        <div className="card p-6 bg-primary-50/50 border-primary-200 text-center">
          <p className="text-sm text-gray-600">
            <Link to="/signin" className="text-primary-600 font-medium">Sign in</Link> to apply for jobs and track your applications.
          </p>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
}

export { timeAgo };
