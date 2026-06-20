import type { WidgetNode, Condition } from '@rangka/shared';
import { parse } from '../expression/parser.js';
import type { AstNode } from '../expression/types.js';

export interface DependencyMap {
  fields: Map<string, Set<string>>;
  state: Map<string, Set<string>>;
}

export function buildDependencyMap(nodes: WidgetNode[], parentPath: string = ''): DependencyMap {
  const fields = new Map<string, Set<string>>();
  const state = new Map<string, Set<string>>();

  function addDep(map: Map<string, Set<string>>, key: string, widgetId: string): void {
    let set = map.get(key);
    if (!set) {
      set = new Set();
      map.set(key, set);
    }
    set.add(widgetId);
  }

  function walkNodes(nodes: WidgetNode[], path: string): void {
    nodes.forEach((node, index) => {
      const widgetId = node.id ?? `${path}[${index}]`;

      if (node.bind?.field) {
        addDep(fields, node.bind.field, widgetId);
      }

      if (node.bind?.expression) {
        const deps = extractDepsFromExpression(node.bind.expression);
        for (const dep of deps.fields) addDep(fields, dep, widgetId);
        for (const dep of deps.state) addDep(state, dep, widgetId);
      }

      if (node.visible) {
        const conditions = Array.isArray(node.visible) ? node.visible : [node.visible];
        for (const condition of conditions) {
          const deps = extractDepsFromCondition(condition);
          for (const dep of deps.fields) addDep(fields, dep, widgetId);
          for (const dep of deps.state) addDep(state, dep, widgetId);
        }
      }

      if (node.props) {
        for (const value of Object.values(node.props)) {
          if (typeof value === 'string' && value.includes('{{')) {
            const deps = extractDepsFromExpression(value);
            for (const dep of deps.fields) addDep(fields, dep, widgetId);
            for (const dep of deps.state) addDep(state, dep, widgetId);
          }
        }
      }

      if (node.children) {
        walkNodes(node.children, `${widgetId}.children`);
      }
    });
  }

  walkNodes(nodes, parentPath);
  return { fields, state };
}

export function getAffectedWidgets(
  depMap: DependencyMap,
  key: string,
  isState: boolean,
): Set<string> {
  const map = isState ? depMap.state : depMap.fields;
  return map.get(key) ?? new Set();
}

interface ExtractedDeps {
  fields: string[];
  state: string[];
}

function extractDepsFromExpression(expr: string): ExtractedDeps {
  const fields: string[] = [];
  const state: string[] = [];

  try {
    const ast = parse(expr);
    walkAst(ast, fields, state);
  } catch {
    // skip unparseable expressions
  }

  return { fields, state };
}

function extractDepsFromCondition(condition: Condition): ExtractedDeps {
  const fields: string[] = [];
  const state: string[] = [];

  const field = condition.field;
  if (field.startsWith('$state.')) {
    state.push(field.slice(7));
  } else if (!field.startsWith('$')) {
    fields.push(field.split('.')[0]);
  }

  if (typeof condition.value === 'string' && condition.value.includes('{{')) {
    const deps = extractDepsFromExpression(condition.value);
    fields.push(...deps.fields);
    state.push(...deps.state);
  }

  return { fields, state };
}

function walkAst(node: AstNode, fields: string[], state: string[]): void {
  switch (node.type) {
    case 'field': {
      if (node.path[0] === '$state' && node.path.length > 1) {
        state.push(node.path[1]);
      } else if (!node.path[0].startsWith('$')) {
        fields.push(node.path[0]);
      }
      break;
    }
    case 'binary':
      walkAst(node.left, fields, state);
      walkAst(node.right, fields, state);
      break;
    case 'unary':
      walkAst(node.operand, fields, state);
      break;
    case 'call':
      for (const arg of node.args) {
        walkAst(arg, fields, state);
      }
      break;
    case 'literal':
      break;
  }
}
