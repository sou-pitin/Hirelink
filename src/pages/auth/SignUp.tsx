import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword, validateRequired, rateLimit } from '@/lib/validation';
import type { UserRole } from '@/types';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const nameCheck = validateRequired(fullName, 'Full name');
    if (!nameCheck.valid) return setError(nameCheck.message ?? null);

    if (!validateEmail(email)) {
      return setError('Please enter a valid email address.');
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return setError(pwCheck.message ?? null);

    if (role === 'employer') {
      const companyCheck = validateRequired(companyName, 'Company name');
      if (!companyCheck.valid) return setError(companyCheck.message ?? null);
    }

    const rl = rateLimit('signup', 3, 60000);
    if (!rl.allowed) return setError(rl.message ?? null);

    setLoading(true);
    const { error: signUpError } = await signUp(
      email,
      password,
      fullName,
      role,
      role === 'employer' ? companyName : undefined
    );
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-700">
            <Briefcase className="w-8 h-8" />
            HireLink
          </Link>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <div className="card p-8 animate-slide-up">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error-50 text-error-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="label">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  role === 'candidate'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mb-2 text-primary-600" />
                <p className="font-medium text-sm">Candidate</p>
                <p className="text-xs text-gray-500 mt-1">Looking for jobs</p>
                {role === 'candidate' && <CheckCircle className="w-4 h-4 text-primary-600 mt-2" />}
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  role === 'employer'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5 mb-2 text-accent-600" />
                <p className="font-medium text-sm">Employer</p>
                <p className="text-xs text-gray-500 mt-1">Hiring talent</p>
                {role === 'employer' && <CheckCircle className="w-4 h-4 text-primary-600 mt-2" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  className="input pl-10"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
            </div>

            {role === 'employer' && (
              <div>
                <label className="label" htmlFor="companyName">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="companyName"
                    type="text"
                    className="input pl-10"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Min 8 chars, with uppercase, lowercase, and a number.</p>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary-600 font-medium hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
