import { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, TrendingUp, CheckCircle2, Zap, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { JobCard } from '@/components/JobCard';
import type { Job, Profile, Recommendation } from '@/types';

export function RecommendationsPage() {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [recommendations, setRecommendations] = useState<(Recommendation & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const generateRecommendations = useCallback(async () => {
    if (!user || !profile) return;
    setGenerating(true);

    // Fetch all active jobs with company info
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*, company:companies(*)')
      .eq('is_active', true);

    if (!jobs || jobs.length === 0) {
      setGenerating(false);
      return;
    }

    const userSkills = (profile.skills || []).map((s) => s.toLowerCase());
    const userExpLevel = profile.experience_level || 'mid';
    const userLocation = (profile.location || '').toLowerCase();
    const userCurrentTitle = (profile.current_title || '').toLowerCase();

    const expOrder = ['entry', 'mid', 'senior', 'lead', 'executive'];
    const userExpIdx = expOrder.indexOf(userExpLevel);

    // Score each job
    const scored = (jobs as unknown as Job[]).map((job) => {
      let score = 0;
      const reasons: string[] = [];

      // Skill matching (max 50 points)
      const jobText = `${job.title} ${job.description} ${job.requirements}`.toLowerCase();
      const matchedSkills: string[] = [];
      for (const skill of userSkills) {
        if (jobText.includes(skill)) {
          score += 10;
          matchedSkills.push(skill);
        }
      }
      if (matchedSkills.length > 0) {
        reasons.push(`Matches ${matchedSkills.length} of your skills: ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? '...' : ''}`);
      }
      score = Math.min(score, 50);

      // Experience level match (20 points)
      const jobExpIdx = expOrder.indexOf(job.experience_level);
      const expDiff = Math.abs(jobExpIdx - userExpIdx);
      if (expDiff === 0) {
        score += 20;
        reasons.push('Exact experience level match');
      } else if (expDiff === 1) {
        score += 12;
        reasons.push('Close to your experience level');
      } else if (expDiff === 2) {
        score += 5;
      }

      // Location match (15 points)
      if (job.location && userLocation) {
        const jobLoc = job.location.toLowerCase();
        if (jobLoc === userLocation) {
          score += 15;
          reasons.push('Located in your city');
        } else if (jobLoc.includes(userLocation.split(',')[0]) || userLocation.includes(jobLoc.split(',')[0])) {
          score += 8;
          reasons.push('In your area');
        }
      }

      // Remote bonus (10 points)
      if (job.remote_ok) {
        score += 10;
        reasons.push('Remote-friendly');
      }

      // Title similarity (5 points)
      if (userCurrentTitle && job.title.toLowerCase().includes(userCurrentTitle.split(' ')[0])) {
        score += 5;
        reasons.push('Similar to your current role');
      }

      // Salary alignment (5 bonus)
      if (job.salary_min && job.salary_min >= 100000) {
        score += 3;
      }

      return { job, score: Math.min(score, 100), reasons, matchedSkills };
    });

    // Sort by score descending, take top 12
    const top = scored.sort((a, b) => b.score - a.score).slice(0, 12);

    // Clear old recommendations and insert new ones
    await supabase.from('recommendations').delete().eq('user_id', user.id);

    if (top.length > 0) {
      const inserts = top.map((t) => ({
        user_id: user.id,
        job_id: t.job.id,
        match_score: t.score,
        match_reasons: t.reasons,
        is_dismissed: false,
      }));
      await supabase.from('recommendations').insert(inserts);
    }

    setGenerating(false);
    fetchRecommendations();
  }, [user, profile]);

  async function fetchRecommendations() {
    if (!user) return;
    const { data } = await supabase
      .from('recommendations')
      .select('*, job:jobs(*, company:companies(*))')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('match_score', { ascending: false });
    setRecommendations((data || []) as unknown as (Recommendation & { job?: Job })[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    if (!profile) { navigate('/signin'); return; }

    // Check if recommendations already exist
    (async () => {
      const { count } = await supabase
        .from('recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_dismissed', false);

      if (count === 0 || count === null) {
        await generateRecommendations();
      } else {
        fetchRecommendations();
      }
    })();
  }, [user, profile, navigate, generateRecommendations]);

  async function dismissRecommendation(id: string) {
    await supabase.from('recommendations').update({ is_dismissed: true }).eq('id', id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading || generating) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-slate-900" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">
            {generating ? 'Analyzing your profile and matching jobs...' : 'Loading recommendations...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Recommended For You
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            AI-powered job matches based on your skills, experience, and preferences
          </p>
        </div>
        <button
          onClick={generateRecommendations}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <Zap className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Profile summary banner */}
      {profile && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Target className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Matching based on your profile</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {profile.skills.slice(0, 6).map((skill, idx) => (
                <span key={idx} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {skill}
                </span>
              ))}
              {profile.skills.length > 6 && (
                <span className="text-xs text-slate-400">+{profile.skills.length - 6} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Sparkles className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No recommendations found.</p>
          <p className="mt-1 text-sm text-slate-400">
            Add skills to your profile to get better matches.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Update Profile
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-4">
                {/* Match score ring */}
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={rec.match_score >= 80 ? '#059669' : rec.match_score >= 60 ? '#d97706' : '#64748b'}
                      strokeWidth="4"
                      strokeDasharray={`${(rec.match_score / 100) * 175.9} 175.9`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute text-sm font-bold ${
                    rec.match_score >= 80 ? 'text-emerald-600' : rec.match_score >= 60 ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {rec.match_score}%
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  {rec.job && <JobCard job={rec.job} />}
                </div>

                <button
                  onClick={() => dismissRecommendation(rec.id)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Match reasons */}
              {rec.match_reasons && rec.match_reasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pl-20">
                  {rec.match_reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
