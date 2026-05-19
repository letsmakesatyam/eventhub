import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, fetchWithRetry } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { BarChart3, Users, Ticket, IndianRupee, Calendar, TrendingUp, ArrowRight, Shield } from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
    <div className="text-sm text-gray-500 dark:text-slate-400">{label}</div>
    {sub && <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</div>}
  </div>
);

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentRegs, setRecentRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithRetry(
      () => adminAPI.dashboard(),
      { onWaking: setWaking }
    )
      .then(r => {
        setStats(r.data.stats);
        setRecentRegs(r.data.recent_registrations || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => { setLoading(false); setWaking(false); });
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 shimmer rounded w-48 mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 shimmer rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400">Overview of your EventHub platform</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/events" className="btn-secondary text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Manage Events
          </Link>
          <Link to="/admin/scanner" className="btn-primary text-sm flex items-center gap-2">
            <Ticket className="w-4 h-4" /> QR Scanner
          </Link>
        </div>
      </div>

      {waking && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span className="animate-pulse">⏳</span> Server is waking up...
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Calendar} label="Total Events" value={stats?.total_events || 0} color="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" />
        <StatCard icon={Users} label="Registrations" value={stats?.total_registrations || 0} color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`}
          color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard icon={Ticket} label="Check-ins" value={stats?.checked_in || 0} color="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/admin/events', icon: Calendar, title: 'Manage Events', desc: 'Create, edit, and publish events' },
          { to: '/admin/revenue', icon: TrendingUp, title: 'Revenue Report', desc: 'Track payments by event' },
          { to: '/admin/scanner', icon: Ticket, title: 'QR Scanner', desc: 'Scan and validate tickets' },
          { to: '/admin/users', icon: Shield, title: 'Manage Users', desc: 'View users & create admins' },
        ].map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="glass-card rounded-2xl p-5 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 transition-colors">
              <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">{title}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Recent Registrations */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Registrations</h2>
          <span className="text-xs text-gray-400 dark:text-slate-500">Last 10</span>
        </div>
        {recentRegs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-slate-500">No registrations yet</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {recentRegs.map((reg) => (
              <div key={reg.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-violet-700 dark:text-violet-400 font-semibold text-sm">
                  {reg.users?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{reg.users?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{reg.events?.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {reg.amount_paid === 0 ? <span className="text-emerald-600 dark:text-emerald-400">Free</span> : `₹${reg.amount_paid}`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {reg.confirmed_at ? format(new Date(reg.confirmed_at), 'MMM d, h:mm a') : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
