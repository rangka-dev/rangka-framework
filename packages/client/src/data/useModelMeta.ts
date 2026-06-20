import { useMemo } from 'react';
import type { ModelMeta } from '@rangka/shared';
import { useMeta as useMetaContext } from '../context/MetaContext.js';

export interface UseModelMetaResult {
  modelMeta: ModelMeta | undefined;
}

export function useModelMeta(model: string | undefined): UseModelMetaResult {
  const { models } = useMetaContext();

  return useMemo(() => {
    if (!model) return { modelMeta: undefined };
    const meta = models[model];
    return { modelMeta: meta };
  }, [model, models]);
}
