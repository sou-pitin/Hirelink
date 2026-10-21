import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, FileText, Briefcase, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { EXPERIENCE_LEVELS, EXPERIENCE_LABELS } from '@/types';
import type { Profile } from '@/types';

export function ProfileSettingsPage() {
  const { navigate } = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    if (profile) setForm(profile);
  }, [user, profile, navigate]);

  async function handleSave() {
    if (!form || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        bio: form.bio,
        phone: form.phone,
        location: form.location,
        experience_level: form.experience_level,
        skills: form.skills,
        current_title: form.current_title,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) { alert('Failed to save: ' + error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refreshProfile();
  }

  function addSkill() {
    if (!form || !newSkill.trim()) return;
    setForm({ ...form, skills: [...form.skills, newSkill.trim()] });
    setNewSkill('');
  }

  function removeSkill(idx: number) {
    if (!form) return;
    setForm({ ...form, skills: form.skills.filter((_, i) => i !== idx) });
  }

  if (!user || !form) {
    return <div className="mx-auto max-w-2xl px-4 py-12"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Update your personal information and preferences</p>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-2 gap-4">
            <Field icon={User} label="Full Name">
              <input type="text" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
            </Field>
            <Field icon={Mail} label="Email">
              <input type="email" value={form.email} disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400" />
            </Field>
            <Field icon={Phone} label="Phone">
              <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
            </Field>
            <Field icon={MapPin} label="Location">
              <input type="text" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, State"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
            </Field>
            <Field icon={Briefcase} label="Current Title">
              <input type="text" value={form.current_title || ''} onChange={(e) => setForm({ ...form, current_title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
            </Field>
            <Field label="Experience Level">
              <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value as Profile['experience_level'] })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400">
                {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{EXPERIENCE_LABELS[l]}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Bio */}
        <Section title="Professional Bio">
          <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4} placeholder="Tell employers about your background, experience, and what you're looking for..."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <p className="mb-3 text-xs text-slate-500">Add skills to get better job recommendations</p>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((skill, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {skill}
                <button onClick={() => removeSkill(idx)} className="text-slate-400 hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Add a skill..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
            <button onClick={addSkill} className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </Section>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-600">Saved successfully!</span>}
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon?: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      {children}
    </div>
  );
}
