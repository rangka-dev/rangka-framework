import { WebSocketServer, WebSocket } from 'ws';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import type { ServerMessage, ClientMessage, FileNode } from './protocol.js';
import { SubprocessManager } from './subprocess-manager.js';
import { FileWatcher } from './file-watcher.js';
import { AgentEngine } from './agent-engine.js';
import { loadConfig, saveConfig } from './config.js';

export interface StudioServerConfig {
  wsPort: number;
  projectRoot: string;
  frameworkPort?: number;
}

export class StudioServer {
  private wss: WebSocketServer | null = null;
  private httpServer: http.Server | null = null;
  private uiApp: ReturnType<typeof Fastify> | null = null;
  private subprocess: SubprocessManager;
  private fileWatcher: FileWatcher | null = null;
  private agentEngine: AgentEngine | null = null;
  private config: StudioServerConfig;
  private runtimeStatus: 'idle' | 'booting' | 'ready' | 'error' = 'idle';
  private activeClient: WebSocket | null = null;
  private isAgentBusy = false;

  constructor(config: StudioServerConfig) {
    this.config = config;
    this.subprocess = new SubprocessManager({
      projectRoot: config.projectRoot,
      frameworkPort: config.frameworkPort,
    });
    this.wireSubprocessEvents();
  }

  private wireSubprocessEvents(): void {
    this.subprocess.on('phase', (phase: string) => {
      console.log(`[studio] Child phase: ${phase}`);
    });

    this.subprocess.on('ready', (status, sessionToken) => {
      this.runtimeStatus = 'ready';
      console.log(
        `[studio] Framework ready on http://localhost:${this.config.frameworkPort ?? 3000}`,
      );
      this.broadcast({
        type: 'runtime.status',
        status: 'ready',
        models: status.models,
        pages: status.pages,
        services: status.services,
        sessionToken: sessionToken ?? undefined,
      });
    });

    this.subprocess.on('sync_pending', (operations) => {
      console.log(`[studio] Schema sync pending: ${operations.length} operation(s)`);
      this.broadcast({
        type: 'schema.diff',
        operations: operations.map((op: import('./ipc-protocol.js').SerializedDdlOperation) => ({
          id: op.id,
          type: op.type,
          table: op.table,
          ddl: op.ddl,
          destructive: op.destructive,
          detail: op.detail,
        })),
      });
    });

    this.subprocess.on('error', (message: string) => {
      this.runtimeStatus = 'error';
      console.error(`[studio] Framework error: ${message}`);
      this.broadcast({ type: 'runtime.error', message });
    });

    this.subprocess.on('exit', (code: number | null, signal: string | null) => {
      if (this.runtimeStatus === 'ready') {
        this.runtimeStatus = 'error';
        this.broadcast({
          type: 'runtime.error',
          message: `Framework process crashed (code=${code}, signal=${signal})`,
        });
      }
    });
  }

  async start(): Promise<void> {
    const studioDir = this.resolveStudioLocalDir();
    this.uiApp = Fastify({
      serverFactory: (handler) => {
        this.httpServer = http.createServer(handler);
        return this.httpServer;
      },
    });

    await this.uiApp.register(fastifyStatic, {
      root: studioDir,
      wildcard: false,
      prefix: '/',
    });

    this.uiApp.setNotFoundHandler((_req: unknown, reply: { sendFile: (f: string) => void }) => {
      return reply.sendFile('index.html');
    });

    this.wss = new WebSocketServer({ server: this.httpServer!, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    await this.uiApp.listen({ port: this.config.wsPort, host: '0.0.0.0' });
    console.log(`[studio] Studio UI + WebSocket on http://localhost:${this.config.wsPort}`);

    this.startFileWatcher();
    await this.initializeAgent();
  }

  private async initializeAgent(): Promise<void> {
    const config = loadConfig();

    try {
      this.agentEngine = new AgentEngine({
        projectRoot: this.config.projectRoot,
        subprocess: this.subprocess,
        apiKey: config?.apiKey,
        provider: config?.provider,
        baseUrl: config?.baseUrl,
        model: config?.model,
        onMessage: (msg) => {
          if (this.activeClient) {
            this.send(this.activeClient, msg);
          } else {
            this.broadcast(msg);
          }
        },
      });
      await this.agentEngine.initialize();
      console.log(`[studio] Agent engine ready`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Agent engine failed to initialize: ${message}`);
      console.error(`[studio] Chat will use stub responses. Configure API key in Settings.`);
      this.agentEngine = null;
    }
  }

  private startFileWatcher(): void {
    this.fileWatcher = new FileWatcher({
      projectRoot: this.config.projectRoot,
      onChange: (msg) => {
        this.broadcast(msg);
      },
      onError: (error) => {
        this.broadcast({ type: 'runtime.error', message: `File watcher error: ${error}` });
      },
      onReady: () => {
        console.log(`[studio] Watching for file changes in modules/`);
      },
    });
    this.fileWatcher.start();
  }

  private async handleStart(): Promise<void> {
    if (this.runtimeStatus === 'booting' || this.subprocess.getPhase() !== 'stopped') {
      return;
    }

    try {
      this.runtimeStatus = 'booting';
      this.broadcast({ type: 'runtime.status', status: 'booting' });
      await this.subprocess.start();
    } catch (err) {
      this.runtimeStatus = 'error';
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Framework boot failed: ${message}`);
      this.broadcast({ type: 'runtime.error', message });
    }
  }

  private async handleApply(ws: WebSocket): Promise<void> {
    try {
      this.broadcast({ type: 'runtime.status', status: 'booting' });
      await this.subprocess.restart();

      if (this.subprocess.isWaitingForSync()) {
        return;
      }

      const status = this.subprocess.getLastStatus();
      if (status) {
        this.broadcast({
          type: 'runtime.status',
          status: 'ready',
          models: status.models,
          pages: status.pages,
          services: status.services,
          sessionToken: this.subprocess.getSessionToken() ?? undefined,
        });
      }

      if (this.subprocess.isRunning()) {
        this.send(ws, { type: 'preview.reload' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.broadcast({ type: 'runtime.error', message });
    }
  }

  private handleConnection(ws: WebSocket): void {
    this.activeClient = ws;
    const status = this.subprocess.getLastStatus();
    this.send(ws, {
      type: 'runtime.status',
      status: this.runtimeStatus,
      models: status?.models ?? 0,
      pages: status?.pages ?? 0,
      services: status?.services ?? 0,
      sessionToken: this.subprocess.getSessionToken() ?? undefined,
    });

    if (this.runtimeStatus === 'ready') {
      this.handleFilesList(ws);
    }

    const pendingOps = this.subprocess.getPendingOps();
    if (pendingOps.length > 0) {
      this.send(ws, {
        type: 'schema.diff',
        operations: pendingOps.map((op) => ({
          id: op.id,
          type: op.type,
          table: op.table,
          ddl: op.ddl,
          destructive: op.destructive,
          detail: op.detail,
        })),
      });
    }

    this.sendSessionCurrent(ws);
    this.send(ws, { type: 'agent.status', busy: this.isAgentBusy });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;
        this.handleMessage(ws, msg);
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (this.activeClient === ws) {
        this.activeClient = null;
      }
    });
  }

  private handleMessage(ws: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
      case 'chat.send':
        this.activeClient = ws;
        this.handleChatSend(ws, msg.text, msg.context);
        break;
      case 'chat.stop':
        this.handleChatStop(ws);
        break;
      case 'chat.select_element':
        this.activeClient = ws;
        this.handleChatSend(
          ws,
          `The user selected an element in the preview: widget path is [${msg.widgetPath.join(' → ')}] on page "${msg.pageKey}". Ask what they want to change about this element.`,
          { widgetPath: msg.widgetPath, pageKey: msg.pageKey },
        );
        break;
      case 'schema.approve':
        this.handleSchemaApprove(ws, msg.operationIds);
        break;
      case 'schema.reject':
        this.subprocess.rejectSync(msg.reason ?? 'User rejected schema changes');
        if (this.agentEngine) {
          this.agentEngine.resolveSchemaGate(false, msg.reason ?? 'User rejected schema changes');
        }
        console.log(`[studio] Schema rejected: ${msg.reason ?? 'no reason'}`);
        break;
      case 'settings.get':
        this.send(ws, { type: 'settings.current', config: loadConfig() });
        break;
      case 'settings.save':
        saveConfig(msg.config);
        this.send(ws, { type: 'settings.current', config: msg.config });
        console.log(`[studio] Settings saved for provider: ${msg.config.provider}`);
        this.reinitializeAgent();
        break;
      case 'settings.fetch_models':
        this.handleFetchModels(ws);
        break;
      case 'settings.set_model': {
        const currentConfig = loadConfig();
        if (currentConfig) {
          currentConfig.model = msg.modelId;
          saveConfig(currentConfig);
          this.send(ws, { type: 'settings.current', config: currentConfig });
          this.reinitializeAgent();
          console.log(`[studio] Model changed to: ${msg.modelId}`);
        }
        break;
      }
      case 'session.list':
        this.handleSessionList(ws);
        break;
      case 'session.new':
        this.handleSessionNew(ws);
        break;
      case 'session.resume':
        this.handleSessionResume(ws, msg.sessionPath);
        break;
      case 'session.rename':
        this.handleSessionRename(ws, msg.name);
        break;
      case 'resources.list':
        this.handleResourcesList(ws);
        break;
      case 'runtime.apply':
        this.handleApply(ws);
        break;
      case 'runtime.start':
        this.handleStart();
        break;
      case 'files.list':
        this.handleFilesList(ws);
        break;
      case 'file.read':
        this.handleFileRead(ws, msg.path);
        break;
    }
  }

  private async handleResourcesList(ws: WebSocket): Promise<void> {
    try {
      const result = await this.subprocess.introspect('modules');
      this.send(ws, {
        type: 'resources.data',
        modules: result.data as import('./protocol.js').ResourceModule[],
      });
    } catch {
      this.send(ws, { type: 'resources.data', modules: [] });
    }
  }

  private async handleFetchModels(ws: WebSocket): Promise<void> {
    try {
      const config = loadConfig();
      if (!config?.apiKey) {
        this.send(ws, { type: 'settings.models', models: [] });
        return;
      }

      const baseUrl = (config.baseUrl ?? 'https://api.anthropic.com').replace(/\/+$/, '');
      const modelsUrl = baseUrl.endsWith('/v1')
        ? `${baseUrl}/models?limit=100`
        : `${baseUrl}/v1/models?limit=100`;
      const response = await fetch(modelsUrl, {
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!response.ok) {
        console.error(`[studio] Models API returned ${response.status}`);
        this.send(ws, { type: 'settings.models', models: [] });
        return;
      }

      const body = (await response.json()) as {
        data: Array<{ id: string; display_name?: string }>;
      };

      const models = body.data.map((m) => ({
        id: m.id,
        name: m.display_name || m.id,
        provider: config.provider,
      }));

      this.send(ws, { type: 'settings.models', models });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Failed to fetch models: ${message}`);
      this.send(ws, { type: 'settings.models', models: [] });
    }
  }

  private async handleSchemaApprove(ws: WebSocket, operationIds: string[]): Promise<void> {
    console.log(`[studio] Schema approved: ${operationIds.join(', ')}`);
    const result = await this.subprocess.approveSync(operationIds);
    if (result.error) {
      this.send(ws, { type: 'schema.error', message: result.error, operationIds });
      if (this.agentEngine) {
        this.agentEngine.resolveSchemaGate(false, `Schema apply failed: ${result.error}`);
      }
    } else {
      this.send(ws, { type: 'schema.applied', operationIds });
      if (this.agentEngine) {
        this.agentEngine.resolveSchemaGate(true, `${operationIds.length} operation(s) applied`);
      }
    }
  }

  private async reinitializeAgent(): Promise<void> {
    if (this.agentEngine) {
      await this.agentEngine.dispose();
      this.agentEngine = null;
    }
    await this.initializeAgent();
  }

  private async handleChatStop(ws: WebSocket): Promise<void> {
    if (this.agentEngine) {
      await this.agentEngine.abort();
      this.isAgentBusy = false;
      this.send(ws, { type: 'chat.stopped' });
      this.broadcast({ type: 'agent.status', busy: false });
    }
  }

  private handleChatSend(
    ws: WebSocket,
    text: string,
    _context?: { widgetPath?: string[]; pageKey?: string },
  ): void {
    if (this.agentEngine) {
      this.isAgentBusy = true;
      this.broadcast({ type: 'agent.status', busy: true });
      this.agentEngine
        .prompt(text)
        .then(() => {
          this.isAgentBusy = false;
          this.broadcast({ type: 'agent.status', busy: false });
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[studio:chat] Agent error: ${message}`);
          this.isAgentBusy = false;
          this.broadcast({ type: 'agent.status', busy: false });
          this.send(ws, { type: 'chat.delta', text: `Error: ${message}` });
          this.send(ws, { type: 'chat.complete', messageId: crypto.randomUUID() });
        });
    } else {
      const responseText = `Agent not available. Please set ANTHROPIC_API_KEY environment variable and restart Studio.`;
      this.send(ws, { type: 'chat.delta', text: responseText });
      this.send(ws, { type: 'chat.complete', messageId: crypto.randomUUID() });
    }
  }

  private sendSessionCurrent(ws: WebSocket): void {
    if (this.agentEngine) {
      const sessionId = this.agentEngine.getSessionId();
      if (sessionId) {
        this.send(ws, {
          type: 'session.current',
          sessionId,
          name: this.agentEngine.getSessionName(),
          messageCount: this.agentEngine.getMessageCount(),
        });
        const history = this.agentEngine.getHistory();
        if (history.length > 0) {
          this.send(ws, { type: 'session.history', messages: history });
        }
      }
    }
  }

  private async handleSessionList(ws: WebSocket): Promise<void> {
    if (!this.agentEngine) {
      this.send(ws, { type: 'session.list', sessions: [] });
      return;
    }
    try {
      const sessions = await this.agentEngine.listSessions();
      this.send(ws, { type: 'session.list', sessions });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Failed to list sessions: ${message}`);
      this.send(ws, { type: 'session.list', sessions: [] });
    }
  }

  private async handleSessionNew(ws: WebSocket): Promise<void> {
    if (!this.agentEngine) return;
    try {
      await this.agentEngine.createNewSession();
      const sessionId = this.agentEngine.getSessionId();
      if (sessionId) {
        this.send(ws, { type: 'session.switched', sessionId });
      }
      console.log(`[studio] New session created: ${sessionId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Failed to create new session: ${message}`);
    }
  }

  private async handleSessionResume(ws: WebSocket, sessionPath: string): Promise<void> {
    if (!this.agentEngine) return;
    try {
      await this.agentEngine.resumeSession(sessionPath);
      const sessionId = this.agentEngine.getSessionId();
      if (sessionId) {
        this.send(ws, { type: 'session.switched', sessionId });
        const history = this.agentEngine.getHistory();
        if (history.length > 0) {
          this.send(ws, { type: 'session.history', messages: history });
        }
      }
      console.log(`[studio] Resumed session: ${sessionId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Failed to resume session: ${message}`);
    }
  }

  private async handleSessionRename(ws: WebSocket, name: string): Promise<void> {
    if (!this.agentEngine) return;
    try {
      await this.agentEngine.renameSession(name);
      this.sendSessionCurrent(ws);
      console.log(`[studio] Session renamed to: ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[studio] Failed to rename session: ${message}`);
    }
  }

  private static readonly TEXT_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.yaml',
    '.yml',
    '.md',
    '.css',
    '.html',
  ]);

  private handleFilesList(ws: WebSocket): void {
    const modulesDir = path.join(this.config.projectRoot, 'modules');
    if (!fs.existsSync(modulesDir)) {
      this.send(ws, { type: 'files.data', tree: [] });
      return;
    }
    const tree = this.buildFileTree(modulesDir, 'modules');
    this.send(ws, { type: 'files.data', tree });
  }

  private buildFileTree(dirPath: string, relativePath: string): FileNode[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const entryRelative = `${relativePath}/${entry.name}`;
      if (entry.isDirectory()) {
        const children = this.buildFileTree(path.join(dirPath, entry.name), entryRelative);
        nodes.push({ name: entry.name, type: 'folder', path: entryRelative, children });
      } else {
        nodes.push({ name: entry.name, type: 'file', path: entryRelative });
      }
    }

    return nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
  }

  private handleFileRead(ws: WebSocket, filePath: string): void {
    if (!filePath.startsWith('modules/')) {
      this.send(ws, { type: 'file.error', path: filePath, message: 'Access denied' });
      return;
    }

    const resolved = path.resolve(this.config.projectRoot, filePath);
    if (!resolved.startsWith(path.resolve(this.config.projectRoot) + path.sep)) {
      this.send(ws, { type: 'file.error', path: filePath, message: 'Access denied' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!StudioServer.TEXT_EXTENSIONS.has(ext)) {
      this.send(ws, { type: 'file.error', path: filePath, message: 'Unsupported file type' });
      return;
    }

    try {
      const content = fs.readFileSync(resolved, 'utf-8');
      this.send(ws, { type: 'file.content', path: filePath, content });
    } catch {
      this.send(ws, { type: 'file.error', path: filePath, message: 'File not found' });
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private broadcast(msg: ServerMessage): void {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      this.send(client as WebSocket, msg);
    }
  }

  async shutdown(): Promise<void> {
    if (this.agentEngine) {
      await this.agentEngine.dispose();
    }
    if (this.fileWatcher) {
      await this.fileWatcher.stop();
    }
    if (this.uiApp) {
      await this.uiApp.close();
    }
    if (this.wss) {
      for (const client of this.wss.clients) {
        client.close();
      }
      this.wss.close();
    }
    await this.subprocess.shutdown();
    console.log(`[studio] Shut down.`);
  }

  private resolveStudioLocalDir(): string {
    // Published: ui/ is bundled into the package via prepack
    const bundledDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../ui');
    if (fs.existsSync(path.join(bundledDir, 'index.html'))) {
      return fs.realpathSync(bundledDir);
    }

    // Monorepo: resolve relative to this package
    const monorepoCandidate = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../../studio-local/dist',
    );
    if (fs.existsSync(path.join(monorepoCandidate, 'index.html'))) {
      return fs.realpathSync(monorepoCandidate);
    }

    throw new Error('Missing studio-local build. Run `pnpm --filter studio-local build` first.');
  }
}

export async function createStudioServer(config: StudioServerConfig): Promise<StudioServer> {
  const server = new StudioServer(config);
  await server.start();
  return server;
}
