import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { JobCard } from '@/components/JobCard';
import { useAuth } from '@/context/AuthContext';
import type { Job, SavedJob } from '@/types';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS, EXPERIENCE_LABELS, JOB_TYPE_LABELS } from '@/types';

interface Filters {
  search: string;
  category: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
  sort: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'salary-high', label: 'Highest Salary' },
  { value: 'salary-low', label: 'Lowest Salary' },
  { value: 'title', label: 'Job Title A-Z' },
];

export function JobListingsPage() {
  const { navigate, path } = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const query = new URLSearchParams(path.split('?')[1] || '');
  const currentPage = parseInt(query.get('page') || '1', 10);
  const pageSize = 6;

  const [filters, setFilters] = useState<Filters>({
    search: query.get('q') || '',
    category: query.get('category') || '',
    location: query.get('location') || '',
    jobType: query.get('jobType') || '',
    experienceLevel: query.get('exp') || '',
    salaryMin: query.get('salary') || '',
    sort: query.get('sort') || 'newest',
  });

  const buildQueryUrl = useCallback((f: Filters, page: number) => {
    const params = new URLSearchParams();
    if (f.search) params.set('q', f.search);
    if (f.category) params.set('category', f.category);
    if (f.location) params.set('location', f.location);
    if (f.jobType) params.set('jobType', f.jobType);
    if (f.experienceLevel) params.set('exp', f.experienceLevel);
    if (f.salaryMin) params.set('salary', f.salaryMin);
    if (f.sort && f.sort !== 'newest') params.set('sort', f.sort);
    if (page > 1) params.set('page', String(page));
    return `/jobs?${params.toString()}`;
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('jobs')
      .select('*, company:companies(*)', { count: 'exact' })
      .eq('is_active', true);

    if (filters.search) {
      q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.location) q = q.ilike('location', `%${filters.location}%`);
    if (filters.jobType) q = q.eq('job_type', filters.jobType);
    if (filters.experienceLevel) q = q.eq('experience_level', filters.experienceLevel);
    if (filters.salaryMin) q = q.gte('salary_min', parseInt(filters.salaryMin, 10));

    switch (filters.sort) {
      case 'oldest':
        q = q.order('created_at', { ascending: true });
        break;
      case 'salary-high':
        q = q.order('salary_max', { ascending: false, nullsFirst: false });
        break;
      case 'salary-low':
        q = q.order('salary_min', { ascending: true, nullsFirst: false });
        break;
      case 'title':
        q = q.order('title', { ascending: true });
        break;
      default:
        q = q.order('created_at', { ascending: false });
    }

    const from = (currentPage - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);

    const { data, error, count } = await q;
    if (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } else {
      setJobs((data || []) as unknown as Job[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [filters, currentPage]);

  const fetchSavedJobs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
    if (data) {
      setSavedJobIds(new Set((data as Pick<SavedJob, 'job_id'>[]).map((d) => d.job_id)));
    }
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchSavedJobs(); }, [fetchSavedJobs]);

  const totalPages = Math.ceil(totalCount / pageSize);

  function updateFilter(key: keyof Filters, value: string) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    navigate(buildQueryUrl(newFilters, 1));
  }

  function applyFilters() {
    navigate(buildQueryUrl(filters, 1));
    setShowFilters(false);
  }

  function clearFilters() {
    const empty: Filters = {
      search: '', category: '', location: '', jobType: '', experienceLevel: '', salaryMin: '', sort: 'newest',
    };
    setFilters(empty);
    navigate('/jobs');
    setShowFilters(false);
  }

  async function toggleSave(jobId: string) {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (savedJobIds.has(jobId)) {
      await supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('user_id', user.id);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } else {
      await supabase.from('saved_jobs').insert({ job_id: jobId, user_id: user.id });
      setSavedJobIds((prev) => new Set(prev).add(jobId));
    }
  }

  const activeFilterCount = useMemo(() => {
    return [filters.category, filters.location, filters.jobType, filters.experienceLevel, filters.salaryMin].filter(Boolean).length;
  }, [filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Browse Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {loading ? 'Loading...' : `${totalCount} job${totalCount !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search job titles, keywords..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
            activeFilterCount > 0
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop filters sidebar */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <FilterPanel filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} />
        </aside>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <div className="absolute left-0 top-0 h-full w-80 overflow-y-auto bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <FilterPanel filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} />
              <button
                onClick={applyFilters}
                className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Job results */}
        <div className="flex-1">
          {/* Sort dropdown */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <ActiveFilterTag label={filters.category} onClear={() => updateFilter('category', '')} />
              )}
              {filters.jobType && (
                <ActiveFilterTag label={JOB_TYPE_LABELS[filters.jobType as keyof typeof JOB_TYPE_LABELS] || filters.jobType} onClear={() => updateFilter('jobType', '')} />
              )}
              {filters.experienceLevel && (
                <ActiveFilterTag label={EXPERIENCE_LABELS[filters.experienceLevel as keyof typeof EXPERIENCE_LABELS] || filters.experienceLevel} onClear={() => updateFilter('experienceLevel', '')} />
              )}
              {filters.location && (
                <ActiveFilterTag label={filters.location} onClear={() => updateFilter('location', '')} />
              )}
              {filters.salaryMin && (
                <ActiveFilterTag label={`$${parseInt(filters.salaryMin) / 1000}k+`} onClear={() => updateFilter('salaryMin', '')} />
              )}
            </div>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-slate-200" />
                      <div className="h-3 w-1/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No jobs found matching your criteria.</p>
              <button onClick={clearFilters} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={savedJobIds.has(job.id)}
                    onToggleSave={() => toggleSave(job.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigate(buildQueryUrl(filters, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => navigate(buildQueryUrl(filters, page))}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                            page === currentPage
                              ? 'bg-slate-900 text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => navigate(buildQueryUrl(filters, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ filters, updateFilter, clearFilters }: {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  clearFilters: () => void;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-900">Clear all</button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Category</label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
          <option value="">All Categories</option>
          {JOB_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Location</label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            placeholder="City or state"
            className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Job Type</label>
        <select
          value={filters.jobType}
          onChange={(e) => updateFilter('jobType', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
          <option value="">All Types</option>
          {JOB_TYPES.map((type) => (
            <option key={type} value={type}>{JOB_TYPE_LABELS[type]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Experience Level</label>
        <select
          value={filters.experienceLevel}
          onChange={(e) => updateFilter('experienceLevel', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
          <option value="">All Levels</option>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level} value={level}>{EXPERIENCE_LABELS[level]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Minimum Salary</label>
        <select
          value={filters.salaryMin}
          onChange={(e) => updateFilter('salaryMin', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
          <option value="">Any salary</option>
          <option value="50000">$50k+</option>
          <option value="80000">$80k+</option>
          <option value="100000">$100k+</option>
          <option value="120000">$120k+</option>
          <option value="150000">$150k+</option>
          <option value="200000">$200k+</option>
        </select>
      </div>
    </div>
  );
}

function ActiveFilterTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {label}
      <button onClick={onClear} className="text-slate-400 hover:text-slate-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
