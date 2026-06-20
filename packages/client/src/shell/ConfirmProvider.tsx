import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog.js';

interface ConfirmRequest {
  message: string;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ConfirmRequest | null>(null);
  const queue = useRef<ConfirmRequest[]>([]);

  const processNext = useCallback(() => {
    if (queue.current.length > 0) {
      setCurrent(queue.current.shift()!);
    } else {
      setCurrent(null);
    }
  }, []);

  const handleResponse = useCallback(
    (value: boolean) => {
      current?.resolve(value);
      processNext();
    },
    [current, processNext],
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, resolve } = (e as CustomEvent).detail;
      const request: ConfirmRequest = { message, resolve };
      if (current) {
        queue.current.push(request);
      } else {
        setCurrent(request);
      }
    };
    document.addEventListener('rangka:confirm', handler);
    return () => document.removeEventListener('rangka:confirm', handler);
  }, [current]);

  return (
    <>
      {children}
      {current && (
        <ConfirmDialog
          message={current.message}
          onConfirm={() => handleResponse(true)}
          onCancel={() => handleResponse(false)}
        />
      )}
    </>
  );
}
