import { ScrollArea } from '@/components/ui/scroll-area';
import { ResourceTree } from './ResourceTree';
import { useStudio } from '@/hooks/useStudio';

interface ResourcesTabProps {
  onOpenFile?: (path: string) => void;
}

export function ResourcesTab({ onOpenFile }: ResourcesTabProps) {
  const { resources } = useStudio();

  if (resources.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No resources yet. Start a conversation to build your app.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <ResourceTree modules={resources} onOpenFile={onOpenFile} />
      </div>
    </ScrollArea>
  );
}
