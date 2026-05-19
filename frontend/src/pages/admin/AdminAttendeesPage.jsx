import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI, fetchWithRetry } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';

const statusIcon = {
  confirmed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  cancelled: <XCircle className="w-4 h-4 text-red-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
};

export const AdminAttendeesPage = () => {
  const { eventId } = useParams();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWithRetry(() => adminAPI.attendees(eventId))
      .then(r => setAttendees(r.data.attendees || []))
      .catch(() => toast.error('Failed to load attendees'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const filtered = attendees.filter(a =>
    a.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.users?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const checkedIn = attendees.filter(a => a.tickets?.[0]?.status === 'used').length;
  const confirmed = attendees.filter(a => a.status === 'confirmed').length;

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Status', 'Amount Paid', 'Ticket Status', 'Checked In At', 'Registered At'],
      ...attendees.map(a => [
        a.users?.name || '',
        a.users?.email || '',
        a.status,
        a.amount_paid || 0,
        a.tickets?.[0]?.status || '',
        a.tickets?.[0]?.checked_in_at ? format(new Date(a.tickets[0].checked_in_at), 'yyyy-MM-dd HH:mm') : '',
        a.confirmed_at ? format(new Date(a.confirmed_at), 'yyyy-MM-dd HH:mm') : '',
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${eventId.slice(0, 8)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/revenue" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendees</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{confirmed} confirmed · {checkedIn} checked in</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-sm"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Attendee</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Paid</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Ticket</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Checked In</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 shimmer rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">No attendees found</td>
                </tr>
              ) : (
                filtered.map(att => {
                  const ticket = att.tickets?.[0];
                  return (
                    <tr key={att.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-violet-700 dark:text-violet-400 font-semibold text-sm">
                            {att.users?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{att.users?.name}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{att.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {statusIcon[att.status] || statusIcon.pending}
                          <span className="text-gray-700 dark:text-slate-300 capitalize">{att.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {att.amount_paid === 0 ? <span className="text-emerald-600 dark:text-emerald-400">Free</span> : `₹${att.amount_paid}`}
                      </td>
                      <td className="px-6 py-4">
                        {ticket ? (
                          <span className={`badge ${
                            ticket.status === 'used' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            ticket.status === 'valid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {ticket.status}
                          </span>
                        ) : <span className="text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                        {ticket?.checked_in_at
                          ? format(new Date(ticket.checked_in_at), 'h:mm a, MMM d')
                          : <span className="text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                        {att.confirmed_at
                          ? format(new Date(att.confirmed_at), 'MMM d, yyyy')
                          : <span className="text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
