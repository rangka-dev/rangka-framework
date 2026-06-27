/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { createStudioConnection, type StudioConnection, type ConnectionStatus } from '@/lib/ws';
import type {
  ServerMessage,
  SessionInfo,
  ResourceModule,
  ModelGraphData,
  FileNode,
} from '@rangka/studio-core/protocol';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown>; output: string }>;
  schemaDiff?: {
    operations: Array<{
      id: string;
      type: string;
      table: string;
      ddl: string;
      destructive: boolean;
      detail?: string;
    }>;
    resolved?: boolean;
  };
  timestamp: string;
}

export interface RuntimeStatus {
  status: 'idle' | 'booting' | 'ready' | 'error';
  models: number;
  pages: number;
  services: number;
}

export interface StudioConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
  selectedModels?: string[];
  baseUrl?: string;
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
}

interface StudioContextValue {
  messages: ChatMessage[];
  runtimeStatus: RuntimeStatus;
  connectionStatus: ConnectionStatus;
  previewReload: { key: number; path?: string };
  isAgentWorking: boolean;
  isStreaming: boolean;
  hasActiveTool: boolean;
  sessionLoaded: boolean;
  settings: StudioConfig | null;
  availableModels: AvailableModel[];
  currentSession: { id: string; name?: string } | null;
  sessions: SessionInfo[];
  resources: ResourceModule[];
  modelGraph: ModelGraphData;
  fileTree: FileNode[];
  fileContents: Record<string, string>;
  hasPendingChanges: boolean;
  send: (text: string, context?: { widgetPath?: string[]; pageKey?: string }) => void;
  stop: () => void;
  approveSchema: (operationIds: string[]) => void;
  rejectSchema: (reason?: string) => void;
  loadSettings: () => void;
  saveSettings: (config: StudioConfig) => void;
  fetchModels: () => void;
  setModel: (modelId: string) => void;
  listSessions: () => void;
  newSession: () => void;
  resumeSession: (path: string) => void;
  renameSession: (name: string) => void;
  applyChanges: () => void;
  startRuntime: () => void;
  requestFileTree: () => void;
  readFile: (path: string) => void;
  writeFile: (path: string, content: string) => void;
  fileSaveError: { path: string; message: string } | null;
  lastChangedFile: { path: string; key: number };
}

const StudioContext = createContext<StudioContextValue | null>(null);

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

export function StudioProvider({ children }: { children: ReactNode }) {
  const connRef = useRef<StudioConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previewReload, setPreviewReload] = useState<{ key: number; path?: string }>({ key: 0 });
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasActiveTool, setHasActiveTool] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [settings, setSettings] = useState<StudioConfig | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [currentSession, setCurrentSession] = useState<{ id: string; name?: string } | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [resources, setResources] = useState<ResourceModule[]>([]);
  const [modelGraph, setModelGraph] = useState<ModelGraphData>({ nodes: [], edges: [] });
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [fileSaveError, setFileSaveError] = useState<{ path: string; message: string } | null>(
    null,
  );
  const [lastChangedFile, setLastChangedFile] = useState<{ path: string; key: number }>({
    path: '',
    key: 0,
  });
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>({
    status: 'idle',
    models: 0,
    pages: 0,
    services: 0,
  });
  const pendingAgentRef = useRef<string | null>(null);
  const hadToolCallRef = useRef(false);

  useEffect(() => {
    const conn = createStudioConnection(WS_URL);
    connRef.current = conn;

    const unsubStatus = conn.onStatus((s) => {
      setConnectionStatus(s);
      if (s === 'connected') {
        conn.send({ type: 'settings.get' });
      }
    });

    const unsubMessage = conn.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case 'runtime.status':
          setRuntimeStatus({
            status: msg.status,
            models: msg.models ?? 0,
            pages: msg.pages ?? 0,
            services: msg.services ?? 0,
          });
          if (msg.status === 'ready') {
            setHasPendingChanges(false);
          }
          break;

        case 'chat.delta': {
          setIsStreaming(true);
          setHasActiveTool(false);
          if (!pendingAgentRef.current || hadToolCallRef.current) {
            hadToolCallRef.current = false;
            const id = crypto.randomUUID();
            pendingAgentRef.current = id;
            setMessages((prev) => [
              ...prev,
              { id, role: 'agent', content: msg.text, timestamp: new Date().toISOString() },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === pendingAgentRef.current ? { ...m, content: m.content + msg.text } : m,
              ),
            );
          }
          break;
        }

        case 'chat.complete':
          pendingAgentRef.current = null;
          hadToolCallRef.current = false;
          setIsAgentWorking(false);
          setIsStreaming(false);
          setHasActiveTool(false);
          break;

        case 'chat.stopped':
          pendingAgentRef.current = null;
          hadToolCallRef.current = false;
          setIsAgentWorking(false);
          setIsStreaming(false);
          setHasActiveTool(false);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'agent',
              content: 'Stopped.',
              timestamp: new Date().toISOString(),
            },
          ]);
          break;

        case 'chat.tool_use':
          setIsStreaming(false);
          setHasActiveTool(true);
          hadToolCallRef.current = true;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'agent') {
              const toolCalls = [
                ...(last.toolCalls ?? []),
                { name: msg.tool, input: msg.input, output: '' },
              ];
              return [...prev.slice(0, -1), { ...last, toolCalls }];
            }
            const id = crypto.randomUUID();
            pendingAgentRef.current = id;
            return [
              ...prev,
              {
                id,
                role: 'agent' as const,
                content: '',
                toolCalls: [{ name: msg.tool, input: msg.input, output: '' }],
                timestamp: new Date().toISOString(),
              },
            ];
          });
          break;

        case 'chat.tool_result':
          setHasActiveTool(false);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'agent' && last.toolCalls?.length) {
              const toolCalls = [...last.toolCalls];
              const lastTool = toolCalls[toolCalls.length - 1];
              toolCalls[toolCalls.length - 1] = { ...lastTool, output: JSON.stringify(msg.output) };
              return [...prev.slice(0, -1), { ...last, toolCalls }];
            }
            return prev;
          });
          break;

        case 'schema.diff':
          setMessages((prev) => {
            const nonDestructive = msg.operations.filter((op) => !op.destructive);
            if (nonDestructive.length === 0) return prev;

            const last = prev[prev.length - 1];
            if (last?.role === 'agent') {
              return [
                ...prev.slice(0, -1),
                { ...last, schemaDiff: { operations: nonDestructive } },
              ];
            }
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'agent' as const,
                content: '',
                schemaDiff: { operations: nonDestructive },
                timestamp: new Date().toISOString(),
              },
            ];
          });
          break;

        case 'runtime.error':
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'agent',
              content: `Runtime error: ${msg.message}${msg.file ? ` (${msg.file}:${msg.line})` : ''}`,
              timestamp: new Date().toISOString(),
            },
          ]);
          break;

        case 'preview.reload':
          setPreviewReload((prev) => ({
            key: prev.key + 1,
            path: (msg as { path?: string }).path,
          }));
          break;

        case 'file.changed': {
          const changedMsg = msg as unknown as { path: string; action: string };
          setHasPendingChanges(true);
          setLastChangedFile((prev) => ({ path: changedMsg.path, key: prev.key + 1 }));
          connRef.current?.send({ type: 'files.list' });
          break;
        }

        case 'files.data':
          setFileTree((msg as unknown as { tree: FileNode[] }).tree);
          break;

        case 'file.content': {
          const fileMsg = msg as unknown as { path: string; content: string };
          setFileContents((prev) => ({ ...prev, [fileMsg.path]: fileMsg.content }));
          break;
        }

        case 'file.saved': {
          const savedMsg = msg as unknown as { path: string };
          void savedMsg;
          setFileSaveError(null);
          break;
        }

        case 'file.saveError': {
          const errMsg = msg as unknown as { path: string; message: string };
          setFileSaveError({ path: errMsg.path, message: errMsg.message });
          break;
        }

        case 'settings.current':
          setSettings((msg as unknown as { config: StudioConfig | null }).config);
          break;

        case 'settings.models':
          setAvailableModels((msg as unknown as { models: AvailableModel[] }).models);
          break;

        case 'session.current':
          setCurrentSession({ id: msg.sessionId, name: msg.name });
          setSessionLoaded(true);
          break;

        case 'session.list':
          setSessions(msg.sessions);
          break;

        case 'session.switched':
          setCurrentSession({ id: msg.sessionId });
          setMessages([]);
          pendingAgentRef.current = null;
          hadToolCallRef.current = false;
          break;

        case 'session.history':
          setMessages(
            msg.messages.map((m) => ({
              id: crypto.randomUUID(),
              role: m.role,
              content: m.content,
              toolCalls: m.toolCalls?.map((tc) => ({ name: tc.name, input: tc.input, output: '' })),
              timestamp: new Date().toISOString(),
            })),
          );
          break;

        case 'resources.data':
          setResources(msg.modules);
          break;

        case 'models.data':
          setModelGraph(msg.graph);
          break;

        case 'schema.applied':
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'agent',
              content: `Schema changes applied successfully (${msg.operationIds.length} operation${msg.operationIds.length === 1 ? '' : 's'}).`,
              timestamp: new Date().toISOString(),
            },
          ]);
          break;

        case 'schema.error':
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'agent',
              content: `Schema error: ${msg.message}`,
              timestamp: new Date().toISOString(),
            },
          ]);
          break;

        case 'agent.status':
          setIsAgentWorking((msg as unknown as { busy: boolean }).busy);
          break;
      }
    });

    return () => {
      unsubStatus();
      unsubMessage();
      conn.close();
    };
  }, []);

  const send = useCallback(
    (text: string, context?: { widgetPath?: string[]; pageKey?: string }) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsAgentWorking(true);
      connRef.current?.send({ type: 'chat.send', text, context });
    },
    [],
  );

  const stop = useCallback(() => {
    connRef.current?.send({ type: 'chat.stop' });
  }, []);

  const approveSchema = useCallback((operationIds: string[]) => {
    connRef.current?.send({ type: 'schema.approve', operationIds });
    setMessages((prev) =>
      prev.map((m) =>
        m.schemaDiff && !m.schemaDiff.resolved
          ? { ...m, schemaDiff: { ...m.schemaDiff, resolved: true } }
          : m,
      ),
    );
  }, []);

  const rejectSchema = useCallback((reason?: string) => {
    connRef.current?.send({ type: 'schema.reject', reason });
    setMessages((prev) =>
      prev.map((m) =>
        m.schemaDiff && !m.schemaDiff.resolved
          ? { ...m, schemaDiff: { ...m.schemaDiff, resolved: true } }
          : m,
      ),
    );
  }, []);

  const loadSettings = useCallback(() => {
    connRef.current?.send({ type: 'settings.get' });
  }, []);

  const saveSettings = useCallback((config: StudioConfig) => {
    connRef.current?.send({ type: 'settings.save', config });
  }, []);

  const fetchModels = useCallback(() => {
    connRef.current?.send({ type: 'settings.fetch_models' });
  }, []);

  const setModel = useCallback((modelId: string) => {
    connRef.current?.send({ type: 'settings.set_model', modelId });
  }, []);

  const listSessions = useCallback(() => {
    connRef.current?.send({ type: 'session.list' });
  }, []);

  const newSession = useCallback(() => {
    connRef.current?.send({ type: 'session.new' });
  }, []);

  const resumeSession = useCallback((path: string) => {
    connRef.current?.send({ type: 'session.resume', sessionPath: path });
  }, []);

  const renameSession = useCallback((name: string) => {
    connRef.current?.send({ type: 'session.rename', name });
  }, []);

  const applyChanges = useCallback(() => {
    setHasPendingChanges(false);
    connRef.current?.send({ type: 'runtime.apply' });
  }, []);

  const startRuntime = useCallback(() => {
    connRef.current?.send({ type: 'runtime.start' });
  }, []);

  const requestFileTree = useCallback(() => {
    connRef.current?.send({ type: 'files.list' });
  }, []);

  const readFile = useCallback((filePath: string) => {
    connRef.current?.send({ type: 'file.read', path: filePath });
  }, []);

  const writeFile = useCallback((filePath: string, content: string) => {
    connRef.current?.send({ type: 'file.write', path: filePath, content });
  }, []);

  return (
    <StudioContext.Provider
      value={{
        messages,
        runtimeStatus,
        connectionStatus,
        previewReload,
        isAgentWorking,
        isStreaming,
        hasActiveTool,
        sessionLoaded,
        settings,
        availableModels,
        currentSession,
        sessions,
        resources,
        modelGraph,
        fileTree,
        fileContents,
        hasPendingChanges,
        send,
        stop,
        approveSchema,
        rejectSchema,
        loadSettings,
        saveSettings,
        fetchModels,
        setModel,
        listSessions,
        newSession,
        resumeSession,
        renameSession,
        applyChanges,
        startRuntime,
        requestFileTree,
        readFile,
        writeFile,
        fileSaveError,
        lastChangedFile,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return ctx;
}
