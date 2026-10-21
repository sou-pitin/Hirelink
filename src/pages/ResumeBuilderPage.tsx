import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, Star, ArrowLeft, GripVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Resume, ResumeExperience, ResumeEducation } from '@/types';

export function ResumeBuilderPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    fetchResumes();
  }, [user, navigate]);

  async function fetchResumes() {
    if (!user) return;
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    const list = (data || []) as Resume[];
    setResumes(list);
    if (list.length > 0) setActiveResume(list[0]);
    setLoading(false);
  }

  async function createNewResume() {
    if (!user) return;
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: 'Untitled Resume',
        full_name: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        skills: [],
        experience: [],
        education: [],
        is_default: resumes.length === 0,
      })
      .select('*')
      .single();
    if (error) { alert('Failed to create resume: ' + error.message); return; }
    const newResume = data as unknown as Resume;
    setResumes([...resumes, newResume]);
    setActiveResume(newResume);
  }

  async function saveResume() {
    if (!activeResume) return;
    setSaving(true);
    const { error } = await supabase
      .from('resumes')
      .update({
        title: activeResume.title,
        full_name: activeResume.full_name,
        email: activeResume.email,
        phone: activeResume.phone,
        location: activeResume.location,
        summary: activeResume.summary,
        skills: activeResume.skills,
        experience: activeResume.experience,
        education: activeResume.education,
      })
      .eq('id', activeResume.id);
    setSaving(false);
    if (error) { alert('Failed to save: ' + error.message); return; }
    // Update local list
    setResumes((prev) => prev.map((r) => (r.id === activeResume.id ? activeResume : r)));
  }

  async function deleteResume(id: string) {
    if (!confirm('Delete this resume?')) return;
    await supabase.from('resumes').delete().eq('id', id);
    const remaining = resumes.filter((r) => r.id !== id);
    setResumes(remaining);
    setActiveResume(remaining[0] || null);
  }

  async function setDefault(id: string) {
    if (!user) return;
    // Unset all defaults, then set the selected one
    await supabase.from('resumes').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('resumes').update({ is_default: true }).eq('id', id);
    setResumes((prev) => prev.map((r) => ({ ...r, is_default: r.id === id })));
    setActiveResume((prev) => (prev ? { ...prev, is_default: prev.id === id } : prev));
  }

  function updateField<K extends keyof Resume>(key: K, value: Resume[K]) {
    setActiveResume((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function addExperience() {
    const newExp: ResumeExperience = { title: '', company: '', startDate: '', endDate: '', description: '' };
    setActiveResume((prev) => prev ? { ...prev, experience: [...prev.experience, newExp] } : prev);
  }

  function updateExperience(idx: number, field: keyof ResumeExperience, value: string) {
    setActiveResume((prev) => {
      if (!prev) return prev;
      const exp = [...prev.experience];
      exp[idx] = { ...exp[idx], [field]: value };
      return { ...prev, experience: exp };
    });
  }

  function removeExperience(idx: number) {
    setActiveResume((prev) => {
      if (!prev) return prev;
      return { ...prev, experience: prev.experience.filter((_, i) => i !== idx) };
    });
  }

  function addEducation() {
    const newEdu: ResumeEducation = { school: '', degree: '', startDate: '', endDate: '', description: '' };
    setActiveResume((prev) => prev ? { ...prev, education: [...prev.education, newEdu] } : prev);
  }

  function updateEducation(idx: number, field: keyof ResumeEducation, value: string) {
    setActiveResume((prev) => {
      if (!prev) return prev;
      const edu = [...prev.education];
      edu[idx] = { ...edu[idx], [field]: value };
      return { ...prev, education: edu };
    });
  }

  function removeEducation(idx: number) {
    setActiveResume((prev) => {
      if (!prev) return prev;
      return { ...prev, education: prev.education.filter((_, i) => i !== idx) };
    });
  }

  function addSkill() {
    const skill = prompt('Enter a skill:');
    if (skill && skill.trim()) {
      setActiveResume((prev) => prev ? { ...prev, skills: [...prev.skills, skill.trim()] } : prev);
    }
  }

  function removeSkill(idx: number) {
    setActiveResume((prev) => {
      if (!prev) return prev;
      return { ...prev, skills: prev.skills.filter((_, i) => i !== idx) };
    });
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /></div>;
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage your professional resumes</p>
        </div>
        <button
          onClick={createNewResume}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          New Resume
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resume list */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">My Resumes</h3>
            <div className="space-y-2">
              {resumes.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">No resumes yet</p>
              ) : (
                resumes.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 rounded-xl border p-3 transition cursor-pointer ${
                      activeResume?.id === r.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveResume(r)}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-400">{r.skills.length} skills · {r.experience.length} jobs</p>
                    </div>
                    {r.is_default && (
                      <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Editor */}
        <div className="lg:col-span-2">
          {activeResume ? (
            <div className="space-y-5">
              {/* Basic info */}
              <Section title="Basic Information">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Resume Title" value={activeResume.title} onChange={(v) => updateField('title', v)} />
                  <Input label="Full Name" value={activeResume.full_name || ''} onChange={(v) => updateField('full_name', v)} />
                  <Input label="Email" value={activeResume.email || ''} onChange={(v) => updateField('email', v)} />
                  <Input label="Phone" value={activeResume.phone || ''} onChange={(v) => updateField('phone', v)} />
                  <Input label="Location" value={activeResume.location || ''} onChange={(v) => updateField('location', v)} />
                </div>
              </Section>

              {/* Summary */}
              <Section title="Professional Summary">
                <textarea
                  value={activeResume.summary || ''}
                  onChange={(e) => updateField('summary', e.target.value)}
                  rows={3}
                  placeholder="Write a brief summary of your professional background..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </Section>

              {/* Skills */}
              <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                  {activeResume.skills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {skill}
                      <button onClick={() => removeSkill(idx)} className="text-slate-400 hover:text-rose-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={addSkill}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add Skill
                  </button>
                </div>
              </Section>

              {/* Experience */}
              <Section title="Work Experience" action={
                <button onClick={addExperience} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                  <Plus className="h-4 w-4" /> Add
                </button>
              }>
                <div className="space-y-4">
                  {activeResume.experience.map((exp, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Experience #{idx + 1}</span>
                        <button onClick={() => removeExperience(idx)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Job Title" value={exp.title} onChange={(v) => updateExperience(idx, 'title', v)} />
                        <Input label="Company" value={exp.company} onChange={(v) => updateExperience(idx, 'company', v)} />
                        <Input label="Start Date" value={exp.startDate} onChange={(v) => updateExperience(idx, 'startDate', v)} placeholder="2022-01" />
                        <Input label="End Date" value={exp.endDate} onChange={(v) => updateExperience(idx, 'endDate', v)} placeholder="Present" />
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                  {activeResume.experience.length === 0 && (
                    <p className="py-4 text-center text-sm text-slate-400">No experience entries yet</p>
                  )}
                </div>
              </Section>

              {/* Education */}
              <Section title="Education" action={
                <button onClick={addEducation} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                  <Plus className="h-4 w-4" /> Add
                </button>
              }>
                <div className="space-y-4">
                  {activeResume.education.map((edu, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Education #{idx + 1}</span>
                        <button onClick={() => removeEducation(idx)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="School" value={edu.school} onChange={(v) => updateEducation(idx, 'school', v)} />
                        <Input label="Degree" value={edu.degree} onChange={(v) => updateEducation(idx, 'degree', v)} />
                        <Input label="Start Date" value={edu.startDate} onChange={(v) => updateEducation(idx, 'startDate', v)} placeholder="2016-09" />
                        <Input label="End Date" value={edu.endDate} onChange={(v) => updateEducation(idx, 'endDate', v)} placeholder="2020-05" />
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                        <textarea
                          value={edu.description}
                          onChange={(e) => updateEducation(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                  {activeResume.education.length === 0 && (
                    <p className="py-4 text-center text-sm text-slate-400">No education entries yet</p>
                  )}
                </div>
              </Section>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setDefault(activeResume.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      activeResume.is_default
                        ? 'bg-amber-50 text-amber-700'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star className="h-4 w-4" fill={activeResume.is_default ? 'currentColor' : 'none'} />
                    {activeResume.is_default ? 'Default Resume' : 'Set as Default'}
                  </button>
                  <button
                    onClick={() => deleteResume(activeResume.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                <button
                  onClick={saveResume}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Resume'}
                </button>
              </div>

              {/* Preview */}
              <ResumePreview resume={activeResume} />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Create your first resume to get started.</p>
              <button
                onClick={createNewResume}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
                Create Resume
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}

function ResumePreview({ resume }: { resume: Resume }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <div className="mb-6 border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900">{resume.full_name || 'Your Name'}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join(' · ')}
        </p>
      </div>

      {resume.summary && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Summary</h3>
          <p className="text-sm leading-relaxed text-slate-600">{resume.summary}</p>
        </div>
      )}

      {resume.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Experience</h3>
          <div className="space-y-4">
            {resume.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{exp.title} <span className="text-slate-500 font-normal">at {exp.company}</span></p>
                  <p className="text-xs text-slate-500">{exp.startDate} — {exp.endDate}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.education.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Education</h3>
          <div className="space-y-3">
            {resume.education.map((edu, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{edu.degree}</p>
                  <p className="text-xs text-slate-500">{edu.startDate} — {edu.endDate}</p>
                </div>
                <p className="text-sm text-slate-500">{edu.school}</p>
                {edu.description && <p className="mt-1 text-sm text-slate-600">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.skills.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, idx) => (
              <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
