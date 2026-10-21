import { LayoutDashboard, Briefcase, Users, Building2 } from 'lucide-react';

export type View = 'dashboard' | 'jobs' | 'applicants' | 'company';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  companyName: string;
  companyInitial: string;
  activeJobCount: number;
  totalApplicants: number;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Listings', icon: Briefcase },
  { id: 'applicants', label: 'Applicants', icon: Users },
  { id: 'company', label: 'Company Profile', icon: Building2 },
];

export default function Sidebar({
  currentView,
  onNavigate,
  companyName,
  companyInitial,
  activeJobCount,
  totalApplicants,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen shrink-0">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center font-bold text-white text-lg">
            H
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HireLink</h1>
            <p className="text-xs text-slate-400">Employer Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'jobs' && activeJobCount > 0 && (
                <span className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">
                  {activeJobCount}
                </span>
              )}
              {item.id === 'applicants' && totalApplicants > 0 && (
                <span className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">
                  {totalApplicants}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center font-semibold text-white">
            {companyInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{companyName}</p>
            <p className="text-xs text-slate-500">Employer Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
