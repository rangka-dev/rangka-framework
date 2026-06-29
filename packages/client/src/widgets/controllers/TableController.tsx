import { useCallback, useMemo } from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { useWidgetContext, WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { usePageState } from '../hooks/usePageState.js';
import { useModelQuery } from '../data/useModelQuery.js';
import { useDataQuery } from '../hooks/useDataQuery.js';
import { useSurfaceContext } from '../hooks/useSurfaceContext.js';
import { buildRowContext } from '../context/builder.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import { useMeta } from '../../context/MetaContext.js';
import { WidgetRenderer } from '../renderer/WidgetRenderer.js';

export function TableController({ props, on, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();
  const Table = useWidgetComponent('table');
  const surface = useSurfaceContext();
  const { models } = useMeta();

  const model = ctx.model;
  const columns = ctx.__columns ?? [];
  const pageSize = (props.pageSize as number | undefined) ?? 20;
  const smartMode = Boolean(model);

  const variant = (props.variant as 'card' | 'flat' | undefined) ?? 'flat';

  const { modelMeta } = useModelMeta(model);
  const hasSearchableFields = useMemo(() => {
    if (!modelMeta) return false;
    return modelMeta.fields.some((f) => f.searchable);
  }, [modelMeta]);

  const linkFields = useMemo(() => {
    if (!modelMeta) return [];
    return modelMeta.fields.filter((f) => f.relationship?.type === 'link').map((f) => f.name);
  }, [modelMeta]);

  const source = useModelQuery({
    model: model || '',
    pageSize,
    enabled: smartMode,
    staticFilters: ctx.sourceFilters,
    include: linkFields.length > 0 ? linkFields : undefined,
  });

  const { filters: activeFilters } = useDataQuery(model || '');

  const records = smartMode ? source.data : (ctx.records ?? []);

  const filterableColumns = columns.filter(
    (col: WidgetNode) => col.props?.filterable && col.bind?.field,
  );

  const filterFields = useMemo(() => {
    if (!model || !modelMeta) return [];
    return filterableColumns.map((col: WidgetNode) => {
      const field = col.bind?.field ?? '';
      const fieldDef = modelMeta.fields.find((f) => f.name === field);
      return {
        field,
        type: fieldDef?.type ?? 'string',
        label: (col.props?.label as string) ?? fieldDef?.label ?? field,
        options: fieldDef?.options ? [...fieldDef.options] : undefined,
      };
    });
  }, [model, modelMeta, filterableColumns]);

  const handleSort = useCallback(
    (field: string) => {
      if (!model) return;
      const current = source.sort?.[0];
      let newSort: string | undefined;

      if (current?.field === field && current.direction === 'asc') {
        newSort = `-${field}`;
      } else if (current?.field === field && current.direction === 'desc') {
        newSort = undefined;
      } else {
        newSort = field;
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
      on.pageChange?.(newPage);
    },
    [model, store, on],
  );

  if (!Table) return null;

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
      label: (col.props?.label as string) ?? '',
      width: col.props?.width as string | undefined,
      align: col.props?.align as 'left' | 'center' | 'right' | undefined,
      sortable: col.props?.sortable as boolean | undefined,
      fieldType,
      options,
      namingField,
      children: col.children,
      renderCell:
        col.children && col.children.length > 0
          ? (row: Record<string, unknown>, index: number) => {
              const rowCtx = buildRowContext(row, index, ctx);
              return (
                <WidgetContextProvider value={rowCtx}>
                  {col.children!.map((child, ci) => (
                    <WidgetRenderer key={child.id ?? ci} node={child} />
                  ))}
                </WidgetContextProvider>
              );
            }
          : undefined,
    };
  });

  const tableWidgetProps: WidgetProps = {
    props: {
      ...props,
      variant,
      columns: resolvedColumns,
      loading: smartMode && source.isLoading,
      fetching: smartMode && source.isFetching && records.length > 0,
      page: source.page,
      pageSize: source.pageSize,
      total: source.total,
      sorted,
      hasSearch: smartMode && hasSearchableFields,
      hasFilters: smartMode && filterableColumns.length > 0,
      filterFields,
      activeFilters: activeFilters.map((f) => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
      })),
      surface,
    },
    bind: { value: records },
    on: {
      sort: (...args: unknown[]) => handleSort(args[0] as string),
      pageChange: (...args: unknown[]) => handlePageChange(args[0] as number),
      setFilter: (...args: unknown[]) => {
        if (!model) return;
        const field = args[0] as string;
        const operator = args[1] as string;
        const value = args[2];
        const key =
          operator === 'eq'
            ? `$filter.${model}.${field}`
            : `$filter.${model}.${field}__${operator}`;
        store.set(key, value);
        store.set(`$page.${model}`, 1);
      },
      removeFilter: (...args: unknown[]) => {
        if (!model) return;
        const field = args[0] as string;
        const operator = args[1] as string;
        const key =
          operator === 'eq'
            ? `$filter.${model}.${field}`
            : `$filter.${model}.${field}__${operator}`;
        store.set(key, null);
        store.set(`$page.${model}`, 1);
      },
      rowClick: on.rowClick,
      select: on.select,
      selectAll: on.selectAll,
    },
    context: {
      record: ctx.record,
      model: ctx.model,
      mode: ctx.mode,
      index: ctx.index,
    },
    childNodes,
  };

  return <Table {...tableWidgetProps} />;
}
