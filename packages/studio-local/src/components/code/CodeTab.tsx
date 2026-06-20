import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/hooks/useStudio';
import { FileTree } from './FileTree';

export function CodeTab({ onFileClick }: { onFileClick?: (path: string) => void }) {
  const { fileTree, requestFileTree } = useStudio();

  useEffect(() => {
    requestFileTree();
  }, [requestFileTree]);

  if (fileTree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No files found
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <FileTree nodes={fileTree} onFileClick={onFileClick} />
      </div>
    </ScrollArea>
  );
}
