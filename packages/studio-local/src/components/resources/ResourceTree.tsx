import { useState, useEffect, useCallback } from 'react';
import { Box, LayoutDashboard, Zap, GitBranch, ChevronRight, Folder, Plus } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type { ResourceModule, ResourceItem } from '@rangka/studio-core/protocol';

const resourceTypeConfig = {
  model: { icon: Box, label: 'Models', plural: 'models' },
  page: { icon: LayoutDashboard, label: 'Pages', plural: 'pages' },
  service: { icon: Zap, label: 'Services', plural: 'services' },
  hook: { icon: GitBranch, label: 'Hooks', plural: 'hooks' },
} as const;

type ResourceType = ResourceItem['type'];

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  moduleName: string;
  resourceType: ResourceType;
}

function resourceToPath(moduleName: string, type: ResourceType, name: string): string {
  return `modules/${moduleName}/${resourceTypeConfig[type].plural}/${name}.ts`;
}

function ResourceGroup({
  type,
  resources,
  moduleName,
  onContextMenu,
  onOpenFile,
}: {
  type: ResourceType;
  resources: ResourceItem[];
  moduleName: string;
  onContextMenu: (e: React.MouseEvent, type: ResourceType) => void;
  onOpenFile?: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const config = resourceTypeConfig[type];
  const Icon = config.icon;

  if (resources.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group flex items-center">
        <CollapsibleTrigger
          className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          onContextMenu={(e) => onContextMenu(e, type)}
        >
          <ChevronRight className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
          <span>{config.label}</span>
        </CollapsibleTrigger>
        <button
          className="mr-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          onClick={() => console.log('add', type, 'to', moduleName)}
        >
          <Plus className="size-3" />
          <span>Add</span>
        </button>
      </div>
      <CollapsibleContent>
        <div className="ml-2">
          {resources.map((resource) => (
            <div
              key={resource.name}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => onOpenFile?.(resourceToPath(moduleName, type, resource.name))}
            >
              <Icon className="size-4 text-muted-foreground" />
              <span>{resource.name}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ResourceTree({
  modules,
  onOpenFile,
}: {
  modules: ResourceModule[];
  onOpenFile?: (path: string) => void;
}) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    moduleName: '',
    resourceType: 'model',
  });

  const closeMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleClick = () => closeMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.visible, closeMenu]);

  return (
    <div className="space-y-1">
      {modules.map((module) => {
        const grouped = module.resources.reduce<Partial<Record<ResourceType, ResourceItem[]>>>(
          (acc, r) => {
            (acc[r.type] ??= []).push(r);
            return acc;
          },
          {},
        );

        return (
          <ModuleSection
            key={module.name}
            name={module.name}
            grouped={grouped}
            onOpenFile={onOpenFile}
            onGroupContextMenu={(e, type) => {
              e.preventDefault();
              setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                moduleName: module.name,
                resourceType: type,
              });
            }}
          />
        );
      })}

      {contextMenu.visible && (
        <div
          className="fixed z-50 rounded-md border border-border bg-popover p-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            onClick={() => {
              console.log('add', contextMenu.resourceType, 'to', contextMenu.moduleName);
              closeMenu();
            }}
          >
            <Plus className="size-3.5" />
            Add {resourceTypeConfig[contextMenu.resourceType].label.slice(0, -1)}
          </button>
        </div>
      )}
    </div>
  );
}

function ModuleSection({
  name,
  grouped,
  onOpenFile,
  onGroupContextMenu,
}: {
  name: string;
  grouped: Partial<Record<ResourceType, ResourceItem[]>>;
  onOpenFile?: (path: string) => void;
  onGroupContextMenu: (e: React.MouseEvent, type: ResourceType) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-muted">
        <ChevronRight className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        <Folder className="size-4" />
        <span>{name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 space-y-0.5">
          {(['model', 'page', 'service', 'hook'] as ResourceType[]).map((type) => (
            <ResourceGroup
              key={type}
              type={type}
              resources={grouped[type] ?? []}
              moduleName={name}
              onContextMenu={onGroupContextMenu}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
