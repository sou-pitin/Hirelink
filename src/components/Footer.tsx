import { Briefcase, Github, Linkedin, Twitter } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900">HireLink</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Connect talent with opportunity. Find your next career move or hire your next great team member.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">For Job Seekers</h4>
            <ul className="mt-3 space-y-2">
              <li><button onClick={() => navigate('/jobs')} className="text-sm text-slate-500 hover:text-slate-900">Browse Jobs</button></li>
              <li><button onClick={() => navigate('/resume-builder')} className="text-sm text-slate-500 hover:text-slate-900">Resume Builder</button></li>
              <li><button onClick={() => navigate('/recommendations')} className="text-sm text-slate-500 hover:text-slate-900">Recommendations</button></li>
              <li><button onClick={() => navigate('/job-alerts')} className="text-sm text-slate-500 hover:text-slate-900">Job Alerts</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">For Employers</h4>
            <ul className="mt-3 space-y-2">
              <li><button onClick={() => navigate('/employer')} className="text-sm text-slate-500 hover:text-slate-900">Post a Job</button></li>
              <li><button onClick={() => navigate('/companies')} className="text-sm text-slate-500 hover:text-slate-900">Company Profiles</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Company</h4>
            <ul className="mt-3 space-y-2">
              <li><button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900">About</button></li>
              <li><button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900">Privacy</button></li>
              <li><button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900">Terms</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-8">
          <p className="text-sm text-slate-400">© 2026 HireLink. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 transition hover:text-slate-600"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="text-slate-400 transition hover:text-slate-600"><Linkedin className="h-5 w-5" /></a>
            <a href="#" className="text-slate-400 transition hover:text-slate-600"><Github className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
