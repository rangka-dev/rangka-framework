import { useCallback, useRef } from 'react';
import { COLUMN_MIN_WIDTH } from './use-column-state';

interface UseColumnResizeOptions {
  onResize: (field: string, width: number) => void;
  onResizeEnd?: (field: string, width: number) => void;
}

export function useColumnResize({ onResize, onResizeEnd }: UseColumnResizeOptions) {
  const stateRef = useRef<{
    field: string;
    startX: number;
    startWidth: number;
    overlay: HTMLDivElement | null;
  } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!stateRef.current) return;
      const { field, startX, startWidth } = stateRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(COLUMN_MIN_WIDTH, startWidth + delta);
      onResize(field, newWidth);
    },
    [onResize],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!stateRef.current) return;
      const { field, startX, startWidth, overlay } = stateRef.current;

      const delta = e.clientX - startX;
      const finalWidth = Math.max(COLUMN_MIN_WIDTH, startWidth + delta);

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      document.body.style.cursor = '';

      if (overlay) {
        overlay.remove();
      }

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);

      onResizeEnd?.(field, finalWidth);
      stateRef.current = null;
    },
    [handlePointerMove, onResizeEnd],
  );

  const startResize = useCallback(
    (field: string, width: number, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.cursor = 'col-resize';

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;';
      document.body.appendChild(overlay);

      stateRef.current = {
        field,
        startX: e.clientX,
        startWidth: width,
        overlay,
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  return { startResize };
}
