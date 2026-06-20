import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMeta } from '../context/MetaContext.js';

export interface CommandPaletteGroup {
  group: string;
  items: { id: string; label: string }[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { pages } = useMeta();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const groups = useMemo((): CommandPaletteGroup[] => {
    return [
      {
        group: 'Pages',
        items: pages.map((page) => ({
          id: page.path ?? '/' + page.key.replace('.', '/'),
          label: page.label,
        })),
      },
    ];
  }, [pages]);

  const handleSelect = useCallback(
    (itemId: string) => {
      setOpen(false);
      router.navigate({ to: itemId });
    },
    [router],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search pages..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.group} heading={group.group}>
                {group.items.map((item) => (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item.id)}>
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
