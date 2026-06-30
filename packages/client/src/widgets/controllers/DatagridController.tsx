import { useCallback, useMemo } from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { usePageState } from '../hooks/usePageState.js';
import { useModelQuery } from '../data/useModelQuery.js';
import { useDataQuery } from '../hooks/useDataQuery.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import { useMeta } from '../../context/MetaContext.js';
import { useMutation } from '../../data/useMutation.js';

export function DatagridController({ props, on, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();
  const Datagrid = useWidgetComponent('datagrid');
  const { models } = useMeta();

  const model = ctx.model;
  const columns = ctx.__columns ?? [];
  const pageSize = (props.pageSize as number | undefined) ?? 50;

  const { modelMeta } = useModelMeta(model);
  const mutation = useMutation(model || '');

  const linkFields = useMemo(() => {
    if (!modelMeta) return [];
    return modelMeta.fields.filter((f) => f.relationship?.type === 'link').map((f) => f.name);
  }, [modelMeta]);

  const source = useModelQuery({
    model: model || '',
    pageSize,
    enabled: Boolean(model),
    staticFilters: ctx.sourceFilters,
    include: linkFields.length > 0 ? linkFields : undefined,
  });

  const { filters: activeFilters } = useDataQuery(model || '');

  const records = source.data ?? [];

  const handleSort = useCallback(
    (field: string, direction?: 'asc' | 'desc' | null) => {
      if (!model) return;

      let newSort: string | undefined;
      if (direction === 'asc') {
        newSort = field;
      } else if (direction === 'desc') {
        newSort = `-${field}`;
      } else if (direction === null) {
        newSort = undefined;
      } else {
        const current = source.sort?.[0];
        if (current?.field === field && current.direction === 'asc') {
          newSort = `-${field}`;
        } else if (current?.field === field && current.direction === 'desc') {
          newSort = undefined;
        } else {
          newSort = field;
        }
      }

      store.set(`$sort.${model}`, newSort ?? null);
      store.set(`$page.${model}`, 1);
    },
    [model, source.sort, store],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!model) return;
      store.set(`$page.${model}`, newPage);
    },
    [model, store],
  );

  const handleSetFilter = useCallback(
    (field: string, operator: string, value: unknown) => {
      if (!model) return;
      const key =
        operator === 'eq' ? `$filter.${model}.${field}` : `$filter.${model}.${field}__${operator}`;
      store.set(key, value);
      store.set(`$page.${model}`, 1);
    },
    [model, store],
  );

  const handleRemoveFilter = useCallback(
    (field: string, operator: string) => {
      if (!model) return;
      const key =
        operator === 'eq' ? `$filter.${model}.${field}` : `$filter.${model}.${field}__${operator}`;
      store.set(key, null);
      store.set(`$page.${model}`, 1);
    },
    [model, store],
  );

  const handleCellChange = useCallback(
    async (rowId: string, field: string, value: unknown) => {
      if (!model) return;
      try {
        await mutation.update(rowId, { [field]: value });
      } catch {
        // Widget handles error display via the returned promise rejection
      }
      on.cellChange?.(rowId, field, value);
    },
    [model, mutation, on],
  );

  if (!Datagrid) return null;

  const sorted = source.sort?.[0]
    ? { field: source.sort[0].field, direction: source.sort[0].direction }
    : undefined;

  const resolvedColumns = columns.map((col: WidgetNode) => {
    const field = col.bind?.field ?? '';
    const fieldDef = modelMeta?.fields.find((f) => f.name === field);
    const fieldType = (col.props?.fieldType as string | undefined) ?? fieldDef?.type;
    const options = fieldDef?.options
      ? fieldDef.options.map((o) => ({ value: String(o), label: String(o) }))
      : undefined;

    let namingField: string | undefined;
    if (fieldType === 'link' && fieldDef?.relationship?.model) {
      const relatedMeta = models[fieldDef.relationship.model];
      namingField = relatedMeta?.naming ?? 'name';
    }

    return {
      field,
      label: (col.props?.label as string) ?? fieldDef?.label ?? field,
      width: col.props?.width as number | string | undefined,
      sortable: (col.props?.sortable as boolean | undefined) ?? true,
      filterable: (col.props?.filterable as boolean | undefined) ?? true,
      editable: (col.props?.editable as boolean | undefined) ?? true,
      fieldType,
      options,
      currency: col.props?.currency as string | undefined,
      precision: col.props?.precision as number | undefined,
      namingField,
    };
  });

  const filterFields = useMemo(() => {
    if (!model || !modelMeta) return [];
    return resolvedColumns
      .filter((col) => col.filterable)
      .map((col) => {
        const fieldDef = modelMeta.fields.find((f) => f.name === col.field);
        return {
          field: col.field,
          type: fieldDef?.type ?? 'string',
          label: col.label,
          options: fieldDef?.options ? [...fieldDef.options] : undefined,
        };
      });
  }, [model, modelMeta, resolvedColumns]);

  const datagridWidgetProps: WidgetProps = {
    props: {
      ...props,
      columns: resolvedColumns,
      loading: source.isLoading,
      fetching: source.isFetching && records.length > 0,
      page: source.page,
      pageSize: source.pageSize,
      total: source.total,
      sorted,
      filterFields,
      activeFilters: activeFilters.map((f) => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
      })),
    },
    bind: { value: records },
    on: {
      sort: (...args: unknown[]) =>
        handleSort(args[0] as string, args[1] as 'asc' | 'desc' | null | undefined),
      pageChange: (...args: unknown[]) => handlePageChange(args[0] as number),
      setFilter: (...args: unknown[]) =>
        handleSetFilter(args[0] as string, args[1] as string, args[2]),
      removeFilter: (...args: unknown[]) =>
        handleRemoveFilter(args[0] as string, args[1] as string),
      cellChange: (...args: unknown[]) =>
        handleCellChange(args[0] as string, args[1] as string, args[2]),
      rowClick: on.rowClick,
      ...on,
    },
    context: {
      record: ctx.record,
      model: ctx.model,
      mode: ctx.mode,
      index: ctx.index,
    },
    childNodes,
  };

  return <Datagrid {...datagridWidgetProps} />;
}
