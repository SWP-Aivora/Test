import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toastConfig = {
    success: { icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-glow)' },
    error: { icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-glow)' },
    warning: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-glow)' },
    info: { icon: Info, color: 'var(--accent)', bg: 'var(--accent-glow)' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px',
      }}>
        {toasts.map(toast => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          return (
            <div key={toast.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${config.color}`,
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              boxShadow: `0 4px 20px ${config.bg}`,
              animation: 'slideIn 0.3s ease',
            }}>
              <div style={{ background: config.bg, padding: '0.25rem', borderRadius: '6px', display: 'flex', flexShrink: 0, marginTop: '1px' }}>
                <Icon size={16} color={config.color} />
              </div>
              <span style={{ fontSize: '0.85rem', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: 0, display: 'flex', flexShrink: 0,
              }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
