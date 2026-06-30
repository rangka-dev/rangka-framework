/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from 'react';
import { X, Key, Settings2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useStudio } from '@/hooks/useStudio';

type Provider = 'anthropic' | 'openai';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, availableModels, modelsFetchCount, loadSettings, saveSettings, fetchModels } =
    useStudio();
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open, loadSettings]);

  useEffect(() => {
    if (settings) {
      setProvider(settings.provider);
      setApiKey(settings.apiKey);
      setBaseUrl(settings.baseUrl ?? '');
      setSelectedModels(settings.selectedModels ?? []);
      if (settings.apiKey && availableModels.length === 0) {
        fetchModels({
          provider: settings.provider,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
        });
        setFetching(true);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (fetching) {
      setFetching(false);
    }
  }, [modelsFetchCount]);

  const providerModels = useMemo(
    () => availableModels.filter((m) => m.provider === provider),
    [availableModels, provider],
  );

  const selectedModelObjects = useMemo(
    () =>
      selectedModels.map((id) => {
        const found = availableModels.find((m) => m.id === id);
        return { id, name: found?.name || id, provider: found?.provider || provider };
      }),
    [availableModels, selectedModels, provider],
  );

  if (!open) return null;

  const handleFetchModels = () => {
    setFetching(true);
    fetchModels({ provider, apiKey, baseUrl: baseUrl || undefined });
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId],
    );
  };

  const removeModel = (modelId: string) => {
    setSelectedModels((prev) => prev.filter((id) => id !== modelId));
  };

  const handleSave = () => {
    saveSettings({
      provider,
      apiKey,
      model: settings?.model,
      selectedModels,
      baseUrl: baseUrl || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" />
            <h2 className="text-base font-medium">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <section className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Key className="size-3.5 text-muted-foreground" />
                <h3 className="text-sm font-medium">AI Provider</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your API key is stored locally at ~/.rangka/config.json
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Provider</span>
              <div className="flex gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      provider === p.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/20'
                    }`}
                    onClick={() => setProvider(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">API Key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                Base URL (optional, for proxies or compatible APIs)
              </span>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  provider === 'anthropic'
                    ? 'https://api.anthropic.com'
                    : 'https://api.openai.com/v1'
                }
                className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Models</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={handleFetchModels}
                  disabled={!apiKey || fetching}
                >
                  <RefreshCw className={`size-3 ${fetching ? 'animate-spin' : ''}`} />
                  {fetching ? 'Fetching...' : 'Fetch models'}
                </Button>
              </div>

              {selectedModelObjects.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Selected ({selectedModelObjects.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedModelObjects.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs"
                      >
                        <span>{m.name}</span>
                        <button
                          onClick={() => removeModel(m.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {providerModels.length > 0 ? (
                <Command className="rounded-md border border-border">
                  <CommandInput placeholder="Search models..." />
                  <CommandList>
                    <CommandEmpty>No models found.</CommandEmpty>
                    <CommandGroup>
                      {providerModels.map((m) => {
                        const label = m.name || m.id;
                        return (
                          <CommandItem
                            key={m.id}
                            value={label}
                            data-checked={selectedModels.includes(m.id)}
                            onSelect={() => toggleModel(m.id)}
                          >
                            {label}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              ) : (
                <div className="flex h-8 items-center rounded-md border border-border bg-muted/30 px-2.5">
                  <span className="text-xs text-muted-foreground">
                    {apiKey
                      ? 'Click "Fetch models" to load available models'
                      : 'Enter API key first'}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!apiKey}>
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
