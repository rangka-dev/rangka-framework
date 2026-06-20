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

interface CanvasTab {
  id: string;
  label: string;
  closeable: boolean;
  content: ReactNode;
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

function StudioApp() {
  const { fileContents, readFile } = useStudio();
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

  useEffect(() => {
    const pending = pendingFileRef.current;
    if (pending && pending in fileContents) {
      pendingFileRef.current = null;
      const content = fileContents[pending];
      const filename = pending.split('/').pop() ?? pending;
      const tabId = `file-${pending}`;

      setCanvasTabs((prev) => {
        if (prev.find((t) => t.id === tabId)) return prev;
        return [
          ...prev,
          {
            id: tabId,
            label: filename,
            closeable: true,
            content: (
              <CodeEditorTab
                filename={filename}
                content={content}
                language={getLanguageFromPath(pending)}
              />
            ),
          },
        ];
      });
      setActiveTabId(tabId);
    }
  }, [fileContents]);

  const openFile = useCallback(
    (filePath: string) => {
      const tabId = `file-${filePath}`;
      const existing = canvasTabs.find((t) => t.id === tabId);
      if (existing) {
        setActiveTabId(tabId);
        return;
      }

      if (filePath in fileContents) {
        const content = fileContents[filePath];
        const filename = filePath.split('/').pop() ?? filePath;
        const newTab: CanvasTab = {
          id: tabId,
          label: filename,
          closeable: true,
          content: (
            <CodeEditorTab
              filename={filename}
              content={content}
              language={getLanguageFromPath(filePath)}
            />
          ),
        };
        setCanvasTabs((prev) => [...prev, newTab]);
        setActiveTabId(tabId);
      } else {
        pendingFileRef.current = filePath;
        readFile(filePath);
      }
    },
    [canvasTabs, fileContents, readFile],
  );

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
            <Canvas
              tabs={canvasTabs.map((tab) =>
                tab.id === 'preview'
                  ? {
                      ...tab,
                      content: (
                        <PreviewTab onSelectElement={(path) => setSelectedWidgetPath(path)} />
                      ),
                    }
                  : tab,
              )}
              activeTabId={activeTabId}
              onActiveTabChange={setActiveTabId}
              onCloseTab={(id) => {
                setCanvasTabs((prev) => prev.filter((t) => t.id !== id));
                if (activeTabId === id) {
                  setActiveTabId('preview');
                }
              }}
            />
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
