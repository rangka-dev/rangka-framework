import { useState } from 'react';
import { ChevronDown, Plus, MessageSquare } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useStudio } from '@/hooks/useStudio';

export function SessionPicker() {
  const { currentSession, sessions, listSessions, newSession, resumeSession } = useStudio();
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      listSessions();
    }
  };

  const displayName = currentSession?.name || 'New conversation';

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center gap-1 px-3 py-2 text-xs text-foreground hover:bg-muted/50">
          <span className="truncate font-medium">{displayName}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] gap-0 p-1" align="start">
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
          onClick={() => {
            newSession();
            setOpen(false);
          }}
        >
          <Plus className="size-3" />
          <span>New conversation</span>
        </button>
        {sessions.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="max-h-[200px] overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.path}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  onClick={() => {
                    resumeSession(session.path);
                    setOpen(false);
                  }}
                >
                  <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
                  <div className="flex-1 truncate text-left">
                    <span className="truncate">
                      {session.name || session.firstMessage || 'Untitled'}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      · {formatRelativeTime(session.modified)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;

  return `${Math.floor(days / 7)}w`;
}
