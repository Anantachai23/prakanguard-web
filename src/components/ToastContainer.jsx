import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-hotel-gold shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/90 text-amber-100';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/90 text-rose-100';
      default:
        return 'border-hotel-gold/30 bg-[#0B132B]/95 text-slate-100';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in ${getBorderColor(toast.type)}`}
        >
          {getIcon(toast.type)}
          <div className="flex-1 text-sm">
            {toast.title && <div className="font-semibold mb-0.5 text-white">{toast.title}</div>}
            <div className="text-slate-200 text-xs sm:text-sm leading-relaxed">{toast.message}</div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
