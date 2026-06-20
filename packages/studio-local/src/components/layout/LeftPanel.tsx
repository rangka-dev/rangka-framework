import { useState, type ReactNode } from 'react';
import { MessageSquare, FolderTree, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftPanelProps {
  chatContent: ReactNode;
  resourcesContent: ReactNode;
  codeContent: ReactNode;
}

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'resources', label: 'Resources', icon: FolderTree },
  { id: 'code', label: 'Code', icon: Code },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function LeftPanel({ chatContent, resourcesContent, codeContent }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('chat');

  const content: Record<TabId, ReactNode> = {
    chat: chatContent,
    resources: resourcesContent,
    code: codeContent,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center gap-1 border-b border-border px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 px-2 py-1.5 text-sm transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">{content[activeTab]}</div>
    </div>
  );
}
