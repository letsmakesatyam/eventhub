import { useState, useEffect } from 'react';
import { eventsAPI, fetchWithRetry } from '../lib/api';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard';
import { Search, Filter } from 'lucide-react';

const CATEGORIES = ['All', 'Technology', 'Design', 'Networking', 'Music', 'Business', 'General'];

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchWithRetry(
          () => eventsAPI.list(),
          { onWaking: setWaking }
        );
        setEvents(res.data.events || []);
      } catch (err) {
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
        setWaking(false);
      }
    };
    load();
  }, []);

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upcoming Events</h1>
        <p className="text-gray-500 dark:text-slate-400">Discover and register for events happening near you</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events or locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Server waking message */}
      {waking && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-sm font-medium text-amber-800">Server is waking up, please wait...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm text-red-600 underline">
            Try again
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No events found</h3>
          <p className="text-gray-500 dark:text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
};
