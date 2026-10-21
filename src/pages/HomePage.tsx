import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  FileText,
  Send,
  Bell,
} from 'lucide-react';
import { supabase, type Job, type Company } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { JobCard } from '@/components/JobCard';
import { CompanyCard } from '@/components/CompanyCard';

export function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [jobsRes, companiesRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('*, company:companies(*)')
          .eq('status', 'active')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setFeaturedJobs((jobsRes.data as Job[]) || []);
      setTopCompanies((companiesRes.data as Company[]) || []);
      setLoading(false);
    }
    loadData();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (searchLocation) params.set('location', searchLocation);
    navigate(`/jobs?${params.toString()}`);
  }

  const stats = [
    { label: 'Active Jobs', value: '1,200+', icon: Briefcase },
    { label: 'Companies', value: '450+', icon: Building2 },
    { label: 'Job Seekers', value: '15,000+', icon: Users },
    { label: 'Hired', value: '3,200+', icon: TrendingUp },
  ];

  const howItWorks = [
    {
      icon: FileText,
      title: 'Create Your Profile',
      description:
        'Sign up in minutes and build a professional profile that showcases your skills and experience.',
    },
    {
      icon: Search,
      title: 'Search & Apply',
      description:
        'Browse thousands of job listings, filter by your preferences, and apply with a single click.',
    },
    {
      icon: Bell,
      title: 'Get Notified',
      description:
        'Receive instant alerts when employers view your application or new jobs match your criteria.',
    },
    {
      icon: Send,
      title: 'Get Hired',
      description:
        'Connect with employers, ace your interviews, and land your dream job with HireLink.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-300 rounded-full blur-3xl" />
        </div>

        <div className="relative container-app py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="accent" className="mb-4 text-sm px-4 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline" />
              Trusted by 15,000+ professionals
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Find Your Next
              <span className="block text-accent-200">Great Opportunity</span>
            </h1>
            <p className="mt-6 text-lg text-primary-100 max-w-2xl mx-auto">
              Discover thousands of job openings from top companies. Connect with
              employers and take the next step in your career.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-3 md:p-4 flex flex-col md:flex-row gap-3 max-w-3xl mx-auto"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Job title, keyword, or company"
                  className="w-full py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 md:border-l md:border-gray-200 dark:md:border-slate-700">
                <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Location or remote"
                  className="w-full py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
                />
              </div>
              <Button type="submit" size="lg" className="md:px-8">
                <Search className="h-5 w-5" />
                Search
              </Button>
            </form>

            {/* Popular tags */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-primary-200">Popular:</span>
              {['Engineering', 'Design', 'Marketing', 'Sales', 'Remote'].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/jobs?q=${tag}`)}
                    className="text-sm text-primary-100 hover:text-white px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-app py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 md:py-20">
        <div className="container-app">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Featured Jobs
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Hand-picked opportunities from top employers
              </p>
            </div>
            <Link
              to="/jobs"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all"
            >
              View all jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : featuredJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No featured jobs available yet. Check back soon!
              </p>
            </Card>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/jobs">
              <Button variant="outline" fullWidth>
                View all jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="container-app">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Top Companies
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Discover employers hiring right now
              </p>
            </div>
            <Link
              to="/companies"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all"
            >
              View all companies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : topCompanies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {topCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No companies listed yet.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              How HireLink Works
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">
              Get started in minutes with our simple, streamlined process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="relative">
                <Card className="p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-gray-200 dark:text-slate-700">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    {step.description}
                  </p>
                </Card>

                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="h-5 w-5 text-gray-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary-600 to-accent-700 dark:from-primary-800 dark:to-slate-950">
        <div className="container-app">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              Ready to Take the Next Step?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Join thousands of professionals who found their dream job through
              HireLink. It's free to get started.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100">
                  Sign Up as Job Seeker
                </Button>
              </Link>
              <Link to="/signup?type=employer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Hire Talent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
