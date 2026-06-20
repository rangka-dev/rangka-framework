import type { WidgetNode } from '@rangka/shared';
import type { WidgetRegistry } from './widget-registry.js';

export interface SlotValidationError {
  path: string;
  message: string;
}

export function validatePageBody(
  body: WidgetNode[],
  widgetRegistry: WidgetRegistry,
): SlotValidationError[] {
  return validateWidgetNodes(body, widgetRegistry, 'body');
}

function validateWidgetNodes(
  nodes: WidgetNode[],
  registry: WidgetRegistry,
  basePath: string,
): SlotValidationError[] {
  const errors: SlotValidationError[] = [];

  nodes.forEach((node, index) => {
    const path = `${basePath}[${index}]`;
    const def = registry.get(node.type);

    if (!def) {
      errors.push({ path, message: `Unknown widget type: '${node.type}'` });
      return;
    }

    if (node.children && node.children.length > 0) {
      if (!def.container) {
        errors.push({ path, message: `Widget '${node.type}' is not a container but has children` });
      } else if (def.accepts) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (!def.accepts.includes(child.type)) {
            errors.push({
              path: `${path}.children[${i}]`,
              message: `Widget '${node.type}' does not accept child type '${child.type}'`,
            });
          }
        }
      }
    }

    if (node.on) {
      for (const trigger of Object.keys(node.on)) {
        if (!def.triggers.includes(trigger)) {
          errors.push({
            path: `${path}.on.${trigger}`,
            message: `Unknown trigger '${trigger}' on widget '${node.type}'`,
          });
        }
      }
    }

    if (node.bind) {
      const bindMode = getBindMode(node.bind);
      if (def.binding === 'none' && bindMode !== 'none') {
        errors.push({
          path: `${path}.bind`,
          message: `Widget '${node.type}' does not support data binding`,
        });
      } else if (def.binding === 'model' && bindMode !== 'model' && bindMode !== 'expression') {
        errors.push({
          path: `${path}.bind`,
          message: `Widget '${node.type}' expects binding mode '${def.binding}' but got '${bindMode}'`,
        });
      }
    }

    if (node.children) {
      errors.push(...validateWidgetNodes(node.children, registry, `${path}.children`));
    }
  });

  return errors;
}

function getBindMode(bind: { field?: string; expression?: string; model?: unknown }): string {
  if (bind.field) return 'field';
  if (bind.expression) return 'expression';
  if (bind.model) return 'model';
  return 'none';
}
