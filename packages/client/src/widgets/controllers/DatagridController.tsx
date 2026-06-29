import { useCallback } from 'react';
import type { WidgetProps } from '../types.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { usePageState } from '../hooks/usePageState.js';
import { useModelQuery } from '../data/useModelQuery.js';

export function DatagridController({ props, on, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();
  const Datagrid = useWidgetComponent('datagrid');

  const model = ctx.model;
  const pageSize = props.pageSize as number | undefined;

  const source = useModelQuery({
    model: model || '',
    pageSize: pageSize ?? 50,
    enabled: Boolean(model),
    staticFilters: ctx.sourceFilters,
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

  const datagridWidgetProps: WidgetProps = {
    props: {
      ...props,
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
