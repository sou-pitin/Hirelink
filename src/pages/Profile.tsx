import { useState, type FormEvent } from 'react';
import { UserCircle, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { sanitizeText, validateMaxLength, rateLimit } from '@/lib/validation';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSaved(false);

    const nameCheck = validateMaxLength(fullName, 100, 'Full name');
    if (!nameCheck.valid) return setError(nameCheck.message ?? null);

    const rl = rateLimit('profile_update', 5, 60000);
    if (!rl.allowed) return setError(rl.message ?? null);

    setSaving(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: sanitizeText(fullName),
        company_name: profile.role === 'employer' ? sanitizeText(companyName) : null,
        bio: bio ? sanitizeText(bio) : null,
        location: location ? sanitizeText(location) : null,
        phone: phone ? sanitizeText(phone) : null,
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information</p>
      </div>

      <div className="card overflow-hidden">
        {/* Profile header banner */}
        <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-xl bg-white border-4 border-white shadow-md flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <UserCircle className="w-10 h-10 text-primary-600" />
              )}
            </div>
            <div className="pb-2">
              <h2 className="text-lg font-semibold text-gray-900">{profile.full_name}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <span className="badge-info capitalize mt-1">{profile.role}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-error-50 text-error-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="mt-4 p-3 rounded-lg bg-accent-50 text-accent-700 text-sm">
              Profile saved successfully.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
              />
            </div>

            {profile.role === 'employer' && (
              <div>
                <label className="label" htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={100}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  className="input"
                  placeholder="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="input min-h-[100px] resize-y"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/2000 characters</p>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
