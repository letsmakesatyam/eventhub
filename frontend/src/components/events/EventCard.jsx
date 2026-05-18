import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag } from 'lucide-react';
import { format } from 'date-fns';

const categoryColors = {
  Technology: 'bg-blue-50 text-blue-700',
  Design: 'bg-pink-50 text-pink-700',
  Networking: 'bg-emerald-50 text-emerald-700',
  Music: 'bg-purple-50 text-purple-700',
  Business: 'bg-amber-50 text-amber-700',
  General: 'bg-gray-50 text-gray-600',
};

export const EventCard = ({ event }) => {
  const soldOut = event.registrations_count >= event.capacity;
  const spotsLeft = event.capacity - event.registrations_count;
  const colorClass = categoryColors[event.category] || categoryColors.General;

  return (
    <Link to={`/events/${event.id}`} className="event-card group block">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-violet-100 to-indigo-100 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-20">🎪</div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`badge ${colorClass} font-semibold`}>{event.category}</span>
        </div>
        {soldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-900 font-bold px-4 py-1.5 rounded-full text-sm">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-base leading-tight mb-3 group-hover:text-violet-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
            <span>{format(new Date(event.event_date), 'EEE, MMM d · h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Users className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
            <span>{soldOut ? 'Sold out' : `${spotsLeft} spots left`}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="font-bold text-gray-900">
            {event.price === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              <>₹{event.price.toLocaleString('en-IN')}</>
            )}
          </span>
          <span className="text-xs font-medium text-violet-600 group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
};

export const EventCardSkeleton = () => (
  <div className="event-card">
    <div className="h-44 shimmer" />
    <div className="p-5 space-y-3">
      <div className="h-4 shimmer rounded w-3/4" />
      <div className="h-3 shimmer rounded w-1/2" />
      <div className="h-3 shimmer rounded w-2/3" />
      <div className="h-3 shimmer rounded w-1/3" />
    </div>
  </div>
);
