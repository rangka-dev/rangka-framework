import { useReducer, useCallback, useMemo, useRef } from 'react';

export const COLUMN_MIN_WIDTH = 60;
const DEFAULT_WIDTH = 150;

export interface ColumnDef {
  field: string;
  label: string;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  fieldType?: string;
  options?: Array<{ value: string; label: string }>;
  currency?: string;
  precision?: number;
}

export interface ColumnState {
  widths: Record<string, number>;
  order: string[];
  pinned: { [field: string]: 'left' | 'right' | false };
}

type ColumnAction =
  | { type: 'RESIZE'; field: string; width: number }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'PIN'; field: string; side: 'left' | 'right' }
  | { type: 'UNPIN'; field: string }
  | { type: 'INIT'; columns: ColumnDef[] };

function columnReducer(state: ColumnState, action: ColumnAction): ColumnState {
  switch (action.type) {
    case 'RESIZE': {
      const width = Math.max(COLUMN_MIN_WIDTH, action.width);
      return { ...state, widths: { ...state.widths, [action.field]: width } };
    }
    case 'REORDER': {
      const order = [...state.order];
      const [moved] = order.splice(action.fromIndex, 1);
      order.splice(action.toIndex, 0, moved);
      return { ...state, order };
    }
    case 'PIN': {
      return { ...state, pinned: { ...state.pinned, [action.field]: action.side } };
    }
    case 'UNPIN': {
      return { ...state, pinned: { ...state.pinned, [action.field]: false } };
    }
    case 'INIT': {
      const widths: Record<string, number> = {};
      const order: string[] = [];
      for (const col of action.columns) {
        const w = col.width;
        if (typeof w === 'number') widths[col.field] = w;
        else if (typeof w === 'string') widths[col.field] = parseInt(w, 10) || DEFAULT_WIDTH;
        else widths[col.field] = DEFAULT_WIDTH;
        order.push(col.field);
      }
      return { widths, order, pinned: {} };
    }
    default:
      return state;
  }
}

function buildTemplate(columns: ColumnDef[], widths: Record<string, number>): string {
  return columns.map((col) => `${widths[col.field] ?? DEFAULT_WIDTH}px`).join(' ');
}

export interface UseColumnStateResult {
  state: ColumnState;
  pinnedLeftColumns: ColumnDef[];
  centerColumns: ColumnDef[];
  pinnedRightColumns: ColumnDef[];
  pinnedLeftTemplate: string;
  centerTemplate: string;
  pinnedRightTemplate: string;
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  hasPinning: boolean;
  orderedColumns: ColumnDef[];
  resize: (field: string, width: number) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  pin: (field: string, side: 'left' | 'right') => void;
  unpin: (field: string) => void;
  getWidth: (field: string) => number;
}

export function useColumnState(columns: ColumnDef[]): UseColumnStateResult {
  const [state, dispatch] = useReducer(columnReducer, columns, (cols): ColumnState => {
    const widths: Record<string, number> = {};
    const order: string[] = [];
    const pinned: { [field: string]: 'left' | 'right' | false } = {};
    for (const col of cols) {
      const w = col.width;
      if (typeof w === 'number') widths[col.field] = w;
      else if (typeof w === 'string') widths[col.field] = parseInt(w, 10) || DEFAULT_WIDTH;
      else widths[col.field] = DEFAULT_WIDTH;
      order.push(col.field);
    }
    return { widths, order, pinned };
  });

  const columnMap = useMemo(() => new Map(columns.map((col) => [col.field, col])), [columns]);

  const orderedColumns = useMemo(() => {
    return state.order
      .map((field) => columnMap.get(field))
      .filter((col): col is ColumnDef => col != null);
  }, [state.order, columnMap]);

  const pinnedLeftColumns = useMemo(
    () => orderedColumns.filter((col) => state.pinned[col.field] === 'left'),
    [orderedColumns, state.pinned],
  );

  const centerColumns = useMemo(
    () =>
      orderedColumns.filter((col) => {
        const pin = state.pinned[col.field];
        return pin === undefined || pin === false;
      }),
    [orderedColumns, state.pinned],
  );

  const pinnedRightColumns = useMemo(
    () => orderedColumns.filter((col) => state.pinned[col.field] === 'right'),
    [orderedColumns, state.pinned],
  );

  const pinnedLeftTemplate = useMemo(
    () => buildTemplate(pinnedLeftColumns, state.widths),
    [pinnedLeftColumns, state.widths],
  );

  const centerTemplate = useMemo(
    () => buildTemplate(centerColumns, state.widths),
    [centerColumns, state.widths],
  );

  const pinnedRightTemplate = useMemo(
    () => buildTemplate(pinnedRightColumns, state.widths),
    [pinnedRightColumns, state.widths],
  );

  const pinnedLeftWidth = useMemo(
    () =>
      pinnedLeftColumns.reduce((sum, col) => sum + (state.widths[col.field] ?? DEFAULT_WIDTH), 0),
    [pinnedLeftColumns, state.widths],
  );

  const pinnedRightWidth = useMemo(
    () =>
      pinnedRightColumns.reduce((sum, col) => sum + (state.widths[col.field] ?? DEFAULT_WIDTH), 0),
    [pinnedRightColumns, state.widths],
  );

  const hasPinning = pinnedLeftColumns.length > 0 || pinnedRightColumns.length > 0;

  const resize = useCallback((field: string, width: number) => {
    dispatch({ type: 'RESIZE', field, width });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER', fromIndex, toIndex });
  }, []);

  const pin = useCallback((field: string, side: 'left' | 'right') => {
    dispatch({ type: 'PIN', field, side });
  }, []);

  const unpin = useCallback((field: string) => {
    dispatch({ type: 'UNPIN', field });
  }, []);

  const widthsRef = useRef(state.widths);
  widthsRef.current = state.widths;

  const getWidth = useCallback((field: string) => widthsRef.current[field] ?? DEFAULT_WIDTH, []);

  return {
    state,
    pinnedLeftColumns,
    centerColumns,
    pinnedRightColumns,
    pinnedLeftTemplate,
    centerTemplate,
    pinnedRightTemplate,
    pinnedLeftWidth,
    pinnedRightWidth,
    hasPinning,
    orderedColumns,
    resize,
    reorder,
    pin,
    unpin,
    getWidth,
  };
}
