import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, CheckCircle2, AlertCircle, Info, Save, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { matchJobs, candidateSkills, type MatchJob } from '@/lib/matcher';

interface JobRow extends MatchJob {
  company: string | null;
  location: string | null;
  job_type: string | null;
}

function scoreStyle(score: number) {
  if (score >= 65) return { bar: 'bg-green-500', label: 'Strong match', badge: 'badge-success' };
  if (score >= 40) return { bar: 'bg-blue-500', label: 'Good match', badge: 'badge-info' };
  if (score >= 20) return { bar: 'bg-yellow-500', label: 'Possible match', badge: 'badge-warning' };
  return { bar: 'bg-gray-400', label: 'Weak match', badge: 'badge-neutral' };
}

export default function Matches() {
  const { profile, refreshProfile } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [minScore, setMinScore] = useState(0);

  // load jobs + the user's saved profile data and default resume
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    async function load() {
      const [jobsRes, profRes, resumeRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, description, requirements, tags, category, company, location, job_type')
          .in('status', ['approved', 'active']),
        supabase.from('profiles').select('bio, skills, current_title').eq('id', profile!.id).maybeSingle(),
        supabase
          .from('resumes')
          .select('summary, skills, experience, education')
          .eq('user_id', profile!.id)
          .order('is_default', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setJobs((jobsRes.data as JobRow[]) ?? []);
      const p = profRes.data as { bio: string | null; skills: string[] | null; current_title: string | null } | null;
      setBio(p?.bio ?? profile!.bio ?? '');
      setTitle(p?.current_title ?? '');
      const r = resumeRes.data as { summary?: string; skills?: string[]; experience?: unknown; education?: unknown } | null;
      setSkillsText([...(p?.skills ?? []), ...(r?.skills ?? [])].filter((v, i, a) => a.indexOf(v) === i).join(', '));
      setResumeText(r ? [r.summary ?? '', JSON.stringify(r.experience ?? ''), JSON.stringify(r.education ?? '')].join(' ') : '');
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const skillList = useMemo(
    () => skillsText.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean),
    [skillsText]
  );

  const profileInput = useMemo(
    () => ({ text: [title, bio, resumeText].join(' . '), skills: skillList }),
    [title, bio, resumeText, skillList]
  );

  const results = useMemo(() => matchJobs(profileInput, jobs), [profileInput, jobs]);
  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const detected = useMemo(() => candidateSkills(profileInput), [profileInput]);
  const hasInput = profileInput.text.replace(/[\s.]/g, '').length > 0 || skillList.length > 0;
  const visible = results.filter((r) => r.score >= minScore);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null, current_title: title.trim() || null, skills: skillList })
      .eq('id', profile.id);
    setSaving(false);
    setSaveMsg(error ? 'Could not save: ' + error.message : 'Saved to your profile.');
    if (!error) refreshProfile();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">AI Job Matches</h1>
      </div>
      <p className="text-gray-500 mb-6">
        Describe yourself and the matcher ranks every open job by how well it fits, and shows which skills you are missing.
      </p>

      <div className="card p-5 mb-4">
        <button
          type="button"
          onClick={() => setShowHow(!showHow)}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 w-full text-left"
        >
          <Info className="w-4 h-4" /> How the AI works
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showHow ? 'rotate-180' : ''}`} />
        </button>
        {showHow && (
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>
              <strong>1. Text to numbers (TF-IDF).</strong> Your profile and each job description are cleaned and turned into a list of
              word weights. Rare, meaningful words (like &ldquo;Kubernetes&rdquo;) weigh more than common ones (like &ldquo;team&rdquo;), and
              words in the job title, tags and requirements count extra.
            </p>
            <p>
              <strong>2. Similarity (cosine).</strong> The angle between your word-weight list and a job&rsquo;s gives a 0&ndash;100% text match.
            </p>
            <p>
              <strong>3. Skill check.</strong> Skills are found in the text using a skill dictionary. The score blends 60% text match and 40% skill coverage
              (how many of the job&rsquo;s skills you have).
            </p>
            <p>
              <strong>4. Explanation.</strong> Each result lists the shared keywords, the skills you match and the skills you are missing.
              Everything runs in your browser. No data leaves the app and no external AI service is used.
            </p>
          </div>
        )}
      </div>

      <div className="card p-5 mb-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current or target job title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend developer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
            <input className="input" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, TypeScript, SQL" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">About you, or paste your resume text</label>
          <textarea
            className="input min-h-[110px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your experience, the tools you use and the kind of work you want."
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save to profile'}
          </button>
          {saveMsg && <span className="text-sm text-gray-500">{saveMsg}</span>}
          {detected.length > 0 && (
            <span className="text-xs text-gray-400 sm:ml-auto">Skills detected: {detected.slice(0, 8).join(', ')}{detected.length > 8 ? '...' : ''}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12 animate-pulse">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">There are no open jobs to match yet.</div>
      ) : !hasInput ? (
        <div className="card p-10 text-center text-gray-500">Add your skills or a short description above to see your matches.</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {visible.length} of {results.length} jobs
            </h2>
            <label className="text-sm text-gray-500 flex items-center gap-2">
              Minimum score
              <select className="input !w-auto !py-1" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
                <option value={0}>All</option>
                <option value={20}>20+</option>
                <option value={40}>40+</option>
                <option value={65}>65+</option>
              </select>
            </label>
          </div>
          <div className="space-y-4">
            {visible.map((r, i) => {
              const job = jobById.get(r.jobId);
              if (!job) return null;
              const st = scoreStyle(r.score);
              return (
                <div key={r.jobId} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-400">#{i + 1}</span>
                        <Link to={`/jobs/${job.id}`} className="font-semibold text-lg text-gray-900 hover:text-primary-600">
                          {job.title}
                        </Link>
                        <span className={st.badge}>{st.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {job.company}
                        {job.location && (
                          <span className="inline-flex items-center gap-1 ml-3">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <div className="text-2xl font-bold text-gray-900">{r.score}%</div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${st.bar}`} style={{ width: `${r.score}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="flex items-center gap-1.5 font-medium text-gray-700 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Skills you have
                      </p>
                      {r.matchedSkills.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {r.matchedSkills.map((s) => (
                            <span key={s} className="badge-success">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">None of the listed skills yet.</p>
                      )}
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 font-medium text-gray-700 mb-1.5">
                        <AlertCircle className="w-4 h-4 text-yellow-600" /> Skills to learn
                      </p>
                      {r.missingSkills.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {r.missingSkills.map((s) => (
                            <span key={s} className="badge-warning">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">You cover everything this job lists.</p>
                      )}
                    </div>
                  </div>

                  {r.sharedTerms.length > 0 && (
                    <p className="mt-3 text-xs text-gray-400">
                      Why it matched: shared keywords &ndash; {r.sharedTerms.join(', ')} &middot; text similarity {Math.round(r.similarity * 100)}%
                      {r.skillCoverage !== null && <> &middot; skill coverage {Math.round(r.skillCoverage * 100)}%</>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}