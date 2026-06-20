import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@/hooks/useStudio';
import { useStudio } from '@/hooks/useStudio';
import { MessageBubble } from './MessageBubble';
import { ToolCallGroup } from './ToolCallGroup';
import { SchemaDiffCard } from './SchemaDiffCard';
import { ThinkingIndicator } from './ThinkingIndicator';

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isAgentWorking, approveSchema, rejectSchema } = useStudio();

  const hasPendingSchemaDiff = messages.some(
    (m) => m.schemaDiff && m.schemaDiff.operations.length > 0 && !m.schemaDiff.resolved,
  );
  const showThinking = isAgentWorking && !hasPendingSchemaDiff;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages, isAgentWorking]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message, index) => {
        const isLastAgent =
          message.role === 'agent' && isAgentWorking && index === messages.length - 1;

        return (
          <div key={message.id} className="space-y-3">
            <MessageBubble role={message.role} content={message.content} />
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolCallGroup toolCalls={message.toolCalls} isWorking={isLastAgent} />
            )}
            {message.schemaDiff && (
              <SchemaDiffCard
                operations={message.schemaDiff.operations.map((op) => ({
                  id: op.id,
                  type: op.type,
                  sql: op.ddl,
                  destructive: op.destructive,
                  detail: op.detail,
                }))}
                onApprove={() => approveSchema(message.schemaDiff!.operations.map((op) => op.id))}
                onReject={() => rejectSchema()}
              />
            )}
          </div>
        );
      })}
      {showThinking && <ThinkingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
