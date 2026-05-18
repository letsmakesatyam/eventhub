import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{
      toast: {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
        warning: (msg) => addToast(msg, 'warning'),
      }
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const iconColors = {
  success: 'bg-emerald-100 text-emerald-600',
  error: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-fade-in ${colors[toast.type]}`}
      >
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${iconColors[toast.type]}`}>
          {icons[toast.type]}
        </span>
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
