import { useState } from 'react';
import { useStudio } from '@/hooks/useStudio';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatContext } from './ChatContext';
import { EmptyChatState } from './EmptyChatState';
import { SessionPicker } from './SessionPicker';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatTabProps {
  widgetPath?: string[] | null;
  onDismissContext?: () => void;
}

export function ChatTab({ widgetPath, onDismissContext }: ChatTabProps) {
  const { messages, send, sessionLoaded } = useStudio();
  const [started, setStarted] = useState(false);

  const handleSend = (text: string) => {
    if (!started) setStarted(true);
    send(text, widgetPath ? { widgetPath } : undefined);
    onDismissContext?.();
  };

  const handleSelectPrompt = (prompt: string) => {
    setStarted(true);
    send(prompt);
  };

  const showEmptyState = sessionLoaded && !started && messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border">
        <SessionPicker />
      </div>
      {!sessionLoaded ? (
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="ml-8 h-8 w-3/4 rounded-lg" />
          <Skeleton className="mr-8 h-16 w-full" />
          <Skeleton className="ml-8 h-8 w-1/2 rounded-lg" />
          <Skeleton className="mr-8 h-24 w-full" />
        </div>
      ) : showEmptyState ? (
        <EmptyChatState onSelectPrompt={handleSelectPrompt} />
      ) : (
        <MessageList messages={messages} />
      )}
      <div className="shrink-0 border-t border-border p-3">
        {widgetPath && widgetPath.length > 0 && (
          <ChatContext widgetPath={widgetPath} onDismiss={onDismissContext!} />
        )}
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
