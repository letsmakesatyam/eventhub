import { useState, useEffect } from 'react';
import { eventsAPI, fetchWithRetry } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Trash2, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const EMPTY_FORM = {
  title: '', description: '', event_date: '', end_date: '',
  location: '', venue: '', capacity: 100, price: 0,
  image_url: '', category: 'General', status: 'published'
};

const CATEGORIES = ['General', 'Technology', 'Design', 'Networking', 'Music', 'Business'];

export const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    fetchWithRetry(() => eventsAPI.listAll())
      .then(r => setEvents(r.data.events || []))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setShowModal(true); };
  const openEdit = (event) => {
    setForm({
      ...event,
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
    });
    setEditing(event.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !form.location) {
      return toast.error('Title, date, and location are required');
    }
    try {
      setSaving(true);
      if (editing) {
        await eventsAPI.update(editing, form);
        toast.success('Event updated!');
      } else {
        await eventsAPI.create(form);
        toast.success('Event created!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted');
      load();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Events</h1>
          <p className="text-gray-500">Create and manage your events</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
          <button onClick={openCreate} className="btn-primary mt-2">Create First Event</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Event</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-600">Registrations</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-xs">{event.title}</div>
                      <div className="text-xs text-gray-400">{event.location}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {event.registrations_count} / {event.capacity}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {event.price === 0 ? <span className="text-emerald-600">Free</span> : `₹${event.price}`}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge font-medium ${
                        event.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        event.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                        event.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(event)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input value={form.title} onChange={upd('title')} className="input-field" placeholder="Event title" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={form.description} onChange={upd('description')} className="input-field h-24 resize-none" placeholder="Event description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time *</label>
                  <input type="datetime-local" value={form.event_date} onChange={upd('event_date')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date & Time</label>
                  <input type="datetime-local" value={form.end_date} onChange={upd('end_date')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City / Location *</label>
                  <input value={form.location} onChange={upd('location')} className="input-field" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue</label>
                  <input value={form.venue} onChange={upd('venue')} className="input-field" placeholder="Venue name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity *</label>
                  <input type="number" min="1" value={form.capacity} onChange={upd('capacity')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={upd('price')} className="input-field" placeholder="0 for free" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={upd('category')} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={upd('status')} className="input-field">
                    {['draft', 'published', 'ongoing', 'completed', 'cancelled'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                  <input value={form.image_url} onChange={upd('image_url')} className="input-field" placeholder="https://..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
