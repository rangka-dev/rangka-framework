import { ChevronRightIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AppSidebarNavSection } from './types';

interface NavMainProps {
  sections: AppSidebarNavSection[];
  currentPath: string;
  onNavigate: (url: string) => void;
}

export function NavMain({ sections, currentPath, onNavigate }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {sections.map((section) => (
          <Collapsible
            key={section.title}
            asChild
            defaultOpen={section.items.some((item) => currentPath === item.url)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={section.title}>
                  {section.icon}
                  <span>{section.title}</span>
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {section.items.map((item) => (
                    <SidebarMenuSubItem key={item.url}>
                      <SidebarMenuSubButton asChild isActive={currentPath === item.url}>
                        <a
                          href={item.url}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(item.url);
                          }}
                        >
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
