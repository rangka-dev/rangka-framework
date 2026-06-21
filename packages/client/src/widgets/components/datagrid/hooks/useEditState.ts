import { useReducer, useCallback } from 'react';

export interface CellAddress {
  rowIndex: number;
  colIndex: number;
}

export interface EditState {
  activeCell: CellAddress | null;
  editingCell: CellAddress | null;
  pendingEdits: Map<string, unknown>;
}

type EditAction =
  | { type: 'ACTIVATE'; cell: CellAddress }
  | { type: 'DEACTIVATE' }
  | { type: 'START_EDIT' }
  | { type: 'START_EDIT_AT'; cell: CellAddress }
  | { type: 'COMMIT_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_PENDING'; key: string; value: unknown }
  | { type: 'CLEAR_PENDING'; key: string };

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'ACTIVATE':
      if (state.editingCell) return state;
      return { ...state, activeCell: action.cell };
    case 'DEACTIVATE':
      return { ...state, activeCell: null, editingCell: null };
    case 'START_EDIT':
      if (!state.activeCell) return state;
      return { ...state, editingCell: state.activeCell };
    case 'START_EDIT_AT':
      return { ...state, activeCell: action.cell, editingCell: action.cell };
    case 'COMMIT_EDIT':
      return { ...state, editingCell: null };
    case 'CANCEL_EDIT':
      return { ...state, editingCell: null };
    case 'SET_PENDING': {
      const nextPending = new Map(state.pendingEdits);
      nextPending.set(action.key, action.value);
      return { ...state, pendingEdits: nextPending };
    }
    case 'CLEAR_PENDING': {
      const cleared = new Map(state.pendingEdits);
      cleared.delete(action.key);
      return { ...state, pendingEdits: cleared };
    }
    default:
      return state;
  }
}

const initialState: EditState = {
  activeCell: null,
  editingCell: null,
  pendingEdits: new Map(),
};

export function useEditState() {
  const [state, dispatch] = useReducer(editReducer, initialState);

  const activate = useCallback((cell: CellAddress) => {
    dispatch({ type: 'ACTIVATE', cell });
  }, []);

  const deactivate = useCallback(() => {
    dispatch({ type: 'DEACTIVATE' });
  }, []);

  const startEdit = useCallback(() => {
    dispatch({ type: 'START_EDIT' });
  }, []);

  const startEditAt = useCallback((cell: CellAddress) => {
    dispatch({ type: 'START_EDIT_AT', cell });
  }, []);

  const commitEdit = useCallback(() => {
    dispatch({ type: 'COMMIT_EDIT' });
  }, []);

  const cancelEdit = useCallback(() => {
    dispatch({ type: 'CANCEL_EDIT' });
  }, []);

  const setPending = useCallback((key: string, value: unknown) => {
    dispatch({ type: 'SET_PENDING', key, value });
  }, []);

  const clearPending = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_PENDING', key });
  }, []);

  return {
    state,
    activate,
    deactivate,
    startEdit,
    startEditAt,
    commitEdit,
    cancelEdit,
    setPending,
    clearPending,
  };
}
