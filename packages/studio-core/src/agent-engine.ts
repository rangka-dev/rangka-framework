import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
  SettingsManager,
  getAgentDir,
} from '@earendil-works/pi-coding-agent';
import type { AgentSession } from '@earendil-works/pi-coding-agent';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { createStudioTools } from './tools.js';
import type { SubprocessManager } from './subprocess-manager.js';
import type { ServerMessage, SessionInfo } from './protocol.js';
import { getValidAccessToken } from './oauth/flow.js';

export interface AgentEngineConfig {
  projectRoot: string;
  subprocess: SubprocessManager;
  apiKey?: string;
  authMethod?: 'api-key' | 'oauth';
  provider?: string;
  providerType?: 'anthropic' | 'openai-compatible';
  baseUrl?: string;
  model?: string;
  onMessage: (msg: ServerMessage) => void;
}

export class AgentEngine {
  private session: AgentSession | null = null;
  private config: AgentEngineConfig;
  private unsubscribe: (() => void) | null = null;
  private sessionDir: string;
  private schemaGate: {
    resolve: (result: { approved: boolean; message: string }) => void;
  } | null = null;

  constructor(config: AgentEngineConfig) {
    this.config = config;
    this.sessionDir = join(config.projectRoot, '.rangka', 'studio', 'conversations');
    mkdirSync(this.sessionDir, { recursive: true });
  }

  async initialize(): Promise<void> {
    const sessionManager = SessionManager.continueRecent(this.config.projectRoot, this.sessionDir);
    await this.initializeWithSessionManager(sessionManager);
  }

  async createNewSession(): Promise<void> {
    await this.dispose();
    const sessionManager = SessionManager.create(this.config.projectRoot, this.sessionDir);
    await this.initializeWithSessionManager(sessionManager);
  }

  async resumeSession(path: string): Promise<void> {
    await this.dispose();
    const sessionManager = SessionManager.open(path, this.sessionDir);
    await this.initializeWithSessionManager(sessionManager);
  }

  getSessionId(): string | null {
    if (!this.session) return null;
    return this.session.sessionManager.getSessionId();
  }

  getSessionName(): string | undefined {
    if (!this.session) return undefined;
    return this.session.sessionManager.getSessionName();
  }

  getMessageCount(): number {
    if (!this.session) return 0;
    return this.session.messages.length;
  }

  getHistory(): Array<{
    role: 'user' | 'agent';
    content: string;
    toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
  }> {
    if (!this.session) return [];
    const history: Array<{
      role: 'user' | 'agent';
      content: string;
      toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
    }> = [];
    for (const msg of this.session.messages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = msg as any;
      if (m.role === 'user') {
        const text =
          typeof m.content === 'string'
            ? m.content
            : Array.isArray(m.content)
              ? m.content
                  .filter((c: { type: string }) => c.type === 'text')
                  .map((c: { text: string }) => c.text)
                  .join('')
              : '';
        if (text) history.push({ role: 'user', content: text });
      } else if (m.role === 'assistant') {
        const text = Array.isArray(m.content)
          ? m.content
              .filter((c: { type: string }) => c.type === 'text')
              .map((c: { text: string }) => c.text)
              .join('')
          : '';
        const toolCalls = Array.isArray(m.content)
          ? m.content
              .filter((c: { type: string }) => c.type === 'toolCall')
              .map((c: { name: string; arguments?: Record<string, unknown> }) => ({
                name: c.name,
                input: c.arguments ?? {},
              }))
          : [];
        if (text || toolCalls.length > 0) {
          history.push({
            role: 'agent',
            content: text,
            ...(toolCalls.length > 0 ? { toolCalls } : {}),
          });
        }
      }
    }
    return history;
  }

  async listSessions(): Promise<SessionInfo[]> {
    const sessions = await SessionManager.list(this.config.projectRoot, this.sessionDir);
    return sessions.map((s) => ({
      path: s.path,
      name: s.name,
      created: s.created.toISOString(),
      modified: s.modified.toISOString(),
      messageCount: s.messageCount,
      firstMessage: s.firstMessage || undefined,
    }));
  }

  async renameSession(name: string): Promise<void> {
    if (!this.session) return;
    this.session.sessionManager.appendSessionInfo(name);
  }

  private async initializeWithSessionManager(sessionManager: SessionManager): Promise<void> {
    const authStorage = AuthStorage.create();
    const modelRegistry = ModelRegistry.create(authStorage);

    const provider = this.config.provider ?? 'anthropic';
    if (this.config.authMethod === 'oauth') {
      const accessToken = await getValidAccessToken(provider);
      if (accessToken) {
        authStorage.setRuntimeApiKey(provider, accessToken);
      } else {
        throw new Error(`OAuth token not available for ${provider}. Please reconnect in Settings.`);
      }
    } else if (this.config.apiKey) {
      authStorage.setRuntimeApiKey(provider, this.config.apiKey);
    }

    if (this.config.baseUrl) {
      const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
      modelRegistry.registerProvider(provider, { baseUrl });
      console.log(`[studio:agent] Registered provider "${provider}" with baseUrl: ${baseUrl}`);
    }

    const subprocess = this.config.subprocess;
    const studioTools = createStudioTools(subprocess, this.config.projectRoot);

    const reloadTool = studioTools.find((t) => t.name === 'reload_preview')!;
    const originalReloadExecute = reloadTool.execute;
    reloadTool.execute = async (...args: unknown[]) => {
      const result = await originalReloadExecute(...args);
      const path = result.details?.path as string | undefined;
      this.config.onMessage({ type: 'preview.reload', path });
      return result;
    };

    const syncTool = studioTools.find((t) => t.name === 'sync_schema')!;
    syncTool.execute = async () => {
      console.log(`[studio:sync] Starting subprocess restart for sync...`);

      // If not already waiting for sync, restart to pick up changes
      if (!subprocess.isWaitingForSync()) {
        try {
          await subprocess.restart();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Schema sync failed: ${message}` }],
            details: { status: 'error', error: message },
          };
        }
      }

      const status = subprocess.getLastStatus();
      if (status) {
        this.config.onMessage({
          type: 'runtime.status',
          status: 'ready',
          models: status.models,
          pages: status.pages,
          services: status.services,
        });
      }
      this.config.onMessage({ type: 'preview.reload' });

      const safeOps = subprocess.getPendingOps();

      if (safeOps.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: 'Schema is already up to date. No changes needed.' },
          ],
          details: { status: 'up_to_date', operations: 0 },
        };
      }

      this.config.onMessage({ type: 'schema.diff', operations: safeOps });
      const approval = await this.waitForSchemaApproval();
      if (approval.approved) {
        const summary = safeOps
          .map((op) => `- ${op.type}: ${op.table}${op.detail ? ` (${op.detail})` : ''}`)
          .join('\n');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Schema changes approved and applied:\n${summary}`,
            },
          ],
          details: {
            status: 'applied',
            operations: safeOps.map((op) => ({
              type: op.type,
              table: op.table,
              detail: op.detail,
            })),
          },
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Schema changes rejected by user. The database was not modified. Inform the user.`,
            },
          ],
          details: { status: 'rejected', operations: safeOps.length },
        };
      }
    };

    const applyTool = studioTools.find((t) => t.name === 'apply_changes')!;
    const originalApplyExecute = applyTool.execute;
    applyTool.execute = async (...args: unknown[]) => {
      const result = await originalApplyExecute(...args);
      if (result.details?.success) {
        const status = subprocess.getLastStatus();
        if (status) {
          this.config.onMessage({
            type: 'runtime.status',
            status: 'ready',
            models: status.models,
            pages: status.pages,
            services: status.services,
            sessionToken: subprocess.getSessionToken() ?? undefined,
          });
        }
        this.config.onMessage({ type: 'preview.reload' });

        const ops = subprocess.getPendingOps();
        if (ops.length > 0) {
          this.config.onMessage({ type: 'schema.diff', operations: ops });
        }
      }
      return result;
    };

    const agentDir = getAgentDir();

    const loader = new DefaultResourceLoader({
      cwd: this.config.projectRoot,
      agentDir,
      systemPromptOverride: () => SYSTEM_PROMPT,
    });
    await loader.reload();

    const toolNames = [
      'read',
      'write',
      'edit',
      'grep',
      'find',
      'ls',
      ...studioTools.map((t) => t.name),
    ];

    const apiType =
      this.config.providerType === 'anthropic' ? 'anthropic-messages' : 'openai-completions';

    const selectedModel = this.config.model
      ? (modelRegistry.find(this.config.provider ?? 'anthropic', this.config.model) ??
        ({
          id: this.config.model,
          name: this.config.model,
          provider: this.config.provider ?? 'anthropic',
          api: apiType,
          baseUrl: this.config.baseUrl?.replace(/\/+$/, ''),
          contextWindow: 200000,
          maxTokens: 16384,
          reasoning: false,
          input: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          headers: {},
          compat: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any))
      : undefined;

    const _authCheck = (await modelRegistry.getApiKeyAndHeaders(selectedModel)) as {
      ok: boolean;
      apiKey?: string;
      error?: string;
    };

    const { session } = await createAgentSession({
      cwd: this.config.projectRoot,
      agentDir,
      model: selectedModel,
      tools: toolNames,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customTools: studioTools as any[],
      resourceLoader: loader,
      sessionManager,
      settingsManager: SettingsManager.inMemory({
        compaction: { enabled: true },
        retry: { enabled: true, maxRetries: 3 },
      }),
      authStorage,
      modelRegistry,
    });

    this.session = session;
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    if (!this.session) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.unsubscribe = this.session.subscribe((event: any) => {
      switch (event.type) {
        case 'message_update':
          if (event.assistantMessageEvent?.type === 'text_delta') {
            this.config.onMessage({
              type: 'chat.delta',
              text: event.assistantMessageEvent.delta,
            });
          }
          break;

        case 'tool_execution_start':
          console.log(`[studio:tool] → ${event.toolName}`, event.args ?? {});
          this.config.onMessage({
            type: 'chat.tool_use',
            tool: event.toolName,
            input: event.args ?? {},
          });
          break;

        case 'tool_execution_end':
          console.log(`[studio:tool] ← ${event.toolName}`, event.isError ? '(error)' : '(ok)');
          this.config.onMessage({
            type: 'chat.tool_result',
            tool: event.toolName,
            output: { result: event.result ?? '', isError: event.isError ?? false },
          });
          break;

        case 'agent_end':
          this.config.onMessage({
            type: 'chat.complete',
            messageId: crypto.randomUUID(),
          });
          break;
      }
    });
  }

  async prompt(text: string): Promise<void> {
    if (!this.session) {
      throw new Error('Agent engine not initialized');
    }
    await this.session.prompt(text);
  }

  async abort(): Promise<void> {
    if (this.schemaGate) {
      this.schemaGate.resolve({ approved: false, message: 'Aborted by user' });
      this.schemaGate = null;
    }
    if (this.session) {
      await this.session.abort();
      await this.session.sendCustomMessage(
        {
          customType: 'interruption_note',
          content: 'The user stopped the previous response.',
          display: false,
        },
        { deliverAs: 'nextTurn' },
      );
    }
  }

  async dispose(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.session) {
      this.session.dispose();
      this.session = null;
    }
  }

  resolveSchemaGate(approved: boolean, message: string): void {
    if (this.schemaGate) {
      this.schemaGate.resolve({ approved, message });
      this.schemaGate = null;
    }
  }

  private waitForSchemaApproval(): Promise<{ approved: boolean; message: string }> {
    return new Promise((resolve) => {
      this.schemaGate = { resolve };
    });
  }
}
