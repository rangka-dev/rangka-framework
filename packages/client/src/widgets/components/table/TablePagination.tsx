import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number | undefined;
  recordCount: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, pageSize, total, recordCount, onPageChange }: TablePaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = total != null ? Math.min(page * pageSize, total) : start + recordCount - 1;
  const hasPrev = page > 1;
  const hasNext = total != null ? end < total : recordCount >= pageSize;

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-sm">
      <span className="text-muted-foreground tabular-nums">
        {total != null ? `Showing ${start}\u2013${end} of ${total}` : `Page ${page}`}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
