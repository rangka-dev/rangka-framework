import type { WidgetNode, WidgetDefinitionMeta } from '@rangka/shared';

export interface ValidationError {
  path: string;
  message: string;
}

export function validateWidgetTree(
  nodes: WidgetNode[],
  registry: Map<string, WidgetDefinitionMeta>,
  parentPath: string = '',
): ValidationError[] {
  const errors: ValidationError[] = [];

  nodes.forEach((node, index) => {
    const path = parentPath ? `${parentPath}[${index}]` : `[${index}]`;
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
              message: `Widget '${node.type}' does not accept child type '${child.type}'. Allowed: ${def.accepts.join(', ')}`,
            });
          }
        }
      }
    }

    if (node.props) {
      for (const [key, value] of Object.entries(node.props)) {
        const propDef = def.schema[key];
        if (!propDef) {
          errors.push({
            path: `${path}.props.${key}`,
            message: `Unknown prop '${key}' on widget '${node.type}'`,
          });
          continue;
        }
        if (typeof value === 'string' && value.includes('{{')) {
          continue;
        }
        if (!validatePropType(value, propDef.type, propDef.options)) {
          errors.push({
            path: `${path}.props.${key}`,
            message: `Invalid value for prop '${key}': expected ${propDef.type}${propDef.options ? ` (${propDef.options.join(' | ')})` : ''}`,
          });
        }
      }

      for (const [key, propDef] of Object.entries(def.schema)) {
        if (propDef.required && !(key in node.props) && propDef.default === undefined) {
          errors.push({
            path: `${path}.props`,
            message: `Missing required prop '${key}' on widget '${node.type}'`,
          });
        }
      }
    } else {
      for (const [key, propDef] of Object.entries(def.schema)) {
        if (propDef.required && propDef.default === undefined) {
          errors.push({
            path: `${path}.props`,
            message: `Missing required prop '${key}' on widget '${node.type}'`,
          });
        }
      }
    }

    if (node.on) {
      for (const trigger of Object.keys(node.on)) {
        if (!def.triggers.includes(trigger)) {
          errors.push({
            path: `${path}.on.${trigger}`,
            message: `Unknown trigger '${trigger}' on widget '${node.type}'. Available: ${def.triggers.join(', ') || 'none'}`,
          });
        }
      }
    }

    if (node.bind) {
      const bindMode = getBindMode(node.bind);
      if (bindMode !== def.binding && def.binding !== 'none') {
        if (bindMode !== def.binding) {
          errors.push({
            path: `${path}.bind`,
            message: `Widget '${node.type}' expects binding mode '${def.binding}' but got '${bindMode}'`,
          });
        }
      } else if (def.binding === 'none' && bindMode !== 'none') {
        errors.push({
          path: `${path}.bind`,
          message: `Widget '${node.type}' does not support data binding`,
        });
      }
    }

    if (node.children) {
      errors.push(...validateWidgetTree(node.children, registry, `${path}.children`));
    }
  });

  return errors;
}

function getBindMode(bind: { field?: string; expression?: string }): string {
  if (bind.field) return 'field';
  if (bind.expression) return 'expression';
  return 'none';
}

function validatePropType(value: unknown, type: string, options?: string[]): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
      return typeof value === 'string' && (options ? options.includes(value) : true);
    case 'object':
      return typeof value === 'object' && value !== null;
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}
