import { type ReactNode } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useStudio } from '@/hooks/useStudio';

interface CanvasTab {
  id: string;
  label: string;
  closeable: boolean;
  content: ReactNode;
}

interface CanvasProps {
  tabs: CanvasTab[];
  activeTabId: string;
  onActiveTabChange: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export function Canvas({ tabs, activeTabId, onActiveTabChange, onCloseTab }: CanvasProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const { applyChanges, runtimeStatus, hasPendingChanges, isAgentWorking } = useStudio();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-stretch border-b border-border bg-muted/30">
        <div className="flex flex-1 items-stretch overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onActiveTabChange(tab.id)}
              className={cn(
                'group relative flex shrink-0 items-center gap-1.5 border-r border-border px-4 text-xs transition-colors',
                activeTabId === tab.id
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              {activeTabId === tab.id && (
                <span className="absolute inset-x-0 top-0 h-px bg-primary" />
              )}
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.closeable && (
                <X
                  className="ml-1 size-3 rounded-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                />
              )}
            </button>
          ))}
        </div>
        {runtimeStatus.status === 'ready' && (
          <div className="flex shrink-0 items-center border-l border-border px-3">
            <Button
              variant={hasPendingChanges ? 'default' : 'secondary'}
              size="sm"
              className={cn(
                'relative h-7 gap-1.5 overflow-hidden px-3 text-xs font-medium',
                hasPendingChanges &&
                  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
              )}
              onClick={applyChanges}
              disabled={isAgentWorking}
            >
              <RefreshCw className="size-3.5" />
              Apply
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">{activeTab?.content}</div>
    </div>
  );
}
