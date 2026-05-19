import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketsAPI, fetchWithRetry } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, QrCode, CheckCircle, XCircle, Ticket } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  valid: { label: 'Valid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  used: { label: 'Used', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: XCircle },
  invalid: { label: 'Invalid', color: 'bg-red-100 text-red-600', icon: XCircle },
};

const TicketCard = ({ ticket }) => {
  const [showQR, setShowQR] = useState(false);
  const { label, color, icon: Icon } = statusConfig[ticket.status] || statusConfig.valid;
  const event = ticket.events;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top stripe */}
      <div className={`h-1.5 ${ticket.status === 'valid' ? 'bg-gradient-to-r from-violet-500 to-indigo-500' : 'bg-gray-200'}`} />
      
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-1 truncate">{event?.title}</h3>
            <span className={`badge ${color} font-medium`}>
              <Icon className="w-3 h-3" /> {label}
            </span>
          </div>
          <div className="flex-shrink-0 w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-violet-600" />
          </div>
        </div>

        <div className="space-y-1.5 mb-5">
          {event?.event_date && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span>{format(new Date(event.event_date), 'EEE, MMM d, yyyy · h:mm a')}</span>
            </div>
          )}
          {event?.location && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            #{ticket.id.slice(0, 8).toUpperCase()}
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            disabled={ticket.status !== 'valid'}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              ticket.status === 'valid'
                ? 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
        </div>

        {showQR && ticket.qr_code && (
          <div className="mt-5 pt-5 border-t border-dashed border-gray-200 flex flex-col items-center gap-3">
            <img
              src={ticket.qr_code}
              alt="Ticket QR Code"
              className="w-48 h-48 rounded-xl border border-gray-100"
            />
            <p className="text-xs text-gray-400 text-center">Show this QR at the venue for entry</p>
            {ticket.status === 'used' && ticket.checked_in_at && (
              <p className="text-xs text-emerald-600 font-medium">
                ✓ Checked in at {format(new Date(ticket.checked_in_at), 'h:mm a, MMM d')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithRetry(
      () => ticketsAPI.my(),
      { onWaking: setWaking }
    )
      .then(r => setTickets(r.data.tickets || []))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => { setLoading(false); setWaking(false); });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Tickets</h1>
        <p className="text-gray-500 dark:text-slate-400">Your registered events and digital tickets</p>
      </div>

      {waking && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex items-center gap-2">
          <span className="animate-pulse">⏳</span> Server is waking up, please wait...
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="h-4 shimmer rounded w-3/4" />
              <div className="h-3 shimmer rounded w-1/2" />
              <div className="h-3 shimmer rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Register for an event to get your digital tickets here</p>
          <Link to="/events" className="btn-primary inline-flex items-center gap-2">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
        </div>
      )}
    </div>
  );
};
