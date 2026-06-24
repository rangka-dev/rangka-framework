import { useStudio } from '@/hooks/useStudio';

export function StatusBar() {
  const { connectionStatus, runtimeStatus } = useStudio();

  const dotColor =
    connectionStatus === 'connected'
      ? 'bg-green-500'
      : connectionStatus === 'connecting'
        ? 'bg-yellow-500'
        : 'bg-red-500';

  const label =
    connectionStatus === 'connected'
      ? runtimeStatus.status === 'ready'
        ? 'Connected'
        : runtimeStatus.status === 'booting'
          ? 'Starting...'
          : runtimeStatus.status === 'idle'
            ? 'Ready'
            : 'Error'
      : connectionStatus === 'connecting'
        ? 'Connecting...'
        : 'Disconnected';

  return (
    <div className="flex h-8 w-full items-center justify-between border-t border-border px-4 font-mono text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span>{label}</span>
      </div>
      {runtimeStatus.status === 'ready' && (
        <span>
          models: {runtimeStatus.models} · pages: {runtimeStatus.pages} · services:{' '}
          {runtimeStatus.services}
        </span>
      )}
    </div>
  );
}
