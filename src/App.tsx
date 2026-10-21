import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import Dashboard from '@/pages/Dashboard';
import Matches from '@/pages/Matches';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetail';
import Applications from '@/pages/Applications';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import EmployerJobs from '@/pages/employer/EmployerJobs';
import JobForm from '@/pages/employer/JobForm';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Blog from '@/pages/blog/Blog';
import BlogPostPage from '@/pages/blog/BlogPostPage';
import BlogEditor from '@/pages/blog/BlogEditor';
import type { ReactNode } from 'react';

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/signin" element={session ? <Navigate to="/dashboard" /> : <SignIn />} />
      <Route path="/signup" element={session ? <Navigate to="/dashboard" /> : <SignUp />} />

      {/* Protected app routes */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><AppLayout><Jobs /></AppLayout></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><AppLayout><Matches /></AppLayout></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><AppLayout><JobDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><AppLayout><Applications /></AppLayout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><AppLayout><Messages /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/blog" element={<ProtectedRoute><AppLayout><Blog /></AppLayout></ProtectedRoute>} />
      <Route path="/blog/:slug" element={<ProtectedRoute><AppLayout><BlogPostPage /></AppLayout></ProtectedRoute>} />

      {/* Employer routes */}
      <Route path="/employer/jobs" element={
        <ProtectedRoute allowedRoles={['employer']}><AppLayout><EmployerJobs /></AppLayout></ProtectedRoute>
      } />
      <Route path="/employer/jobs/new" element={
        <ProtectedRoute allowedRoles={['employer']}><AppLayout><JobForm /></AppLayout></ProtectedRoute>
      } />
      <Route path="/employer/jobs/:id/edit" element={
        <ProtectedRoute allowedRoles={['employer']}><AppLayout><JobForm /></AppLayout></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin/blog/new" element={
        <ProtectedRoute allowedRoles={['admin']}><AppLayout><BlogEditor /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin/blog/:id/edit" element={
        <ProtectedRoute allowedRoles={['admin']}><AppLayout><BlogEditor /></AppLayout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
