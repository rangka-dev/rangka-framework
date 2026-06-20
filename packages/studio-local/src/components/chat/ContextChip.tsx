import { X } from 'lucide-react';

type ContextChipProps = {
  widgetPath: string[];
  onDismiss: () => void;
};

export function ContextChip({ widgetPath, onDismiss }: ContextChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
      {widgetPath.join(' > ')}
      <button onClick={onDismiss} className="rounded-full p-0.5 hover:bg-primary/20">
        <X className="size-3" />
      </button>
    </span>
  );
}
