import { type ReactNode } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} HireLink. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link to="/blog" className="hover:text-gray-600">Blog</Link>
            <Link to="/jobs" className="hover:text-gray-600">Jobs</Link>
            <span>Built with React, Tailwind & Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
