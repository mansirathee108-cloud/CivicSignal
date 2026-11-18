import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2 max-w-sm">
        {items.map((t) => (
          <div key={t.id} role="status" className="card flex items-start gap-3 px-4 py-3 shadow-lift">
            {t.type === 'error'
              ? <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              : <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            <p className="text-sm text-ink flex-1">{t.message}</p>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
