import { useState, useEffect, useCallback } from 'react';
import { Users, Briefcase, FileText, TrendingUp, CheckCircle, XCircle, Trash2, Clock, BarChart3, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile, Job, BlogPost, JobStatus, UserRole } from '@/types';
import { RoleBadge } from '@/components/ProtectedRoute';
import { timeAgo } from '@/pages/Jobs';

type TabType = 'overview' | 'users' | 'jobs' | 'blog';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<TabType>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    totalApplications: 0,
    totalBlogPosts: 0,
    publishedBlogPosts: 0,
    candidates: 0,
    employers: 0,
    admins: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [pendingJobsList, setPendingJobsList] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [usersRes, jobsRes, appsRes, blogRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('id'),
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
    ]);

    const users = (usersRes.data as Profile[]) ?? [];
    const jobs = (jobsRes.data as Job[]) ?? [];
    const posts = (blogRes.data as BlogPost[]) ?? [];
    const apps = appsRes.data ?? [];

    setAllUsers(users);
    setAllJobs(jobs);
    setBlogPosts(posts);
    setRecentUsers(users.slice(0, 5));
    setPendingJobsList(jobs.filter((j) => j.status === 'pending'));

    setStats({
      totalUsers: users.length,
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === 'pending').length,
      approvedJobs: jobs.filter((j) => j.status === 'approved').length,
      totalApplications: apps.length,
      totalBlogPosts: posts.length,
      publishedBlogPosts: posts.filter((p) => p.status === 'published').length,
      candidates: users.filter((u) => u.role === 'candidate').length,
      employers: users.filter((u) => u.role === 'employer').length,
      admins: users.filter((u) => u.role === 'admin').length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateJobStatus(jobId: string, status: JobStatus) {
    await supabase.from('jobs').update({ status }).eq('id', jobId);

    // Find the job to get employer_id
    const job = allJobs.find((j) => j.id === jobId);
    if (job) {
      await supabase.from('notifications').insert({
        user_id: job.employer_id,
        type: 'job_status',
        title: `Job ${status}: ${job.title}`,
        body: status === 'approved'
          ? `Your job "${job.title}" has been approved and is now visible on the job board.`
          : `Your job "${job.title}" has been ${status}.`,
        link: '/employer/jobs',
        read: false,
      });
    }

    setAllJobs(jobs => jobs.map((j) => (j.id === jobId ? { ...j, status } : j)));
    setPendingJobsList(jobs => jobs.filter((j) => j.id !== jobId));
    setStats((prev) => ({
      ...prev,
      pendingJobs: prev.pendingJobs - (status !== 'pending' ? 1 : 0),
      approvedJobs: prev.approvedJobs + (status === 'approved' ? 1 : 0),
    }));
  }

  async function removeJob(jobId: string) {
    if (!confirm('Remove this job from the platform?')) return;
    await supabase.from('jobs').update({ status: 'removed' }).eq('id', jobId);
    setAllJobs(jobs => jobs.map((j) => (j.id === jobId ? { ...j, status: 'removed' as JobStatus } : j)));
  }

  async function updateProfileRole(userId: string, role: UserRole) {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setAllUsers(users => users.map((u) => (u.id === userId ? { ...u, role } : u)));
    setStats((prev) => {
      const user = allUsers.find((u) => u.id === userId);
      if (!user) return prev;
      const counts: Record<string, number> = {
        candidates: prev.candidates,
        employers: prev.employers,
        admins: prev.admins,
      };
      counts[user.role === 'candidate' ? 'candidates' : user.role === 'employer' ? 'employers' : 'admins']--;
      counts[role === 'candidate' ? 'candidates' : role === 'employer' ? 'employers' : 'admins']++;
      return { ...prev, candidates: counts.candidates, employers: counts.employers, admins: counts.admins };
    });
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this blog post?')) return;
    await supabase.from('blog_posts').delete().eq('id', postId);
    setBlogPosts(posts => posts.filter((p) => p.id !== postId));
  }

  if (loading) return <div className="animate-pulse text-gray-400">Loading admin dashboard...</div>;
  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, jobs, and site content</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {([
          { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
          { id: 'users' as TabType, label: 'Users', icon: Users },
          { id: 'jobs' as TabType, label: 'Jobs', icon: Briefcase },
          { id: 'blog' as TabType, label: 'Blog', icon: FileText },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            {t.id === 'jobs' && stats.pendingJobs > 0 && (
              <span className="badge-warning text-xs">{stats.pendingJobs}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="primary" />
            <StatCard icon={Briefcase} label="Total Jobs" value={stats.totalJobs} color="accent" />
            <div onClick={() => setTab('jobs')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <StatCard icon={Clock} label="Pending Jobs" value={stats.pendingJobs} color="warning" highlight={stats.pendingJobs > 0} />
            </div>
            <StatCard icon={FileText} label="Applications" value={stats.totalApplications} color="gray" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* User distribution chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                User Distribution
              </h3>
              <div className="space-y-3">
                <BarChart label="Candidates" value={stats.candidates} total={stats.totalUsers} color="bg-primary-500" />
                <BarChart label="Employers" value={stats.employers} total={stats.totalUsers} color="bg-accent-500" />
                <BarChart label="Admins" value={stats.admins} total={stats.totalUsers} color="bg-error-500" />
              </div>
            </div>

            {/* Job status chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent-600" />
                Job Status Breakdown
              </h3>
              <div className="space-y-3">
                <BarChart label="Approved" value={stats.approvedJobs} total={stats.totalJobs} color="bg-accent-500" />
                <BarChart label="Pending" value={stats.pendingJobs} total={stats.totalJobs} color="bg-warning-500" />
                <BarChart label="Rejected" value={allJobs.filter((j) => j.status === 'rejected').length} total={stats.totalJobs} color="bg-error-500" />
                <BarChart label="Removed" value={allJobs.filter((j) => j.status === 'removed').length} total={stats.totalJobs} color="bg-gray-400" />
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent users */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Users</h3>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-400">No users yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-400">{timeAgo(user.created_at)}</p>
                        </div>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending jobs */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Pending Job Approvals
                {stats.pendingJobs > 0 && (
                  <span className="badge-warning">{stats.pendingJobs}</span>
                )}
              </h3>
              {pendingJobsList.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-5 h-5 text-accent-500" />
                  No jobs pending approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingJobsList.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.company} · {timeAgo(job.created_at)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => updateJobStatus(job.id, 'approved')}
                          className="p-1.5 rounded-lg text-accent-600 hover:bg-accent-50 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, 'rejected')}
                          className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingJobsList.length > 5 && (
                    <button onClick={() => setTab('jobs')} className="text-sm text-primary-600 hover:text-primary-700">
                      View all pending jobs →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Blog stats */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-600" />
              Blog Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-3xl font-bold text-gray-900">{stats.totalBlogPosts}</p>
                <p className="text-sm text-gray-500 mt-1">Total Posts</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent-50">
                <p className="text-3xl font-bold text-accent-700">{stats.publishedBlogPosts}</p>
                <p className="text-sm text-gray-500 mt-1">Published</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning-50">
                <p className="text-3xl font-bold text-warning-700">{stats.totalBlogPosts - stats.publishedBlogPosts}</p>
                <p className="text-sm text-gray-500 mt-1">Drafts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">All Users ({allUsers.length})</h2>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{user.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => updateProfileRole(user.id, e.target.value as UserRole)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        disabled={user.id === profile.id}
                      >
                        <option value="candidate">Candidate</option>
                        <option value="employer">Employer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JOBS TAB */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">All Job Postings ({allJobs.length})</h2>
          {allJobs.length === 0 ? (
            <div className="card p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">No jobs posted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allJobs.map((job) => {
                const badge: Record<JobStatus, { class: string; label: string }> = {
                  approved: { class: 'badge-success', label: 'Approved' },
                  pending: { class: 'badge-warning', label: 'Pending' },
                  rejected: { class: 'badge-error', label: 'Rejected' },
                  removed: { class: 'badge-neutral', label: 'Removed' },
                };
                return (
                  <div key={job.id} className="card p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
                        <span className={badge[job.status].class}>{badge[job.status].label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{job.company} · {job.location || 'Remote'}</p>
                      <p className="text-xs text-gray-400 mt-1">Posted {timeAgo(job.created_at)}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {job.status !== 'approved' && (
                        <button
                          onClick={() => updateJobStatus(job.id, 'approved')}
                          className="btn-accent text-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {job.status !== 'rejected' && (
                        <button
                          onClick={() => updateJobStatus(job.id, 'rejected')}
                          className="btn-secondary text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                      {job.status !== 'removed' && (
                        <button
                          onClick={() => removeJob(job.id)}
                          className="btn-ghost text-error-500 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BLOG TAB */}
      {tab === 'blog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Blog Posts ({blogPosts.length})</h2>
            <a href="/admin/blog/new" className="btn-primary text-sm">
              <FileText className="w-4 h-4" /> New Post
            </a>
          </div>
          {blogPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">No blog posts yet. Create your first post.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blogPosts.map((post) => (
                <div key={post.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{post.title}</h3>
                      <span className={post.status === 'published' ? 'badge-success' : 'badge-neutral'}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{post.category.replace('-', ' ')}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {post.published_at
                        ? `Published ${timeAgo(post.published_at)}`
                        : `Updated ${timeAgo(post.updated_at)}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <a href={`/admin/blog/${post.id}/edit`} className="btn-secondary text-xs">
                      Edit
                    </a>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="btn-ghost text-error-500 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, highlight }: {
  icon: typeof Users; label: string; value: number; color: string; highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    warning: 'bg-warning-50 text-warning-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <div className={`card p-5 ${highlight ? 'ring-2 ring-warning-300' : ''}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function BarChart({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value} ({pct}%)</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}