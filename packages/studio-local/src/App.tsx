import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { Canvas } from '@/components/layout/Canvas';
import { ChatTab } from '@/components/chat/ChatTab';
import { ResourcesTab } from '@/components/resources/ResourcesTab';
import { CodeTab } from '@/components/code/CodeTab';
import { PreviewTab } from '@/components/canvas/PreviewTab';
import { ModelGraphTab } from '@/components/canvas/ModelGraphTab';
import { CodeEditorTab } from '@/components/canvas/CodeEditorTab';
import { StudioProvider, useStudio } from '@/hooks/useStudio';
import { cn } from '@/lib/utils';

interface CanvasTab {
  id: string;
  label: string;
  closeable: boolean;
  content: ReactNode;
  filePath?: string;
}

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'md':
      return 'markdown';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    default:
      return 'plaintext';
  }
}

function FileEditorTab({
  filePath,
  initialContent,
  language,
  onDirtyChange,
  onSave,
  conflict,
  onReload,
  onDismissConflict,
}: {
  filePath: string;
  initialContent: string;
  language: string;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (content: string) => void;
  conflict: boolean;
  onReload: () => void;
  onDismissConflict: () => void;
}) {
  const [editorContent, setEditorContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [prevInitialContent, setPrevInitialContent] = useState(initialContent);
  const filename = filePath.split('/').pop() ?? filePath;

  // Sync editor content when initialContent changes externally (reload after conflict).
  // Uses the React "adjusting state based on props" pattern — setState during render
  // triggers an immediate re-render with the new state before painting.
  if (initialContent !== prevInitialContent) {
    setPrevInitialContent(initialContent);
    setSavedContent(initialContent);
    setEditorContent(initialContent);
  }

  const handleChange = useCallback(
    (content: string) => {
      setEditorContent(content);
      onDirtyChange(content !== savedContent);
    },
    [onDirtyChange, savedContent],
  );

  const handleSave = useCallback(
    (content: string) => {
      onSave(content);
      setSavedContent(content);
      onDirtyChange(false);
    },
    [onSave, onDirtyChange],
  );

  return (
    <div className="flex h-full flex-col">
      {conflict && (
        <div className="flex items-center gap-2 border-b border-border bg-yellow-500/10 px-3 py-2 text-sm">
          <span className="text-yellow-600 dark:text-yellow-400">File changed on disk.</span>
          <button
            className="rounded px-2 py-0.5 text-xs font-medium bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={onReload}
          >
            Reload
          </button>
          <button
            className="rounded px-2 py-0.5 text-xs font-medium border border-border hover:bg-muted"
            onClick={onDismissConflict}
          >
            Keep editing
          </button>
        </div>
      )}
      <div className="flex-1">
        <CodeEditorTab
          filename={filename}
          content={editorContent}
          language={language}
          onChange={handleChange}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

function StudioApp() {
  const { fileContents, readFile, writeFile, lastChangedFile } = useStudio();
  const [activeTabId, setActiveTabId] = useState('preview');
  const [selectedWidgetPath, setSelectedWidgetPath] = useState<string[] | null>(null);
  const [canvasTabs, setCanvasTabs] = useState<CanvasTab[]>([
    {
      id: 'preview',
      label: 'Preview',
      closeable: false,
      content: null,
    },
    {
      id: 'models',
      label: 'Models',
      closeable: false,
      content: <ModelGraphTab />,
    },
  ]);

  const pendingFileRef = useRef<string | null>(null);
  const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());
  const [conflictPaths, setConflictPaths] = useState<Set<string>>(new Set());

  const createFileTab = useCallback((filePath: string): CanvasTab => {
    const filename = filePath.split('/').pop() ?? filePath;
    return {
      id: `file-${filePath}`,
      label: filename,
      closeable: true,
      content: null,
      filePath,
    };
  }, []);

  useEffect(() => {
    const pending = pendingFileRef.current;
    if (pending && pending in fileContents) {
      pendingFileRef.current = null;
      const tabId = `file-${pending}`;

      setCanvasTabs((prev) => {
        if (prev.find((t) => t.id === tabId)) return prev;
        return [...prev, createFileTab(pending)];
      });
      setActiveTabId(tabId);
    }
  }, [fileContents, createFileTab]);

  const openFile = useCallback(
    (filePath: string) => {
      const tabId = `file-${filePath}`;
      const existing = canvasTabs.find((t) => t.id === tabId);
      if (existing) {
        setActiveTabId(tabId);
        return;
      }

      if (filePath in fileContents) {
        setCanvasTabs((prev) => [...prev, createFileTab(filePath)]);
        setActiveTabId(tabId);
      } else {
        pendingFileRef.current = filePath;
        readFile(filePath);
      }
    },
    [canvasTabs, fileContents, readFile, createFileTab],
  );

  const dirtyTabsRef = useRef(dirtyTabs);
  const canvasTabsRef = useRef(canvasTabs);

  useEffect(() => {
    dirtyTabsRef.current = dirtyTabs;
  }, [dirtyTabs]);

  useEffect(() => {
    canvasTabsRef.current = canvasTabs;
  }, [canvasTabs]);

  const handleFileChanged = useCallback(
    (filePath: string) => {
      const tabId = `file-${filePath}`;
      const hasTab = canvasTabsRef.current.some((t) => t.id === tabId);
      if (!hasTab) return;

      if (dirtyTabsRef.current.has(tabId)) {
        setConflictPaths((prev) => new Set(prev).add(filePath));
      } else {
        readFile(filePath);
      }
    },
    [readFile],
  );

  useEffect(() => {
    if (!lastChangedFile.path) return;
    handleFileChanged(lastChangedFile.path);
  }, [lastChangedFile.key, lastChangedFile.path, handleFileChanged]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="relative min-h-0 flex-1">
        <Group orientation="horizontal" className="absolute inset-0">
          <Panel defaultSize="30%" minSize="20%" maxSize="40%">
            <LeftPanel
              chatContent={
                <ChatTab
                  widgetPath={selectedWidgetPath}
                  onDismissContext={() => setSelectedWidgetPath(null)}
                />
              }
              resourcesContent={<ResourcesTab onOpenFile={openFile} />}
              codeContent={<CodeTab onFileClick={openFile} />}
            />
          </Panel>
          <Separator className="w-1 bg-border transition-colors hover:bg-primary/50 cursor-col-resize" />
          <Panel defaultSize="70%">
            <div className="relative h-full">
              <Canvas
                tabs={canvasTabs.map((tab) => {
                  if (tab.id === 'preview') {
                    return {
                      ...tab,
                      content: (
                        <PreviewTab onSelectElement={(path) => setSelectedWidgetPath(path)} />
                      ),
                    };
                  }
                  if (dirtyTabs.has(tab.id)) {
                    return { ...tab, label: `● ${tab.label}` };
                  }
                  return tab;
                })}
                activeTabId={activeTabId}
                onActiveTabChange={setActiveTabId}
                onCloseTab={(id) => {
                  setCanvasTabs((prev) => prev.filter((t) => t.id !== id));
                  setDirtyTabs((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                  });
                  if (activeTabId === id) {
                    setActiveTabId('preview');
                  }
                }}
              />
              {canvasTabs
                .filter((tab) => tab.filePath)
                .map((tab) => (
                  <div
                    key={tab.id}
                    className={cn(
                      'absolute inset-x-0 top-10 bottom-0',
                      activeTabId === tab.id ? 'block' : 'hidden',
                    )}
                  >
                    <FileEditorTab
                      filePath={tab.filePath!}
                      initialContent={fileContents[tab.filePath!] ?? ''}
                      language={getLanguageFromPath(tab.filePath!)}
                      onDirtyChange={(dirty) => {
                        setDirtyTabs((prev) => {
                          const next = new Set(prev);
                          if (dirty) next.add(tab.id);
                          else next.delete(tab.id);
                          return next;
                        });
                      }}
                      onSave={(newContent) => {
                        writeFile(tab.filePath!, newContent);
                      }}
                      conflict={conflictPaths.has(tab.filePath!)}
                      onReload={() => {
                        setConflictPaths((prev) => {
                          const next = new Set(prev);
                          next.delete(tab.filePath!);
                          return next;
                        });
                        readFile(tab.filePath!);
                      }}
                      onDismissConflict={() => {
                        setConflictPaths((prev) => {
                          const next = new Set(prev);
                          next.delete(tab.filePath!);
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
            </div>
          </Panel>
        </Group>
      </div>
      <StatusBar />
    </div>
  );
}

export function App() {
  return (
    <StudioProvider>
      <StudioApp />
    </StudioProvider>
  );
}
