import { ContextChip } from './ContextChip';

interface ChatContextProps {
  widgetPath: string[];
  onDismiss: () => void;
}

export function ChatContext({ widgetPath, onDismiss }: ChatContextProps) {
  return (
    <div className="mb-2">
      <ContextChip widgetPath={widgetPath} onDismiss={onDismiss} />
    </div>
  );
}
