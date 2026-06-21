import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseDatagridVirtualOptions {
  rowCount: number;
  rowHeight: number;
  overscan?: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useDatagridVirtual({
  rowCount,
  rowHeight,
  overscan = 5,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseDatagridVirtualOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const checkShouldFetch = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom < rowHeight * 5) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rowHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkShouldFetch, { passive: true });
    return () => el.removeEventListener('scroll', checkShouldFetch);
  }, [checkShouldFetch]);

  useEffect(() => {
    checkShouldFetch();
  }, [checkShouldFetch, rowCount]);

  return {
    scrollRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  };
}
