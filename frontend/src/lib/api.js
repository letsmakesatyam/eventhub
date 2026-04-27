import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('eh_token');
        localStorage.removeItem('eh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Retry-aware fetch with server wake detection
 * Useful for Render.com cold starts
 */
export const fetchWithRetry = async (fn, { maxRetries = 3, onWaking } = {}) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNetworkError = !err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK';
      const isServerError = err.response?.status >= 500;

      if ((isNetworkError || isServerError) && attempt < maxRetries - 1) {
        if (onWaking && attempt === 0) onWaking(true);
        const delay = Math.min(2000 * (attempt + 1), 8000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (onWaking) onWaking(false);
      throw err;
    }
  }
};

export const healthCheck = () => api.get('/health');

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// Events
export const eventsAPI = {
  list: (params) => api.get('/api/events', { params }),
  listAll: () => api.get('/api/events/all'),
  get: (id) => api.get(`/api/events/${id}`),
  create: (data) => api.post('/api/events', data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  delete: (id) => api.delete(`/api/events/${id}`),
};

// Payments
export const paymentsAPI = {
  createOrder: (data) => api.post('/api/payments/create-order', data),
  verify: (data) => api.post('/api/payments/verify', data),
  registerFree: (data) => api.post('/api/payments/register-free', data),
};

// Tickets
export const ticketsAPI = {
  my: () => api.get('/api/tickets/my'),
  get: (id) => api.get(`/api/tickets/${id}`),
  validate: (data) => api.post('/api/tickets/validate', data),
  byEvent: (eventId) => api.get(`/api/tickets/event/${eventId}`),
};

// Admin
export const adminAPI = {
  dashboard: () => api.get('/api/admin/dashboard'),
  revenue: () => api.get('/api/admin/revenue'),
  attendees: (eventId) => api.get(`/api/admin/events/${eventId}/attendees`),
  users: () => api.get('/api/admin/users'),
};

export default api;
