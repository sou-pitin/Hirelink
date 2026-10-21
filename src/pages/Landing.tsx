import { Link } from 'react-router-dom';
import { Briefcase, Users, TrendingUp, ArrowRight, FileText, Mail, Search, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Landing() {
  const { profile } = useAuth();

  if (profile) {
    // Redirect logged-in users to dashboard via link
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome back to HireLink</h1>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Connecting talent with opportunity</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Find your next career move or hire the perfect candidate
            </h1>
            <p className="text-lg text-primary-100 mb-8 leading-relaxed">
              HireLink is the modern job platform that connects employers with qualified candidates.
              Post jobs, track applications, message candidates directly, and manage your hiring pipeline — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="btn bg-white text-primary-700 hover:bg-primary-50 active:bg-primary-100 px-6 py-3 text-base">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/signin" className="btn bg-primary-500/30 text-white border border-white/30 hover:bg-primary-500/40 px-6 py-3 text-base backdrop-blur-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to hire and get hired</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">A complete platform for job seekers and employers with powerful tools for every step of the process.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Briefcase, title: 'Job Postings', desc: 'Employers can post jobs with full details. Admins approve listings to ensure quality.' },
            { icon: FileText, title: 'Applications', desc: 'Candidates apply with cover letters. Employers track and manage applicants with status updates.' },
            { icon: Mail, title: 'In-Site Messaging', desc: 'Employers and candidates can message each other directly within the platform.' },
            { icon: Search, title: 'Smart Job Board', desc: 'Browse approved jobs by type, location, and search. Clean, fast, and easy to use.' },
            { icon: Shield, title: 'Role-Based Security', desc: 'Admin, employer, and candidate roles with enforced access control at every level.' },
            { icon: Users, title: 'Admin Dashboard', desc: 'Manage users, approve jobs, view site statistics, and write blog posts — all in one panel.' },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">Join HireLink today and take the next step in your career or hiring journey.</p>
          <Link to="/signup" className="btn bg-primary-600 text-white hover:bg-primary-500 px-8 py-3 text-base">
            Create Your Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
