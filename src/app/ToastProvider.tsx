import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  push: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto min-w-[240px] max-w-sm rounded-md border px-3 py-2 text-sm shadow-md',
              t.tone === 'info' && 'border-border bg-card text-foreground',
              t.tone === 'success' && 'border-success/40 bg-success/10 text-foreground',
              t.tone === 'warning' && 'border-warning/40 bg-warning/10 text-foreground',
              t.tone === 'error' && 'border-destructive/40 bg-destructive/10 text-foreground',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
