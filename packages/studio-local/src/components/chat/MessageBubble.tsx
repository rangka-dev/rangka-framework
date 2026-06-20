import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageBubbleProps = {
  role: 'user' | 'agent';
  content: string;
};

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="ml-8 max-w-full break-words rounded-lg bg-secondary px-3 py-2 text-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="mr-8 max-w-full break-words text-sm text-foreground prose prose-sm prose-neutral dark:prose-invert prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
