import { useState, useEffect } from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/settings/SettingsModal';

interface TopBarProps {
  projectName?: string;
}

export function TopBar({ projectName = 'my-app' }: TopBarProps) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <>
      <div className="flex h-12 w-full items-center justify-between border-b border-border bg-background px-4">
        <span className="font-heading font-medium">Rangka Studio Community Edition</span>
        <span className="text-sm text-muted-foreground">{projectName}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
