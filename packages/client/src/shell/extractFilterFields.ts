import type { WidgetNode, ModelMeta } from '@rangka/shared';

export interface FilterFieldDeclaration {
  field: string;
  type: string;
  label: string;
  model: string;
  options?: string[];
}

function findTableNodes(nodes: WidgetNode[]): { model: string; columns: WidgetNode[] }[] {
  const results: { model: string; columns: WidgetNode[] }[] = [];

  for (const node of nodes) {
    if (node.type === 'table' || node.type === 'data-table') {
      const model = node.source?.model ?? '';
      const columns = (node.children ?? []).filter(
        (child) => child.type === 'column' && child.props?.filterable && child.bind?.field,
      );
      if (model && columns.length > 0) {
        results.push({ model, columns });
      }
    }
    if (node.children?.length) {
      results.push(...findTableNodes(node.children));
    }
  }

  return results;
}

export function extractFilterFields(
  widgets: WidgetNode[],
  models: Record<string, ModelMeta>,
): FilterFieldDeclaration[] {
  const tables = findTableNodes(widgets);
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
