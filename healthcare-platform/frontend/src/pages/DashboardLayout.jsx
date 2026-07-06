import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { NavigationHistoryProvider } from '@/lib/navigationHistory';

export default function DashboardLayout() {
  return (
    <NavigationHistoryProvider>
      <div className="theme-dashboard min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50">
          <TopBar />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </NavigationHistoryProvider>
  );
}
