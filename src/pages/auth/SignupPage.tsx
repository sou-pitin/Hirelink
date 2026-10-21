import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'employer' ? 'employer' : 'job_seeker';

  const [userType, setUserType] = useState<'job_seeker' | 'employer'>(initialType);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, userType, fullName);
    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Your Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Join HireLink today
          </p>
        </div>

        {/* Account type toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setUserType('job_seeker')}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              userType === 'job_seeker'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <Briefcase className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Job Seeker</span>
          </button>
          <button
            onClick={() => setUserType('employer')}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              userType === 'employer'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <Building2 className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Employer</span>
          </button>
        </div>

        <Card className="p-6 md:p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-sm text-error-700 dark:text-error-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-9 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="text"
                label={userType === 'employer' ? 'Your Name' : 'Full Name'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={userType === 'employer' ? 'John Smith' : 'Jane Doe'}
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-9 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Creating account...' : `Sign Up as ${userType === 'employer' ? 'Employer' : 'Job Seeker'}`}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Free to join
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            No credit card required
          </span>
        </div>
      </div>
    </div>
  );
}
