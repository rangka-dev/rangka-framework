import { ChevronsUpDownIcon, LayoutGridIcon } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppSidebarModule } from './types';

interface ModuleSwitcherProps {
  modules: AppSidebarModule[];
  activeModule?: string;
  onModuleSwitch: (name: string) => void;
  onAllModules?: () => void;
}

export function ModuleSwitcher({
  modules,
  activeModule,
  onModuleSwitch,
  onAllModules,
}: ModuleSwitcherProps) {
  const { isMobile } = useSidebar();
  const active = modules.find((m) => m.name === activeModule) ?? modules[0];

  if (!active) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {active.icon ?? <span className="text-xs font-bold">{active.label[0]}</span>}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.label}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-48"
            align="start"
            side={isMobile ? 'bottom' : 'bottom'}
            sideOffset={4}
          >
            {modules.map((mod) => (
              <DropdownMenuItem
                key={mod.name}
                onClick={() => onModuleSwitch(mod.name)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {mod.icon ?? <span className="text-xs">{mod.label[0]}</span>}
                </div>
                {mod.label}
              </DropdownMenuItem>
            ))}
            {onAllModules && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onAllModules} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <LayoutGridIcon />
                  </div>
                  All modules
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
