import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast } from './Toast.js';
import type { ToastType } from './ShellContext.js';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = String(++idCounter);
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      if (next.length > 5) return next.slice(next.length - 5);
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      addToast(message, type ?? 'info');
    };
    document.addEventListener('rangka:toast', handler);
    return () => document.removeEventListener('rangka:toast', handler);
  }, [addToast]);

  return (
    <>
      {children}
      <div
        ref={containerRef}
        aria-live="polite"
        role="status"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}
