/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Key,
  Settings2,
  RefreshCw,
  Link,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useStudio } from '@/hooks/useStudio';
import type { OAuthProviderStatus } from '@/hooks/useStudio';
import { KNOWN_PROVIDERS } from '@rangka/studio-core/providers';
import type { ProviderSettings, StudioConfig } from '@rangka/studio-core/protocol';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const {
    settings,
    availableModels,
    loadSettings,
    saveSettings,
    fetchModels,
    oauthStatus,
    startOAuth,
    disconnectOAuth,
  } = useStudio();

  const [activeProvider, setActiveProvider] = useState('anthropic');
  const [providerSettings, setProviderSettings] = useState<Record<string, ProviderSettings>>({});
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);

  // Load settings into local state when modal opens
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open, loadSettings]);

  useEffect(() => {
    if (settings) {
      setActiveProvider(settings.activeProvider);
      setProviderSettings(settings.providers ?? {});
      const currentSettings = settings.providers?.[settings.activeProvider];
      if (currentSettings?.apiKey && availableModels.length === 0) {
        fetchModels();
        setFetching(true);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (fetching && availableModels.length > 0) {
      setFetching(false);
    }
  }, [availableModels, fetching]);

  const currentProvider = useMemo(
    () => KNOWN_PROVIDERS.find((p) => p.id === activeProvider),
    [activeProvider],
  );

  const currentSettings = providerSettings[activeProvider] ?? {};

  const providerModels = useMemo(
    () => availableModels.filter((m) => m.provider === activeProvider),
    [availableModels, activeProvider],
  );

  const selectedModels = currentSettings.selectedModels ?? [];
  const selectedModelObjects = useMemo(
    () =>
      selectedModels.map((id) => {
        const found = availableModels.find((m) => m.id === id);
        return { id, name: found?.name || id };
      }),
    [availableModels, selectedModels],
  );

  if (!open) return null;

  const updateCurrentSettings = (patch: Partial<ProviderSettings>) => {
    setProviderSettings((prev) => ({
      ...prev,
      [activeProvider]: { ...prev[activeProvider], ...patch },
    }));
  };

  const handleProviderChange = (providerId: string) => {
    setActiveProvider(providerId);
    setProviderOpen(false);
  };

  const handleFetchModels = () => {
    // Save current state first so server knows which provider to fetch for
    const config: StudioConfig = { activeProvider, providers: providerSettings };
    saveSettings(config);
    setFetching(true);
    fetchModels();
  };

  const toggleModel = (modelId: string) => {
    const current = currentSettings.selectedModels ?? [];
    const updated = current.includes(modelId)
      ? current.filter((id) => id !== modelId)
      : [...current, modelId];
    updateCurrentSettings({ selectedModels: updated });
  };

  const removeModel = (modelId: string) => {
    const updated = (currentSettings.selectedModels ?? []).filter((id) => id !== modelId);
    updateCurrentSettings({ selectedModels: updated });
  };

  const handleSave = () => {
    const config: StudioConfig = { activeProvider, providers: providerSettings };
    saveSettings(config);
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

        <div className="space-y-6 px-6 py-5">
          <section className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Key className="size-3.5 text-muted-foreground" />
                <h3 className="text-sm font-medium">AI Provider</h3>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your API key is stored locally at ~/.rangka/config.json
              </p>
            </div>

            {/* Provider Dropdown */}
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Provider</span>
              <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                <PopoverTrigger asChild>
                  <button className="flex h-8 w-full items-center justify-between rounded-md border border-border bg-background px-2.5 text-sm">
                    <span>{currentProvider?.name ?? activeProvider}</span>
                    <span className="text-xs text-muted-foreground">Change</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search providers..." />
                    <CommandList>
                      <CommandEmpty>No provider found.</CommandEmpty>
                      <CommandGroup>
                        {KNOWN_PROVIDERS.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => handleProviderChange(p.id)}
                          >
                            <div className="flex flex-col">
                              <span className={activeProvider === p.id ? 'font-medium' : ''}>
                                {p.name}
                              </span>
                              {!p.requiresApiKey && (
                                <span className="text-[10px] text-muted-foreground">
                                  No API key required
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </label>

            {/* Authentication Method — shown when provider supports OAuth */}
            {currentProvider?.supportsOAuth && (
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground">Authentication</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="authMethod"
                      value="api-key"
                      checked={(currentSettings.authMethod ?? 'api-key') === 'api-key'}
                      onChange={() => updateCurrentSettings({ authMethod: 'api-key' })}
                      className="accent-primary"
                    />
                    API Key
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="authMethod"
                      value="oauth"
                      checked={currentSettings.authMethod === 'oauth'}
                      onChange={() => updateCurrentSettings({ authMethod: 'oauth' })}
                      className="accent-primary"
                    />
                    OAuth
                  </label>
                </div>

                {currentSettings.authMethod === 'oauth' && (
                  <OAuthConnectionPanel
                    providerName={currentProvider.name}
                    status={oauthStatus[activeProvider]}
                    onConnect={() => startOAuth(activeProvider)}
                    onDisconnect={() => disconnectOAuth(activeProvider)}
                  />
                )}
              </div>
            )}

            {/* API Key — shown only when provider requires it AND not using OAuth */}
            {currentProvider?.requiresApiKey && currentSettings.authMethod !== 'oauth' && (
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">API Key</span>
                <input
                  type="password"
                  value={currentSettings.apiKey ?? ''}
                  onChange={(e) => updateCurrentSettings({ apiKey: e.target.value })}
                  placeholder={activeProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring"
                />
              </label>
            )}

            {/* Base URL — always visible, placeholder from known provider */}
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                Base URL{currentProvider?.id !== 'custom' ? ' (optional override)' : ' (required)'}
              </span>
              <input
                type="text"
                value={currentSettings.baseUrl ?? ''}
                onChange={(e) => updateCurrentSettings({ baseUrl: e.target.value || undefined })}
                placeholder={currentProvider?.baseUrl || 'https://api.example.com/v1'}
                className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            {/* Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Models</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={handleFetchModels}
                  disabled={
                    (currentProvider?.requiresApiKey && !currentSettings.apiKey) || fetching
                  }
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
                    {currentProvider?.requiresApiKey && !currentSettings.apiKey
                      ? 'Enter API key first'
                      : 'Click "Fetch models" to load available models'}
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
          <Button size="sm" onClick={handleSave}>
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface OAuthConnectionPanelProps {
  providerName: string;
  status?: OAuthProviderStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

function OAuthConnectionPanel({
  providerName,
  status,
  onConnect,
  onDisconnect,
}: OAuthConnectionPanelProps) {
  if (status?.waiting) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Waiting for authorization...</span>
      </div>
    );
  }

  if (status?.connected) {
    const expiresIn = status.expiresAt
      ? Math.max(0, Math.round((status.expiresAt - Date.now()) / (1000 * 60 * 60)))
      : null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2">
          <CheckCircle2 className="size-3.5 text-green-500" />
          <span className="text-xs text-green-600 dark:text-green-400">
            Connected{expiresIn !== null ? ` (expires in ${expiresIn}h)` : ''}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={onDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (status?.error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
          <AlertCircle className="size-3.5 text-red-500" />
          <span className="text-xs text-red-600 dark:text-red-400">{status.error}</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onConnect}>
          <Link className="size-3" />
          Reconnect with {providerName}
        </Button>
      </div>
    );
  }

  // Not connected
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onConnect}>
      <Link className="size-3" />
      Connect with {providerName}
    </Button>
  );
}
