import { useState, useCallback, useMemo } from 'react';
import { Input, Card, Tabs } from '@rangka/ui';
import { useMeta } from '../context/MetaContext.js';
import { useApp } from '../context/ModuleContext.js';
import { useRouter } from '@tanstack/react-router';
import type { NavigationTree } from '@rangka/shared';

type FilterTab = 'all' | 'favorite' | 'internal' | 'external';

export function ModuleSelectorPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { navigation } = useMeta();
  const { setActiveApp } = useApp();
  const router = useRouter();

  const appsWithPages = navigation.filter(
    (mod: NavigationTree) =>
      mod.sections.length > 0 && mod.sections.some((s) => s.items.length > 0),
  );

  const filtered = useMemo(() => {
    let result = appsWithPages;

    if (activeTab === 'internal') {
      result = result.filter((mod: NavigationTree) => mod.type !== 'external');
    } else if (activeTab === 'external') {
      result = result.filter((mod: NavigationTree) => mod.type === 'external');
    } else if (activeTab === 'favorite') {
      result = result.filter((mod: NavigationTree) => {
        const favorites = JSON.parse(localStorage.getItem('rangka:favorite-apps') || '[]');
        return favorites.includes(mod.app);
      });
    }

    if (search) {
      result = result.filter((mod: NavigationTree) =>
        mod.label.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return result;
  }, [appsWithPages, activeTab, search]);

  const handleAppSelect = useCallback(
    (appName: string) => {
      setActiveApp(appName);
      const mod = navigation.find((n: NavigationTree) => n.app === appName);
      const firstItem = mod?.sections[0]?.items[0];
      if (firstItem) {
        router.navigate({ to: firstItem.path });
      }
    },
    [navigation, router, setActiveApp],
  );

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v: string | number) => setActiveTab(v as FilterTab)}>
        <Tabs.List>
          <Tabs.Trigger value="all">All</Tabs.Trigger>
          <Tabs.Trigger value="favorite">Favorite</Tabs.Trigger>
          <Tabs.Trigger value="internal">Internal</Tabs.Trigger>
          <Tabs.Trigger value="external">External</Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      <Input
        placeholder="Search apps..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p>No apps found</p>
      ) : (
        <div>
          {filtered.map((mod: NavigationTree) => (
            <Card key={mod.app} onClick={() => handleAppSelect(mod.app)}>
              <Card.Header>
                <Card.Title>{mod.label}</Card.Title>
              </Card.Header>
              <Card.Content>
                <p>{mod.description || 'No description'}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
