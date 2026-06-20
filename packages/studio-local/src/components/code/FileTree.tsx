import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type { FileNode } from '@rangka/studio-core/protocol';

function FileItem({
  node,
  depth,
  onFileClick,
}: {
  node: FileNode;
  depth: number;
  onFileClick?: (path: string) => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => node.path && onFileClick?.(node.path)}
    >
      <FileText className="size-3.5" />
      <span>{node.name}</span>
    </div>
  );
}

function FolderItem({
  node,
  depth,
  onFileClick,
}: {
  node: FileNode;
  depth: number;
  onFileClick?: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-foreground hover:bg-muted"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <ChevronRight className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        {open ? <FolderOpen className="size-3.5" /> : <Folder className="size-3.5" />}
        <span>{node.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {node.children && (
          <FileTree nodes={node.children} depth={depth + 1} onFileClick={onFileClick} />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FileTree({
  nodes,
  depth = 0,
  onFileClick,
}: {
  nodes: FileNode[];
  depth?: number;
  onFileClick?: (path: string) => void;
}) {
  return (
    <div>
      {nodes.map((node) =>
        node.type === 'folder' ? (
          <FolderItem key={node.name} node={node} depth={depth} onFileClick={onFileClick} />
        ) : (
          <FileItem key={node.name} node={node} depth={depth} onFileClick={onFileClick} />
        ),
      )}
    </div>
  );
}
