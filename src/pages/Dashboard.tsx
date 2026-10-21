import { Link } from 'react-router-dom';
import {
  Briefcase, FileText, Mail, TrendingUp, Users, Clock, CheckCircle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { profile } = useAuth();
  if (!profile) return null;

  const firstName = profile.full_name.split(' ')[0];
  const isEmployer = profile.role === 'employer';
  const isCandidate = profile.role === 'candidate';
  const isAdmin = profile.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <div className="flex items-center gap-3 mt-2">
          <RoleBadge role={profile.role} />
          {isEmployer && profile.company_name && (
            <span className="text-sm text-gray-500">at {profile.company_name}</span>
          )}
        </div>
      </div>

      {/* Quick stats cards — role-specific */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isCandidate && (
          <>
            <StatCard icon={FileText} label="Applications" value="—" color="primary" />
            <StatCard icon={Mail} label="Messages" value="—" color="accent" />
            <StatCard icon={Briefcase} label="Open Jobs" value="Browse" color="warning" link="/jobs" />
            <StatCard icon={Clock} label="Recent Activity" value="—" color="gray" />
          </>
        )}
        {isEmployer && (
          <>
            <StatCard icon={Briefcase} label="My Job Posts" value="Manage" color="primary" link="/employer/jobs" />
            <StatCard icon={Users} label="Applicants" value="View" color="accent" link="/employer/jobs" />
            <StatCard icon={Mail} label="Messages" value="—" color="warning" link="/messages" />
            <StatCard icon={Clock} label="Pending Approval" value="—" color="gray" />
          </>
        )}
        {isAdmin && (
          <>
            <StatCard icon={Users} label="Users" value="Manage" color="primary" link="/admin" />
            <StatCard icon={Briefcase} label="Job Approvals" value="Review" color="warning" link="/admin" />
            <StatCard icon={FileText} label="Blog Posts" value="Edit" color="accent" link="/admin/blog" />
            <StatCard icon={TrendingUp} label="Site Stats" value="View" color="gray" link="/admin" />
          </>
        )}
      </div>

      {/* Action cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isCandidate && (
          <>
            <ActionCard
              icon={Briefcase}
              title="Browse Jobs"
              desc="Search and apply to open positions"
              link="/jobs"
            />
            <ActionCard
              icon={FileText}
              title="My Applications"
              desc="Track your submitted applications"
              link="/applications"
            />
            <ActionCard
              icon={Mail}
              title="Messages"
              desc="View messages from employers"
              link="/messages"
            />
          </>
        )}
        {isEmployer && (
          <>
            <ActionCard
              icon={Briefcase}
              title="Post a Job"
              desc="Create a new job listing"
              link="/employer/jobs/new"
            />
            <ActionCard
              icon={FileText}
              title="Manage Jobs"
              desc="View and edit your job postings"
              link="/employer/jobs"
            />
            <ActionCard
              icon={Mail}
              title="Messages"
              desc="Message candidates"
              link="/messages"
            />
          </>
        )}
        {isAdmin && (
          <>
            <ActionCard
              icon={Users}
              title="Manage Users"
              desc="View and manage all platform users"
              link="/admin"
            />
            <ActionCard
              icon={CheckCircle}
              title="Approve Jobs"
              desc="Review pending job submissions"
              link="/admin"
            />
            <ActionCard
              icon={FileText}
              title="Blog Editor"
              desc="Write and publish career advice"
              link="/admin/blog"
            />
          </>
        )}
        <ActionCard
          icon={Briefcase}
          title="View Job Board"
          desc="Browse all approved jobs"
          link="/jobs"
        />
        <ActionCard
          icon={Briefcase}
          title="Career Blog"
          desc="Read career advice and tips"
          link="/blog"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, link,
}: {
  icon: typeof Briefcase; label: string; value: string; color: string; link?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    warning: 'bg-warning-50 text-warning-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const content = (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {link && <ArrowRight className="w-4 h-4 text-gray-300" />}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

function ActionCard({
  icon: Icon, title, desc, link,
}: {
  icon: typeof Briefcase; title: string; desc: string; link: string;
}) {
  return (
    <Link to={link} className="card p-6 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-semibold mt-4">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}
