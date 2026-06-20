import { useState } from 'react';
import { useDrawer } from './DrawerContext.js';

export function ShellDevTools() {
  const [visible, setVisible] = useState(false);
  const { state, openDrawer, closeDrawer } = useDrawer();

  if (import.meta.env.PROD) return null;

  return (
    <>
      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-3 right-3 z-[9999] flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground text-xs font-bold shadow-sm"
        aria-label="Toggle dev tools"
      >
        D
      </button>

      {visible && (
        <div className="fixed bottom-12 right-3 z-[9999] w-72 rounded-sm border border-border bg-background p-3 shadow-md">
          <h3 className="mb-2 text-xs font-semibold text-foreground">Shell Dev Tools</h3>

          <div className="space-y-2">
            <fieldset className="space-y-1.5 border border-border rounded-sm p-2">
              <legend className="px-1 text-xs text-muted-foreground">Drawer</legend>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Status:</span>
                <span className={state.open ? 'text-success' : 'text-muted-foreground'}>
                  {state.open ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    openDrawer({
                      title: 'Debug Drawer',
                      description: 'Opened from dev tools',
                      size: 'sm',
                      content: <DebugDrawerContent />,
                    })
                  }
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Open SM
                </button>
                <button
                  onClick={() =>
                    openDrawer({
                      title: 'Debug Drawer',
                      description: 'Medium width panel',
                      size: 'md',
                      content: <DebugDrawerContent />,
                    })
                  }
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Open MD
                </button>
                <button
                  onClick={() =>
                    openDrawer({
                      title: 'Debug Drawer',
                      description: 'Large width panel',
                      size: 'lg',
                      content: <DebugDrawerContent />,
                    })
                  }
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Open LG
                </button>
                <button
                  onClick={closeDrawer}
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Close
                </button>
              </div>
            </fieldset>

            <fieldset className="space-y-1.5 border border-border rounded-sm p-2">
              <legend className="px-1 text-xs text-muted-foreground">Sidebar</legend>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('rangka:sidebar-toggle'))}
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Toggle Collapse
                </button>
              </div>
            </fieldset>

            <fieldset className="space-y-1.5 border border-border rounded-sm p-2">
              <legend className="px-1 text-xs text-muted-foreground">Events</legend>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent('rangka:drawer-open', {
                        detail: {
                          title: 'Event Drawer',
                          description: 'Via rangka:drawer-open',
                          size: 'md',
                        },
                      }),
                    )
                  }
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Fire drawer-open
                </button>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('rangka:drawer-close'))}
                  className="rounded-sm bg-background-raised px-2 py-1 text-xs text-foreground hover:bg-border"
                >
                  Fire drawer-close
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </>
  );
}

function DebugDrawerContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-sm border border-border p-3">
        <h4 className="text-sm font-medium text-foreground">Sample Record</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          This is a debug drawer opened from the dev tools panel.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">ID</span>
          <span className="font-mono text-foreground">REC-001</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Status</span>
          <span className="text-success">Active</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Created</span>
          <span className="text-foreground">2026-06-12</span>
        </div>
      </div>
    </div>
  );
}
