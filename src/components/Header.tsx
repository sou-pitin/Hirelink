import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, BriefcaseBusiness, Mail, Newspaper, Settings, LogOut, Menu, X, UserCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { useState } from 'react';

export default function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile) return null;

  const navItems: { to: string; label: string; icon: typeof LayoutDashboard; roles?: string[] }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/matches', label: 'AI Matches', icon: Sparkles },
    { to: '/messages', label: 'Messages', icon: Mail },
    { to: '/blog', label: 'Blog', icon: Newspaper },
  ];

  if (profile.role === 'employer') {
    navItems.push({ to: '/employer/jobs', label: 'My Jobs', icon: BriefcaseBusiness, roles: ['employer'] });
  }

  if (profile.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: Settings, roles: ['admin'] });
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary-700">
              <Briefcase className="w-6 h-6" />
              <span className="hidden sm:inline">HireLink</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive(item.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{profile.full_name}</p>
                  <p className="text-xs text-gray-500 leading-tight capitalize">{profile.role}</p>
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive(item.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50 flex items-center gap-2 text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
