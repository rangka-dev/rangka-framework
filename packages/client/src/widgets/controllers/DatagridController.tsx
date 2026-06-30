import { useCallback, useMemo } from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { usePageState } from '../hooks/usePageState.js';
import { useModelQuery } from '../data/useModelQuery.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import { useMeta } from '../../context/MetaContext.js';

export function DatagridController({ props, on, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();
  const Datagrid = useWidgetComponent('datagrid');
  const { models } = useMeta();

  const model = ctx.model;
  const columns = ctx.__columns ?? [];
  const pageSize = (props.pageSize as number | undefined) ?? 50;

  const { modelMeta } = useModelMeta(model);

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

  const records = source.data ?? [];

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
    },
    [model, store],
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
      sortable: col.props?.sortable as boolean | undefined,
      editable: col.props?.editable as boolean | undefined,
      fieldType,
      options,
      currency: col.props?.currency as string | undefined,
      precision: col.props?.precision as number | undefined,
      namingField,
    };
  });

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
    },
    bind: { value: records },
    on: {
      sort: (...args: unknown[]) => handleSort(args[0] as string),
      pageChange: (...args: unknown[]) => handlePageChange(args[0] as number),
      cellChange: on.cellChange,
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
