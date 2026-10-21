import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/Modal';
import type { JobAlert } from '@/types';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS, EXPERIENCE_LABELS, JOB_TYPE_LABELS } from '@/types';
import { timeAgo } from '@/lib/utils';

export function JobAlertsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    search_query: '',
    category: '',
    location: '',
    job_type: '',
    experience_level: '',
    salary_min: '',
  });

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    fetchAlerts();
  }, [user, navigate]);

  async function fetchAlerts() {
    if (!user) return;
    const { data } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAlerts((data || []) as JobAlert[]);
    setLoading(false);
  }

  async function createAlert() {
    if (!user) return;
    const { error } = await supabase.from('job_alerts').insert({
      user_id: user.id,
      name: newAlert.name || 'Job Alert',
      search_query: newAlert.search_query || null,
      category: newAlert.category || null,
      location: newAlert.location || null,
      job_type: newAlert.job_type || null,
      experience_level: newAlert.experience_level || null,
      salary_min: newAlert.salary_min ? parseInt(newAlert.salary_min) : null,
      is_active: true,
    });
    if (error) { alert('Failed to create alert: ' + error.message); return; }
    setShowModal(false);
    setNewAlert({ name: '', search_query: '', category: '', location: '', job_type: '', experience_level: '', salary_min: '' });
    fetchAlerts();
  }

  async function toggleAlert(alert: JobAlert) {
    await supabase.from('job_alerts').update({ is_active: !alert.is_active }).eq('id', alert.id);
    setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, is_active: !a.is_active } : a));
  }

  async function deleteAlert(id: string) {
    await supabase.from('job_alerts').delete().eq('id', id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /></div>;
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">Get notified when new jobs match your saved search criteria</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          New Alert
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Bell className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No job alerts yet.</p>
          <p className="mt-1 text-sm text-slate-400">Create an alert to get notified about new matching jobs.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Create Alert
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${alert.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{alert.name}</h3>
                    <p className="text-xs text-slate-400">Created {timeAgo(alert.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlert(alert)}
                    className={`relative h-6 w-11 rounded-full transition ${alert.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${alert.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} className="text-slate-400 transition hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Alert criteria */}
              <div className="mt-4 flex flex-wrap gap-2">
                {alert.search_query && (
                  <Tag label={`"${alert.search_query}"`} />
                )}
                {alert.category && <Tag label={alert.category} />}
                {alert.location && <Tag label={alert.location} />}
                {alert.job_type && <Tag label={JOB_TYPE_LABELS[alert.job_type as keyof typeof JOB_TYPE_LABELS] || alert.job_type} />}
                {alert.experience_level && <Tag label={EXPERIENCE_LABELS[alert.experience_level as keyof typeof EXPERIENCE_LABELS] || alert.experience_level} />}
                {alert.salary_min && <Tag label={`$${alert.salary_min / 1000}k+`} />}
              </div>

              {alert.is_active ? (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                  <Mail className="h-3.5 w-3.5" />
                  Active - you'll be notified of new matches
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Paused
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Job Alert">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Alert Name</label>
            <input
              type="text"
              value={newAlert.name}
              onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
              placeholder="e.g. Senior React Jobs in NYC"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Keywords <span className="text-slate-400">(optional)</span></label>
            <input
              type="text"
              value={newAlert.search_query}
              onChange={(e) => setNewAlert({ ...newAlert, search_query: e.target.value })}
              placeholder="e.g. React, Python, Product Manager"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={newAlert.category}
                onChange={(e) => setNewAlert({ ...newAlert, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Any</option>
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
              <input
                type="text"
                value={newAlert.location}
                onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                placeholder="City or state"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Type</label>
              <select
                value={newAlert.job_type}
                onChange={(e) => setNewAlert({ ...newAlert, job_type: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Any</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience</label>
              <select
                value={newAlert.experience_level}
                onChange={(e) => setNewAlert({ ...newAlert, experience_level: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Any</option>
                {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{EXPERIENCE_LABELS[l]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Minimum Salary</label>
            <select
              value={newAlert.salary_min}
              onChange={(e) => setNewAlert({ ...newAlert, salary_min: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Any</option>
              <option value="50000">$50k+</option>
              <option value="80000">$80k+</option>
              <option value="100000">$100k+</option>
              <option value="120000">$120k+</option>
              <option value="150000">$150k+</option>
              <option value="200000">$200k+</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={createAlert} className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">
              Create Alert
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{label}</span>;
}
