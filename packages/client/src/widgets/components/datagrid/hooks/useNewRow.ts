import { useState, useCallback, useMemo, useRef } from 'react';

interface UseNewRowOptions {
  requiredFields: string[];
  onPersist: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

interface NewRowState {
  id: string;
  data: Record<string, unknown>;
  focusField?: string;
}

export function useNewRow({ requiredFields, onPersist }: UseNewRowOptions) {
  const [newRow, setNewRow] = useState<NewRowState | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const persistingRef = useRef(false);

  const startNewRow = useCallback((firstEditableField?: string) => {
    const id = `__new_${Date.now()}`;
    setNewRow({ id, data: {}, focusField: firstEditableField });
  }, []);

  const updateNewRowField = useCallback((field: string, value: unknown) => {
    setNewRow((prev) => {
      if (!prev) return prev;
      return { ...prev, data: { ...prev.data, [field]: value } };
    });
  }, []);

  const discardNewRow = useCallback(() => {
    setNewRow(null);
  }, []);

  const canPersist = useMemo(() => {
    if (!newRow) return false;
    if (isPersisting) return false;
    if (requiredFields.length === 0) return Object.keys(newRow.data).length > 0;
    return requiredFields.every((f) => {
      const val = newRow.data[f];
      return val !== null && val !== undefined && val !== '';
    });
  }, [newRow, requiredFields, isPersisting]);

  const persistNewRow = useCallback(async () => {
    if (!newRow || persistingRef.current) return null;
    persistingRef.current = true;
    setIsPersisting(true);
    try {
      const result = await onPersist(newRow.data);
      setNewRow(null);
      return result;
    } finally {
      persistingRef.current = false;
      setIsPersisting(false);
    }
  }, [newRow, onPersist]);

  return {
    newRow,
    isPersisting,
    canPersist,
    startNewRow,
    updateNewRowField,
    discardNewRow,
    persistNewRow,
  };
}
