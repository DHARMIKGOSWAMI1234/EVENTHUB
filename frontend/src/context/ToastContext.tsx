// frontend/src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, title?: string) => void;
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Auto dismiss after 4.5s
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast: showToast,
        showToast,
        success,
        error,
        info,
        warning,
        removeToast,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4"
        aria-live="polite"
      >
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              toastItem.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
                : toastItem.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
                : toastItem.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-200'
                : 'bg-slate-900/95 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toastItem.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toastItem.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toastItem.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toastItem.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="flex-1 min-w-0">
              {toastItem.title && <h5 className="font-semibold text-sm text-white mb-0.5">{toastItem.title}</h5>}
              <p className="text-xs text-slate-300 break-words leading-relaxed">{toastItem.message}</p>
            </div>
            <button
              onClick={() => removeToast(toastItem.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
