import { useState, useEffect, useCallback, useRef } from 'react';
import { useShellComponents } from '../ui/UIProvider.js';

interface ToastItem {
  id: number;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
}

let nextId = 0;

export function ToastRenderer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const { Toast } = useShellComponents();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    function handleToast(e: Event) {
      const { message, type } = (e as CustomEvent).detail;
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant: type ?? 'info' }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timersRef.current.set(id, timer);
    }

    document.addEventListener('rangka:toast', handleToast);
    return () => document.removeEventListener('rangka:toast', handleToast);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.variant}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}
