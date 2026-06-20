export type StudioToClientMessage =
  | { type: 'rangka-studio:inspect-start' }
  | { type: 'rangka-studio:inspect-stop' }
  | { type: 'rangka-studio:pong'; inspecting: boolean };

export type ClientToStudioMessage =
  | { type: 'rangka-client:ready' }
  | { type: 'rangka-client:ping' }
  | { type: 'rangka-client:hover'; widgetPath: string[]; rect: WidgetRect; pageKey?: string }
  | { type: 'rangka-client:hover-out' }
  | {
      type: 'rangka-client:select';
      widgetPath: string[];
      meta: WidgetInspectMeta;
      pageKey?: string;
    }
  | { type: 'rangka-client:navigate'; path: string };

export interface WidgetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface WidgetInspectMeta {
  type: string;
  id?: string;
  model?: string;
  field?: string;
  mode?: string;
}
