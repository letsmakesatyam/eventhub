import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, paymentsAPI, fetchWithRetry } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Users, Tag, Clock, ArrowLeft, Ticket } from 'lucide-react';
import { format } from 'date-fns';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    fetchWithRetry(
      () => eventsAPI.get(id),
      { onWaking: setWaking }
    )
      .then(r => setEvent(r.data.event))
      .catch(() => toast.error('Failed to load event'))
      .finally(() => { setLoading(false); setWaking(false); });
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    try {
      setRegistering(true);

      // Check if free event
      const orderRes = await paymentsAPI.createOrder({ event_id: id });
      const { free, order_id, amount, key, registration_id } = orderRes.data;

      if (free) {
        await paymentsAPI.registerFree({ event_id: id });
        toast.success('Registered successfully! Check your tickets.');
        navigate('/my-tickets');
        return;
      }

      // Razorpay payment
      const options = {
        key,
        amount,
        currency: 'INR',
        name: 'EventHub',
        description: event.title,
        order_id,
        handler: async (response) => {
          try {
            const verifyRes = await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              registration_id,
            });
            toast.success('Payment successful! Your ticket is ready.');
            navigate('/my-tickets');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => {
            setRegistering(false);
            toast.info('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setRegistering(false);
      });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast.error(msg);
      setRegistering(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-64 shimmer rounded-2xl mb-6" />
      <div className="h-8 shimmer rounded w-2/3 mb-4" />
      <div className="h-4 shimmer rounded w-1/2 mb-3" />
      <div className="h-4 shimmer rounded w-1/3" />
    </div>
  );

  if (!event) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Event not found</h2>
      <Link to="/events" className="text-violet-600 underline">Browse all events</Link>
    </div>
  );

  const soldOut = event.registrations_count >= event.capacity;
  const spotsLeft = event.capacity - event.registrations_count;
  const occupancy = Math.round((event.registrations_count / event.capacity) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {waking && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex items-center gap-2">
          <span className="animate-pulse">⏳</span> Server is waking up...
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-violet-100 via-indigo-50 to-blue-100 flex items-center justify-center">
            <span className="text-7xl opacity-30">🎪</span>
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <span className="badge bg-violet-100 text-violet-700 font-semibold">{event.category}</span>
            <span className={`badge ${event.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {event.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
          <p className="text-gray-600 leading-relaxed">{event.description}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {/* Details */}
        <div className="sm:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Event Details</h2>
            <div className="grid gap-3">
              {[
                { icon: Calendar, label: 'Date', val: format(new Date(event.event_date), 'EEEE, MMMM d, yyyy') },
                { icon: Clock, label: 'Time', val: format(new Date(event.event_date), 'h:mm a') + (event.end_date ? ` – ${format(new Date(event.end_date), 'h:mm a')}` : '') },
                { icon: MapPin, label: 'Location', val: `${event.venue ? event.venue + ', ' : ''}${event.location}` },
                { icon: Users, label: 'Capacity', val: `${event.registrations_count} / ${event.capacity} registered` },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-gray-800 font-medium">{val}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Occupancy bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{occupancy}% filled</span>
                <span>{soldOut ? 'Sold out' : `${spotsLeft} spots remaining`}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${occupancy > 80 ? 'bg-red-400' : 'bg-violet-500'}`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Registration Card */}
        <div className="sm:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {event.price === 0 ? (
                  <span className="text-emerald-600">Free</span>
                ) : (
                  <>₹{event.price.toLocaleString('en-IN')}</>
                )}
              </div>
              <p className="text-sm text-gray-400">per ticket</p>
            </div>

            {soldOut ? (
              <div className="text-center">
                <div className="bg-gray-100 rounded-xl p-4 mb-3">
                  <p className="text-gray-600 font-medium text-sm">This event is sold out</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                {registering ? 'Processing...' : user ? 'Register Now' : 'Sign in to Register'}
              </button>
            )}

            {!user && !soldOut && (
              <p className="text-xs text-center text-gray-400 mt-3">
                <Link to="/login" className="text-violet-600 hover:underline">Sign in</Link> or{' '}
                <Link to="/register" className="text-violet-600 hover:underline">create account</Link> to register
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
