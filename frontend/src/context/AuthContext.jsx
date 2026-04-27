import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eh_token');
    const savedUser = localStorage.getItem('eh_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
      // Re-validate token in background
      authAPI.me().then(r => {
        setUser(r.data.user);
        localStorage.setItem('eh_user', JSON.stringify(r.data.user));
      }).catch(() => {
        localStorage.removeItem('eh_token');
        localStorage.removeItem('eh_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('eh_token', token);
    localStorage.setItem('eh_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('eh_token', token);
    localStorage.setItem('eh_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('eh_token');
    localStorage.removeItem('eh_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
