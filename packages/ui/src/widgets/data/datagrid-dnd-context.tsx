import { useState, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/cn';

interface DatagridDndProviderProps {
  items: string[];
  onReorder: (activeField: string, overField: string) => void;
  children: ReactNode;
  renderOverlay?: (field: string) => ReactNode;
}

export function DatagridDndProvider({
  items,
  onReorder,
  children,
  renderOverlay,
}: DatagridDndProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>{activeId && renderOverlay ? renderOverlay(activeId) : null}</DragOverlay>
    </DndContext>
  );
}

export function useSortableHeaderCell(field: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return {
    attributes: attributes as unknown as Record<string, unknown>,
    listeners,
    setNodeRef,
    style,
    isDragging,
  };
}

interface DragOverlayCellProps {
  label: string;
  className?: string;
}

export function DragOverlayCell({ label, className }: DragOverlayCellProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-3 h-9 text-xs font-medium text-foreground/50 bg-card border border-border rounded shadow-lg',
        className,
      )}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}
