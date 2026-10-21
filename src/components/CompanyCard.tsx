import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { Company } from '@/lib/supabase';

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link to={`/companies/${company.slug}`}>
      <Card hoverable className="p-5 text-center h-full">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 overflow-hidden">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8" />
          )}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mt-3 truncate">
          {company.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {company.industry || 'Industry'}
        </p>
        {company.location && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {company.location}
          </p>
        )}
      </Card>
    </Link>
  );
}
