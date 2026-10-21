import { useState, useEffect } from 'react';
import { Building2, Globe, MapPin, Users, Calendar, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Company } from '@/types';
import { COMPANY_SIZES } from '@/types';

interface CompanyProfileEditorProps {
  company: Company | null;
  onCompanyChanged: () => void;
}

export default function CompanyProfileEditor({
  company,
  onCompanyChanged,
}: CompanyProfileEditorProps) {
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    website: '',
    description: '',
    industry: '',
    location: '',
    size: '',
    founded_year: '' as string,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        logo_url: company.logo_url || '',
        website: company.website || '',
        description: company.description || '',
        industry: company.industry || '',
        location: company.location || '',
        size: company.size || '',
        founded_year: company.founded_year?.toString() || '',
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    if (!form.name.trim()) {
      setError('Company name is required');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: form.name.trim(),
          logo_url: form.logo_url.trim() || null,
          website: form.website.trim() || null,
          description: form.description.trim(),
          industry: form.industry.trim() || null,
          location: form.location.trim() || null,
          size: form.size || null,
          founded_year: form.founded_year ? Number(form.founded_year) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (updateError) throw updateError;
      setSaved(true);
      onCompanyChanged();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Company Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Update your company information visible to candidates</p>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              form.name.charAt(0).toUpperCase() || 'C'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold">{form.name || 'Company Name'}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-300 flex-wrap">
              {form.industry && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{form.industry}</span>}
              {form.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{form.location}</span>}
              {form.size && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{form.size} employees</span>}
              {form.founded_year && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Founded {form.founded_year}</span>}
            </div>
            {form.description && (
              <p className="text-sm text-slate-400 mt-3 line-clamp-3">{form.description}</p>
            )}
            {form.website && (
              <a
                href={form.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 mt-3 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {form.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Company Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Acme Corporation"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="e.g. Technology"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Size</label>
            <select
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all bg-white"
            >
              <option value="">Select size...</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>{s} employees</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Founded Year</label>
            <input
              type="number"
              value={form.founded_year}
              onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
              placeholder="e.g. 2015"
              min="1800"
              max="2026"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">About / Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            placeholder="Tell candidates about your company, mission, and culture..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all resize-none"
          />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Check className="w-4 h-4" />
              Saved successfully
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
