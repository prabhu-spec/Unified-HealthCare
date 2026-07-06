import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getMenuItemsForRole } from '@/lib/permissions';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const menuItems = user ? getMenuItemsForRole(user.role) : [];

  return (
    <aside className="w-60 min-h-screen flex flex-col flex-shrink-0 bg-white border-r border-slate-200">
      <div className="px-5 py-5 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Healthcare</p>
        <h2 className="text-lg font-semibold text-slate-900 mt-0.5">Dashboard</h2>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-base opacity-80">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
