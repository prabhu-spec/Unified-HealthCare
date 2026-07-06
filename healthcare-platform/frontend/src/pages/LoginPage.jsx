import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import PasswordInput from '@/components/ui/PasswordInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const fromPath = location.state?.from?.pathname;
  const redirectTo = searchParams.get('redirect') || fromPath || '/';

  if (isAuthenticated) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await login(loginData.email, loginData.password);
    if (result.success) {
      navigate(redirectTo);
    } else {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Healthcare</h1>
          <p className="text-slate-500">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Welcome back</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!import.meta.env.PROD && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <p className="font-medium mb-2">Demo login (password: demo123)</p>
              <p>Super Admin: superadmin@demo.com</p>
              <p>Insurance: insurance@demo.com</p>
              <p>Medical Vendor: vendor@demo.com</p>
              <p>Hospital Admin (org-1): hospitaladmin@demo.com</p>
              <p>Hospital Admin (org-2): hospitaladmin2@demo.com</p>
              <p>Blood Bank Admin: bloodbank@demo.com</p>
              <p>Doctor: doctor@demo.com</p>
              <p>Nurse: nurse@demo.com</p>
              <p>Patient: patient@demo.com</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <PasswordInput
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter your password"
                className="border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 px-6 rounded-lg disabled:opacity-50 font-semibold transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            New?{' '}
            <Link to={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-sky-600 hover:underline font-medium">
              Create account
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-gray-500">
            <Link to="/forgot-password" className="text-sky-600 hover:underline">Forgot password?</Link>
            {' · '}
            <Link to="/forgot-email" className="text-sky-600 hover:underline">Forgot email?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
