import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, fetchWithRetry } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { IndianRupee, Users, TrendingUp, ArrowLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export const AdminRevenuePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithRetry(() => adminAPI.revenue(), { onWaking: setWaking })
      .then(r => setData(r.data.revenue_by_event || []))
      .catch(() => toast.error('Failed to load revenue data'))
      .finally(() => { setLoading(false); setWaking(false); });
  }, []);

  const totalRevenue = data.reduce((s, e) => s + e.revenue, 0);
  const totalRegistrations = data.reduce((s, e) => s + e.confirmed_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Report</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Financial breakdown by event</p>
        </div>
      </div>

      {waking && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span className="animate-pulse">⏳</span> Server is waking up...
        </div>
      )}

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Sales</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalRegistrations}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Events Tracked</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</div>
        </div>
      </div>

      {/* Events Revenue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Revenue by Event</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 shimmer rounded-xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-slate-500">No revenue data yet</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {data.map(event => {
              const fillPct = Math.round((event.confirmed_count / event.capacity) * 100);
              return (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {format(new Date(event.event_date), 'MMM d, yyyy')} · ₹{event.price} per ticket
                      </p>
                    </div>
                    <div className="hidden sm:block text-center flex-shrink-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{event.confirmed_count}/{event.capacity}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">sold</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${Math.min(fillPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{fillPct}%</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{event.revenue.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">revenue</p>
                    </div>
                    <Link
                      to={`/admin/attendees/${event.id}`}
                      className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
