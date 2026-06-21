import { useState } from 'react';
import { EyeIcon } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Button } from '../../../../components/ui/button.js';
import { Popover, PopoverTrigger, PopoverContent } from '../../../../components/ui/popover.js';
import type { DatagridColumnMeta } from '../hooks/useDatagridColumns.js';

interface ColumnVisibilityToggleProps {
  table: Table<Record<string, unknown>>;
}

export function ColumnVisibilityToggle({ table }: ColumnVisibilityToggleProps) {
  const [open, setOpen] = useState(false);
  const columns = table.getAllLeafColumns();
  const visibleCount = columns.filter((c) => c.getIsVisible()).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0">
          <EyeIcon className="h-3.5 w-3.5" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="end">
        <div className="flex flex-col py-1 max-h-64 overflow-auto">
          {columns.map((col) => {
            const meta = col.columnDef.meta as DatagridColumnMeta | undefined;
            const isLastVisible = col.getIsVisible() && visibleCount <= 1;
            return (
              <label
                key={col.id}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={col.getIsVisible()}
                  disabled={isLastVisible}
                  onChange={col.getToggleVisibilityHandler()}
                  className="h-3.5 w-3.5"
                />
                {meta?.label ?? col.id}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
