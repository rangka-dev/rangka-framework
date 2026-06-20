import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SelectionPopoverProps = {
  visible: boolean;
  position: { x: number; y: number };
  onSubmit: (text: string) => void;
  onClose: () => void;
};

export function SelectionPopover({ visible, position, onSubmit, onClose }: SelectionPopoverProps) {
  const [text, setText] = useState('');

  if (!visible) return null;

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-2 w-64"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-1">
        <input
          type="text"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="What do you want to change?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSubmit}>
          <Send className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
