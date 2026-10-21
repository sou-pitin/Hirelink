import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need to be signed in to view this page.</p>
          <Link to="/signin" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500 text-sm mb-4">
            You don't have permission to access this page. This area is restricted to{' '}
            {allowedRoles.join(' and ')} accounts.
          </p>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleIcon({ role }: { role: UserRole }) {
  if (role === 'admin') return <Settings className="w-4 h-4" />;
  if (role === 'employer') return <Briefcase className="w-4 h-4" />;
  return <Mail className="w-4 h-4" />;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    admin: 'bg-error-100 text-error-700',
    employer: 'bg-accent-100 text-accent-700',
    candidate: 'bg-primary-100 text-primary-700',
  };
  const labels: Record<UserRole, string> = {
    admin: 'Admin',
    employer: 'Employer',
    candidate: 'Candidate',
  };
  return <span className={`badge ${styles[role]}`}>{labels[role]}</span>;
}
