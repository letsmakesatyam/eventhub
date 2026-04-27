import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Menu, X, Ticket, LogOut, User, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Event<span className="gradient-text">Hub</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/events"
              className={`text-sm font-medium transition-colors ${isActive('/events') ? 'text-violet-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Events
            </Link>
            {user && (
              <Link
                to="/my-tickets"
                className={`text-sm font-medium transition-colors ${isActive('/my-tickets') ? 'text-violet-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                My Tickets
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${isActive('/admin') ? 'text-violet-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  {isAdmin && <span className="badge bg-violet-100 text-violet-700">Admin</span>}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link to="/events" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setOpen(false)}>Events</Link>
          {user && <Link to="/my-tickets" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setOpen(false)}>My Tickets</Link>}
          {isAdmin && <Link to="/admin" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setOpen(false)}>Admin Dashboard</Link>}
          {user ? (
            <button onClick={handleLogout} className="block w-full text-left text-sm font-medium text-red-500 py-2">Logout</button>
          ) : (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Link to="/login" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setOpen(false)}>Sign in</Link>
              <Link to="/register" className="btn-primary block text-center text-sm" onClick={() => setOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
