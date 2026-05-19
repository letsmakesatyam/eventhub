import { useState, useEffect } from 'react';
import { adminAPI, fetchWithRetry } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Users, Plus, Shield, User, Eye, EyeOff, X } from 'lucide-react';
import { format } from 'date-fns';

const CreateAdminModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      setSaving(true);
      await adminAPI.createAdmin({ name: form.name, email: form.email, password: form.password });
      toast.success('Admin account created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create admin account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Admin Account</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={upd('name')}
              placeholder="Admin Name"
              className="input-field"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={upd('email')}
              placeholder="admin@example.com"
              className="input-field"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={upd('password')}
                placeholder="Min. 6 characters"
                className="input-field pr-12"
                autoComplete="new-password"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={upd('confirm')}
              placeholder="Re-enter password"
              className="input-field"
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetchWithRetry(() => adminAPI.users())
      .then(r => setUsers(r.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const admins = users.filter(u => u.role === 'admin');
  const regularUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Users</h1>
          <p className="text-gray-500 dark:text-slate-400">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} · {regularUsers.length} regular user{regularUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Admin
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-slate-400">User</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-600 dark:text-slate-400">Role</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-600 dark:text-slate-400">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                            u.role === 'admin'
                              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                          }`}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge font-medium ${
                          u.role === 'admin'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 dark:text-slate-400">
                        {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <CreateAdminModal
          onClose={() => setShowModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
};
