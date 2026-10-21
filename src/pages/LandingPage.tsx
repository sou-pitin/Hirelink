import { useState, useEffect } from 'react';
import { Search, Briefcase, MapPin, ArrowRight, TrendingUp, Users, FileText, Bell, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { JobCard } from '@/components/JobCard';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { Job, Company } from '@/types';

export function LandingPage() {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0 });

  useEffect(() => {
    async function fetchData() {
      const [{ data: jobs }, { data: companies }, { count: jobCount }, { count: compCount }] = await Promise.all([
        supabase.from('jobs').select('*, company:companies(*)').eq('is_active', true).order('created_at', { ascending: false }).limit(6),
        supabase.from('companies').select('*').limit(4),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
      ]);
      setFeaturedJobs((jobs || []) as unknown as Job[]);
      setTopCompanies((companies || []).map((c: Record<string, unknown>) => c as unknown as Company));
      setStats({ jobs: jobCount || 0, companies: compCount || 0 });
    }
    fetchData();
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchLocation) params.set('location', searchLocation);
    navigate(`/jobs?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              AI-powered job matching
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find your next
              <span className="block text-slate-500">career opportunity</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
              Browse thousands of jobs, get AI-powered recommendations, and track your applications — all in one place.
            </p>

            {/* Search bar */}
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Job title or keyword"
                    className="w-full rounded-xl border-0 py-3 pl-11 pr-4 text-sm outline-none ring-1 ring-inset ring-slate-200 transition focus:ring-slate-400"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Location"
                    className="w-full rounded-xl border-0 py-3 pl-11 pr-4 text-sm outline-none ring-1 ring-inset ring-slate-200 transition focus:ring-slate-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Search
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {stats.jobs} open positions</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {stats.companies} companies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need for your job search</h2>
            <p className="mt-2 text-slate-500">Powerful tools to help you find, apply, and land your next role</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={Sparkles} title="AI Recommendations" desc="Get personalized job matches based on your skills and experience" color="text-amber-600" bg="bg-amber-50" onClick={() => navigate('/recommendations')} />
            <FeatureCard icon={FileText} title="Resume Builder" desc="Create professional resumes with our easy-to-use builder" color="text-blue-600" bg="bg-blue-50" onClick={() => navigate('/resume-builder')} />
            <FeatureCard icon={Bell} title="Job Alerts" desc="Save your search criteria and get notified of new matches" color="text-emerald-600" bg="bg-emerald-50" onClick={() => navigate('/job-alerts')} />
            <FeatureCard icon={TrendingUp} title="Application Tracker" desc="Track your applications from submitted to offer" color="text-violet-600" bg="bg-violet-50" onClick={() => navigate('/dashboard')} />
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      {featuredJobs.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Featured Jobs</h2>
                <p className="mt-1 text-sm text-slate-500">Recently posted opportunities</p>
              </div>
              <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
        </section>
      )}

      {/* Top companies */}
      {topCompanies.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Top Companies</h2>
                <p className="mt-1 text-sm text-slate-500">Discover great places to work</p>
              </div>
              <button onClick={() => navigate('/companies')} className="flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topCompanies.map((comp) => (
                <button key={comp.id} onClick={() => navigate(`/companies/${comp.id}`)}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all hover:border-slate-300 hover:shadow-md">
                  <div className="flex justify-center"><CompanyLogo name={comp.name} logoUrl={comp.logo_url} size="xl" /></div>
                  <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-slate-700">{comp.name}</h3>
                  <p className="text-sm text-slate-500">{comp.industry}</p>
                  <p className="mt-1 text-xs text-slate-400">{comp.location}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-center lg:p-16">
            <h2 className="text-3xl font-bold text-white">Ready to find your next job?</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-300">
              Create a free account, build your resume, and start applying to thousands of jobs today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => navigate('/signup')}
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/jobs')}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                Browse Jobs
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free forever</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card needed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, bg, onClick }: {
  icon: typeof Sparkles; title: string; desc: string; color: string; bg: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-slate-300 hover:shadow-md">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </button>
  );
}
