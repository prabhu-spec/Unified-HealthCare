import { useAuth, ROLE_LABELS, normalizeRole } from '@/lib/auth';
import { getMenuItemsForRole } from '@/lib/permissions';
import NavCard from '@/components/ui/NavCard';

export default function DashboardContainer() {
  const { user } = useAuth();
  if (!user) return null;

  const role = normalizeRole(user.role);
  const menuItems = getMenuItemsForRole(user.role);
  const quickLinks = menuItems.filter((m) => m.path !== '/' && m.path !== '/profile');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.firstName}</h1>
        <p className="text-slate-500 mt-1">{ROLE_LABELS[role]}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {role === 'patient' && (
          <>
            <SummaryCard label="Appointments" value="2 upcoming" />
            <SummaryCard label="Vitals" value="Overview" />
            <SummaryCard label="Policy" value="Active" />
          </>
        )}
        {role === 'doctor' && (
          <>
            <SummaryCard label="Queue" value="5 today" />
            <SummaryCard label="Telemetry" value="Live RPM" />
            <SummaryCard label="Patients" value="12 this week" />
          </>
        )}
        {role === 'medical_vendor' && (
          <>
            <SummaryCard label="Low stock" value="3 items" />
            <SummaryCard label="Restock" value="2 requests" />
            <SummaryCard label="Verifications" value="1 pending" />
          </>
        )}
        {role === 'insurance_provider' && (
          <>
            <SummaryCard label="Policies" value="24 active" />
            <SummaryCard label="Applicants" value="5 pending" />
            <SummaryCard label="Expiring" value="3 soon" />
          </>
        )}
        {role === 'hospital_admin' && (
          <>
            <SummaryCard label="Ward overview" value="RPM" />
            <SummaryCard label="Devices" value="4 online" />
            <SummaryCard label="Pending dues" value="$2,400" />
          </>
        )}
        {role === 'bloodbank_admin' && (
          <>
            <SummaryCard label="Blood requests" value="3 pending" />
            <SummaryCard label="Inventory" value="8 types" />
            <SummaryCard label="Donations" value="2 sent" />
          </>
        )}
        {role === 'super_admin' && (
          <>
            <SummaryCard label="Hospitals" value="All" />
            <SummaryCard label="Users" value="All" />
            <SummaryCard label="Logs" value="Live" />
          </>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {quickLinks.slice(0, 8).map((item) => (
            <NavCard
              key={item.path}
              to={item.path}
              icon={item.icon}
              title={item.label}
              description={getDescription(item.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bubble-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function getDescription(path) {
  const map = {
    '/telemetry/overview': 'Room overview',
    '/telemetry/live': 'Live patient vitals',
    '/telemetry/devices': 'IoMT devices',
    '/telemetry/assignments': 'Patient assignments',
    '/queue': 'Appointment queue',
    '/appointments': 'Book or manage visits',
    '/medicines': 'Order medicines',
    '/restock': 'Request restock',
  };
  return map[path] || null;
}
