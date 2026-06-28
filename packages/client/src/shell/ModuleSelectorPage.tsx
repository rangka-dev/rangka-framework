import { useState, useCallback, useMemo } from 'react';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@/components/Icon';
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

  const appColors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
    green: 'bg-green-500/10 text-green-600 ring-green-500/20',
    purple: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-600 ring-orange-500/20',
    red: 'bg-red-500/10 text-red-600 ring-red-500/20',
    teal: 'bg-teal-500/10 text-teal-600 ring-teal-500/20',
    pink: 'bg-pink-500/10 text-pink-600 ring-pink-500/20',
    amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  };

  const getColorClasses = (color?: string) =>
    appColors[color ?? ''] ?? 'bg-primary/10 text-primary ring-primary/20';

  const handleAppSelect = useCallback(
    (appName: string) => {
      setActiveApp(appName);
      const mod = navigation.find((n: NavigationTree) => n.app === appName);
      const firstPage = mod?.sections[0]?.items[0]?.page;
      if (firstPage) {
        router.navigate({ to: '/' + firstPage.replace('.', '/') });
      }
    },
    [navigation, router, setActiveApp],
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList variant="line">
            <TabsTrigger value="all" className="text-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="favorite" className="text-sm">
              Favorite
            </TabsTrigger>
            <TabsTrigger value="internal" className="text-sm">
              Internal
            </TabsTrigger>
            <TabsTrigger value="external" className="text-sm">
              External
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-9 ring-1 ring-foreground/10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No apps found</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((mod: NavigationTree) => (
            <Card key={mod.app} className="cursor-pointer" onClick={() => handleAppSelect(mod.app)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-md ring-1 ${getColorClasses(mod.color)}`}
                  >
                    {mod.icon ? (
                      <Icon name={mod.icon} size={18} />
                    ) : (
                      <span className="text-sm font-bold">{mod.label[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle>{mod.label}</CardTitle>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {mod.type === 'external' ? 'External' : 'Internal'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="line-clamp-3">
                  {mod.description || 'No description'}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
