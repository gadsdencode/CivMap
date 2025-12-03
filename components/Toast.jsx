import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-green-900/90 border-green-700 text-green-100',
    error: 'bg-red-900/90 border-red-700 text-red-100',
    warning: 'bg-amber-900/90 border-amber-700 text-amber-100',
    info: 'bg-cyan-900/90 border-cyan-700 text-cyan-100'
  };

  const Icon = icons[type] || icons.info;

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-2xl min-w-[300px] max-w-md ${colors[type]}`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div
      className="fixed top-16 right-4 z-[9999] flex flex-col gap-2"
      style={{ 
        position: 'fixed',
        top: '64px',
        right: '16px',
        zIndex: 9999 
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id}>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;

