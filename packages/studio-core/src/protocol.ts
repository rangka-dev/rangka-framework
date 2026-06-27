export type DdlOperation = {
  id: string;
  type:
    | 'create_table'
    | 'add_column'
    | 'alter_column_type'
    | 'drop_column'
    | 'drop_table'
    | 'create_index'
    | 'add_foreign_key'
    | 'add_check_constraint'
    | 'drop_foreign_key'
    | 'drop_index';
  table: string;
  ddl: string;
  destructive: boolean;
  detail?: string;
};

export interface SessionInfo {
  path: string;
  name?: string;
  created: string;
  modified: string;
  messageCount: number;
  firstMessage?: string;
}

export type ServerMessage =
  | { type: 'agent.status'; busy: boolean }
  | { type: 'chat.delta'; text: string }
  | { type: 'chat.complete'; messageId: string }
  | { type: 'chat.stopped' }
  | { type: 'chat.tool_use'; tool: string; input: Record<string, unknown> }
  | { type: 'chat.tool_result'; tool: string; output: Record<string, unknown> }
  | { type: 'file.changed'; path: string; action: 'create' | 'update' | 'delete' }
  | { type: 'preview.reload'; path?: string }
  | { type: 'schema.diff'; operations: DdlOperation[] }
  | { type: 'runtime.error'; message: string; file?: string; line?: number }
  | {
      type: 'runtime.status';
      status: 'idle' | 'booting' | 'ready' | 'error';
      models?: number;
      pages?: number;
      services?: number;
      sessionToken?: string;
    }
  | { type: 'settings.current'; config: StudioConfig | null }
  | { type: 'settings.models'; models: AvailableModel[] }
  | { type: 'session.list'; sessions: SessionInfo[] }
  | { type: 'session.current'; sessionId: string; name?: string; messageCount: number }
  | { type: 'session.switched'; sessionId: string }
  | {
      type: 'session.history';
      messages: Array<{
        role: 'user' | 'agent';
        content: string;
        toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
      }>;
    }
  | { type: 'resources.data'; modules: ResourceModule[] }
  | { type: 'models.data'; graph: ModelGraphData }
  | { type: 'schema.applied'; operationIds: string[] }
  | { type: 'schema.error'; message: string; operationIds: string[] }
  | { type: 'files.data'; tree: FileNode[] }
  | { type: 'file.content'; path: string; content: string }
  | { type: 'file.error'; path: string; message: string }
  | { type: 'file.saved'; path: string }
  | { type: 'file.saveError'; path: string; message: string };

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
}

export type ClientMessage =
  | {
      type: 'chat.send';
      text: string;
      context?: { widgetPath?: string[]; pageKey?: string };
    }
  | { type: 'chat.stop' }
  | { type: 'chat.select_element'; widgetPath: string[]; pageKey: string }
  | { type: 'schema.approve'; operationIds: string[] }
  | { type: 'schema.reject'; reason?: string }
  | { type: 'settings.get' }
  | { type: 'settings.save'; config: StudioConfig }
  | { type: 'settings.fetch_models' }
  | { type: 'settings.set_model'; modelId: string }
  | { type: 'session.list' }
  | { type: 'session.new' }
  | { type: 'session.resume'; sessionPath: string }
  | { type: 'session.rename'; name: string }
  | { type: 'resources.list' }
  | { type: 'runtime.apply' }
  | { type: 'runtime.start' }
  | { type: 'files.list' }
  | { type: 'file.read'; path: string }
  | { type: 'file.write'; path: string; content: string };

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path?: string;
  children?: FileNode[];
}

export interface ResourceItem {
  name: string;
  type: 'model' | 'page' | 'service' | 'hook';
}

export interface ResourceModule {
  name: string;
  label?: string;
  source: 'core' | 'local' | 'external';
  resources: ResourceItem[];
}

export interface ModelGraphField {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface ModelGraphNode {
  id: string;
  label: string;
  module: string;
  fields: ModelGraphField[];
}

export interface ModelGraphEdge {
  id: string;
  source: string;
  sourceField: string;
  target: string;
  targetField: string;
  type: 'link' | 'hasMany' | 'children' | 'manyToMany';
}

export interface ModelGraphData {
  nodes: ModelGraphNode[];
  edges: ModelGraphEdge[];
}

export interface StudioConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
  selectedModels?: string[];
  baseUrl?: string;
}
