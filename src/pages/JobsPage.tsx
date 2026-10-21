import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Briefcase } from 'lucide-react';
import { supabase, type Job } from '@/lib/supabase';
import { JobCard } from '@/components/JobCard';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState<string>('');
  const [experience, setExperience] = useState<string>('');

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select('*, company:companies(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (jobType) {
        query = query.eq('job_type', jobType);
      }
      if (experience) {
        query = query.eq('experience_level', experience);
      }

      const { data } = await query.limit(50);
      setJobs((data as Job[]) || []);
      setLoading(false);
    }
    loadJobs();
  }, [searchTerm, location, jobType, experience]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (location) params.set('location', location);
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchTerm('');
    setLocation('');
    setJobType('');
    setExperience('');
    setSearchParams(new URLSearchParams());
  }

  const jobTypes = [
    { value: '', label: 'All Types' },
    { value: 'full_time', label: 'Full-Time' },
    { value: 'part_time', label: 'Part-Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ];

  const expLevels = [
    { value: '', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'lead', label: 'Lead' },
    { value: 'executive', label: 'Executive' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Search header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="container-app py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Browse Jobs
          </h1>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, keyword, or company"
                className="pl-10"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="pl-10"
              />
            </div>
            <Button type="submit" size="md">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Filters sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Filters
                </h3>
                {(jobType || experience) && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {jobTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {expLevels.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Job listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading
                  ? 'Loading...'
                  : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-40 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-700 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  No jobs found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
