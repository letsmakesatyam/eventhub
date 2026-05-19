import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Ticket, Eye, EyeOff, Shield } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/events';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl mb-4">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Sign in to your EventHub account</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Create one</Link>
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Are you an admin?{' '}
            <Link to="/register-admin" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Register as admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreator = location.pathname === '/register-organizer';

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      setLoading(true);
      const role = isCreator ? 'organizer' : 'user';
      const user = await register(form.name, form.email, form.password, role);
      toast.success(`Welcome to EventHub, ${user.name.split(' ')[0]}!`);
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl mb-4">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {isCreator ? 'Create your organizer account' : 'Create your account'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            {isCreator ? 'Register as an event creator and start organizing events on EventHub.' : 'Join EventHub to discover amazing events.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Priya Sharma', autocomplete: 'name' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' },
            ].map(({ label, key, type, placeholder, autocomplete }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{label}</label>
                <input type={type} value={form[key]} onChange={update(key)} placeholder={placeholder} className="input-field" autoComplete={autocomplete} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min. 6 characters"
                  className="input-field pr-12"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Re-enter password" className="input-field" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : isCreator ? 'Create Organizer Account' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Sign in</Link>
          </p>
          {!isCreator && (
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Are you an admin?{' '}
              <Link to="/register-admin" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Register as admin</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminRegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      setLoading(true);
      const user = await register(form.name, form.email, form.password, 'organizer');
      toast.success(`Admin account created! Welcome, ${user.name.split(' ')[0]}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Admin Account</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Register as an administrator to manage events, users, and revenue on EventHub.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-5 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/40">
            <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Admin accounts have full access to manage events, view all users, validate tickets, and see revenue analytics.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Admin Name', autocomplete: 'name' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'admin@example.com', autocomplete: 'email' },
            ].map(({ label, key, type, placeholder, autocomplete }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{label}</label>
                <input type={type} value={form[key]} onChange={update(key)} placeholder={placeholder} className="input-field" autoComplete={autocomplete} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min. 6 characters"
                  className="input-field pr-12"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Re-enter password" className="input-field" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              {loading ? 'Creating admin account...' : 'Create Admin Account'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Want a regular account?{' '}
            <Link to="/register" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Register as user</Link>
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
