import type { WidgetNode, ModelMeta, FilterFieldDeclaration } from '@rangka/shared';

function findFilterableWidgets(nodes: WidgetNode[]): { model: string; columns: WidgetNode[] }[] {
  const results: { model: string; columns: WidgetNode[] }[] = [];

  for (const node of nodes) {
    if (node.source?.model) {
      const columns = (node.children ?? []).filter(
        (child) => child.props?.filterable && child.bind?.field,
      );
      if (columns.length > 0) {
        results.push({ model: node.source.model, columns });
      }
    }
    if (node.children?.length) {
      results.push(...findFilterableWidgets(node.children));
    }
  }

  return results;
}

export function extractFilterFields(
  widgets: WidgetNode[],
  models: Record<string, ModelMeta>,
): FilterFieldDeclaration[] {
  const tables = findFilterableWidgets(widgets);
  if (tables.length === 0) return [];

  const { model, columns } = tables[0];
  const modelMeta = models[model];
  if (!modelMeta) return [];

  return columns.map((col) => {
    const field = col.bind!.field!;
    const fieldDef = modelMeta.fields.find((f) => f.name === field);
    return {
      field,
      model,
      type: fieldDef?.type ?? 'string',
      label: (col.props?.label as string) ?? fieldDef?.label ?? field,
      options: fieldDef?.options ? [...fieldDef.options] : undefined,
    };
  });
}
