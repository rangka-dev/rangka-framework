import { useState, useRef, useCallback, useEffect } from 'react';
import { MousePointer2, RotateCw, ChevronLeft, ChevronRight, Globe, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudio } from '@/hooks/useStudio';

interface PreviewTabProps {
  onSelectElement?: (widgetPath: string[]) => void;
}

const FRAMEWORK_ORIGIN = `http://localhost:3000`;
const PREVIEW_ROUTE_KEY = 'rangka-studio:preview-route';

export function PreviewTab({ onSelectElement }: PreviewTabProps) {
  const [pointerActive, setPointerActive] = useState(false);
  const [started, setStarted] = useState(false);
  const [route, setRoute] = useState(() => localStorage.getItem(PREVIEW_ROUTE_KEY) || '/');
  const [history, setHistory] = useState<string[]>(() => [
    localStorage.getItem(PREVIEW_ROUTE_KEY) || '/',
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { runtimeStatus, connectionStatus, previewReload } = useStudio();

  const isReady = connectionStatus === 'connected' && runtimeStatus.status === 'ready';
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const initUrl = useCallback((path: string) => {
    return `${FRAMEWORK_ORIGIN}/__studio/init?redirect=${encodeURIComponent(path)}`;
  }, []);

  const loadRoute = useCallback(
    (path: string) => {
      setRoute(path);
      if (iframeRef.current) {
        iframeRef.current.src = initUrl(path);
      }
    },
    [initUrl],
  );

  const pushHistory = useCallback(
    (path: string) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), path]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const navigateTo = useCallback(
    (path: string) => {
      pushHistory(path);
      loadRoute(path);
      localStorage.setItem(PREVIEW_ROUTE_KEY, path);
    },
    [pushHistory, loadRoute],
  );

  const reload = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = initUrl(route);
    }
  }, [route, initUrl]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    loadRoute(history[newIndex]);
  }, [canGoBack, historyIndex, history, loadRoute]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    loadRoute(history[newIndex]);
  }, [canGoForward, historyIndex, history, loadRoute]);

  const startPreview = useCallback(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (isReady && previewReload.key > 0) {
      if (!started) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startPreview();
      }
      if (previewReload.path) {
        navigateTo(previewReload.path);
      } else {
        reload();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewReload.key]);

  useEffect(() => {
    if (started && isReady && iframeRef.current && !iframeRef.current.src) {
      iframeRef.current.src = initUrl(route);
    }
  }, [started, isReady, route, initUrl]);

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      iframe.contentWindow?.postMessage(msg, '*');
    } catch {
      // iframe may be navigating
    }
  }, []);

  useEffect(() => {
    sendToIframe(
      pointerActive
        ? { type: 'rangka-studio:inspect-start' }
        : { type: 'rangka-studio:inspect-stop' },
    );
  }, [pointerActive, sendToIframe]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg?.type?.startsWith('rangka-client:')) return;

      switch (msg.type) {
        case 'rangka-client:ready':
        case 'rangka-client:ping':
          sendToIframe({ type: 'rangka-studio:pong', inspecting: pointerActive });
          break;
        case 'rangka-client:select':
          onSelectElement?.(msg.widgetPath);
          setPointerActive(false);
          break;
        case 'rangka-client:navigate':
          setRoute(msg.path);
          localStorage.setItem(PREVIEW_ROUTE_KEY, msg.path);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pointerActive, onSelectElement, sendToIframe]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center border-b border-border px-2 gap-1.5">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={goBack}
            disabled={!started || !canGoBack}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={goForward}
            disabled={!started || !canGoForward}
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={reload}
            disabled={!started}
          >
            <RotateCw className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
          <Globe className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">localhost:3000</span>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!started) setStarted(true);
                navigateTo(route);
                e.currentTarget.blur();
              }
            }}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            spellCheck={false}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn('size-7', pointerActive && 'bg-primary/10 text-primary')}
          onClick={() => setPointerActive(!pointerActive)}
          disabled={!started}
        >
          <MousePointer2 className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 relative">
        {!started ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20">
            <Button size="sm" className="gap-2" onClick={startPreview} disabled={!isReady}>
              <Play className="size-3.5" />
              Start Preview
            </Button>
            <span className="text-xs text-muted-foreground">
              {!isReady
                ? connectionStatus !== 'connected'
                  ? 'Connecting to studio...'
                  : 'Framework is booting...'
                : 'Preview the app in an embedded browser'}
            </span>
          </div>
        ) : !isReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <span className="text-muted-foreground text-sm">
              {connectionStatus !== 'connected'
                ? 'Connecting to studio...'
                : 'Framework is booting...'}
            </span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className={cn(
              'absolute inset-0 h-full w-full border-0',
              pointerActive && 'ring-2 ring-primary/30 ring-inset',
            )}
            title="App Preview"
          />
        )}
      </div>
    </div>
  );
}
