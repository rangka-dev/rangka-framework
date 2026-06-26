import { forwardRef, type ComponentProps } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';
import { Icon } from '../primitives/icon';

export type TablePaginationProps = ComponentProps<'div'> & {
  /** Current page (1-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total item count */
  total: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
};

export const TablePagination = forwardRef<HTMLDivElement, TablePaginationProps>(
  ({ className, page, pageSize, total, onPageChange, ...props }, ref) => {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    const hasPrev = page > 1;
    const hasNext = end < total;

    return (
      <div
        ref={ref}
        data-slot="table-pagination"
        className={cn(
          'flex items-center justify-between border-t border-border-subtle px-5 py-2.5',
          className,
        )}
        {...props}
      >
        <span className="text-xs text-foreground/50">
          Showing {start}–{end} of {total}
        </span>
        <span className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
          >
            <Icon icon={ChevronLeft} size="sm" />
            <span>Prev</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            <span>Next</span>
            <Icon icon={ChevronRight} size="sm" />
          </Button>
        </span>
      </div>
    );
  },
);

TablePagination.displayName = 'Table.Pagination';
