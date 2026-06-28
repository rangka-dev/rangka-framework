import type { ModuleSelectorProps } from '@rangka/shared';

export function ModuleSelector({ apps, onSelect }: ModuleSelectorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h1 className="mb-8 text-lg font-medium text-foreground">Select an app</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {apps.map((app) => (
          <button
            key={app.name}
            onClick={() => onSelect(app.name)}
            className="flex flex-col items-center gap-2 rounded-lg border border-border p-6 transition-colors hover:bg-foreground/5"
          >
            {app.icon && <span className="text-2xl">{app.icon}</span>}
            <span className="text-sm font-medium text-foreground">{app.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

ModuleSelector.displayName = 'ModuleSelector';
