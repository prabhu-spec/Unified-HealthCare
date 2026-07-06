import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS, normalizeRole } from '@/lib/auth';
import { useNavigationHistory } from '@/lib/navigationHistory';

export default function TopBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { canGoBack, goBack, previousLabel } = useNavigationHistory();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-200">
      <div className="px-6">
        <div className="flex justify-between items-center h-14 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 shrink-0 text-sm font-medium text-sky-700 hover:text-sky-900 px-2 py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
                aria-label={`Back to ${previousLabel}`}
              >
                <span aria-hidden className="text-base leading-none">←</span>
                <span className="hidden sm:inline">Back</span>
                <span className="hidden md:inline text-slate-500 font-normal">· {previousLabel}</span>
              </button>
            )}
            <Link to="/" className="text-lg font-semibold text-slate-900 no-underline truncate">
              Healthcare
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{ROLE_LABELS[normalizeRole(user.role)]}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-primary text-sm cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm no-underline">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
