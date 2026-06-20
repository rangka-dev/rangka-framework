import type { ServerMessage, ClientMessage } from '@rangka/studio-core/protocol';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export type StudioConnectionListener = (msg: ServerMessage) => void;
export type StatusListener = (status: ConnectionStatus) => void;

export interface StudioConnection {
  send: (msg: ClientMessage) => void;
  onMessage: (listener: StudioConnectionListener) => () => void;
  onStatus: (listener: StatusListener) => () => void;
  close: () => void;
  getStatus: () => ConnectionStatus;
}

export function createStudioConnection(url: string): StudioConnection {
  let ws: WebSocket | null = null;
  let status: ConnectionStatus = 'connecting';
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const maxReconnectDelay = 10000;
  let closed = false;

  const messageListeners = new Set<StudioConnectionListener>();
  const statusListeners = new Set<StatusListener>();

  function setStatus(next: ConnectionStatus) {
    status = next;
    for (const listener of statusListeners) {
      listener(next);
    }
  }

  function connect() {
    if (closed) return;
    setStatus('connecting');

    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts = 0;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        console.debug('[studio:ws] ←', msg.type, msg);
        for (const listener of messageListeners) {
          listener(msg);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (closed) return;
      setStatus('disconnected');
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function scheduleReconnect() {
    if (closed) return;
    const delay = Math.min(1000 * 2 ** reconnectAttempts, maxReconnectDelay);
    reconnectAttempts++;
    reconnectTimer = setTimeout(connect, delay);
  }

  connect();

  return {
    send(msg: ClientMessage) {
      if (ws?.readyState === WebSocket.OPEN) {
        console.debug('[studio:ws] →', msg.type, msg);
        ws.send(JSON.stringify(msg));
      }
    },
    onMessage(listener: StudioConnectionListener) {
      messageListeners.add(listener);
      return () => messageListeners.delete(listener);
    },
    onStatus(listener: StatusListener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    close() {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
    getStatus() {
      return status;
    },
  };
}
