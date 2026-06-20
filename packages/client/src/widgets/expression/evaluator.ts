import type { AstNode } from './types.js';
import { functions } from './functions.js';

export type EvalContext = Record<string, unknown>;

export function evaluate(ast: AstNode, context: EvalContext): unknown {
  switch (ast.type) {
    case 'literal':
      return ast.value;

    case 'field':
      return resolveField(ast.path, context);

    case 'unary':
      return evalUnary(ast.operator, evaluate(ast.operand, context));

    case 'binary':
      return evalBinary(ast.operator, ast.left, ast.right, context);

    case 'call':
      return evalCall(ast.name, ast.args, context);
  }
}

function resolveField(path: string[], context: EvalContext): unknown {
  let current: unknown = context;
  for (const segment of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function evalUnary(operator: '!' | '-', value: unknown): unknown {
  switch (operator) {
    case '!':
      return !value;
    case '-':
      return -(value as number);
  }
}

function evalBinary(
  operator: string,
  leftNode: AstNode,
  rightNode: AstNode,
  context: EvalContext,
): unknown {
  if (operator === '&&') {
    const left = evaluate(leftNode, context);
    return left ? evaluate(rightNode, context) : left;
  }
  if (operator === '||') {
    const left = evaluate(leftNode, context);
    return left ? left : evaluate(rightNode, context);
  }

  const left = evaluate(leftNode, context);
  const right = evaluate(rightNode, context);

  switch (operator) {
    case '+':
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left ?? '') + String(right ?? '');
      }
      return (left as number) + (right as number);
    case '-':
      return (left as number) - (right as number);
    case '*':
      return (left as number) * (right as number);
    case '/':
      if ((right as number) === 0) return 0;
      return (left as number) / (right as number);
    case '%':
      return (left as number) % (right as number);
    case '==':
      return left == right;
    case '!=':
      return left != right;
    case '>':
      return (left as number) > (right as number);
    case '<':
      return (left as number) < (right as number);
    case '>=':
      return (left as number) >= (right as number);
    case '<=':
      return (left as number) <= (right as number);
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

function evalCall(name: string, args: AstNode[], context: EvalContext): unknown {
  const fn = functions[name];
  if (!fn) {
    throw new Error(`Unknown function: ${name}`);
  }
  const evaluatedArgs = args.map((arg) => evaluate(arg, context));
  return fn(evaluatedArgs, context);
}
