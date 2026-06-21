import type { Header } from '@tanstack/react-table';

interface ColumnResizeHandleProps {
  header: Header<Record<string, unknown>, unknown>;
}

export function ColumnResizeHandle({ header }: ColumnResizeHandleProps) {
  if (!header.column.getCanResize()) return null;

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        header.getResizeHandler()(e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        header.getResizeHandler()(e);
      }}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      draggable={false}
      className={`absolute right-0 top-0 h-full w-3 cursor-col-resize select-none touch-none group ${
        header.column.getIsResizing() ? 'bg-primary/10' : ''
      }`}
    >
      <div
        className={`absolute right-0 top-0 h-full w-0.5 transition-colors group-hover:bg-primary/50 ${
          header.column.getIsResizing() ? 'bg-primary' : ''
        }`}
      />
    </div>
  );
}
