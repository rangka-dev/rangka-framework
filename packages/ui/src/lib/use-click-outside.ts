import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(onClose: () => void, active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [active, onClose]);

  return ref;
}
