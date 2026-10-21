import { useState, useEffect } from 'react';
import { Search, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { Company } from '@/types';

export function CompaniesPage() {
  const { navigate } = useRouter();
  const [companies, setCompanies] = useState<(Company & { job_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*, jobs:jobs(count)')
        .ilike('name', `%${search}%`);
      if (error) {
        console.error(error);
      } else {
        setCompanies(
          (data || []).map((c: Record<string, unknown>) => ({
            ...(c as unknown as Company),
            job_count: (c.jobs as unknown[] | null)?.length ?? 0,
          }))
        );
      }
      setLoading(false);
    }
    const timer = setTimeout(fetchCompanies, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-slate-500">Discover companies and explore their open positions</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-3 w-16 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No companies found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => navigate(`/companies/${company.id}`)}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <CompanyLogo name={company.name} logoUrl={company.logo_url} size="lg" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900 group-hover:text-slate-700">{company.name}</h3>
                  <p className="text-sm text-slate-500">{company.industry}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-slate-500">{company.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.location}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                  {company.job_count} open {company.job_count === 1 ? 'job' : 'jobs'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
