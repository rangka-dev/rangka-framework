export type AstNode = LiteralNode | FieldRefNode | UnaryNode | BinaryNode | CallNode;

export interface LiteralNode {
  type: 'literal';
  value: string | number | boolean | null;
}

export interface FieldRefNode {
  type: 'field';
  path: string[];
}

export interface UnaryNode {
  type: 'unary';
  operator: '!' | '-';
  operand: AstNode;
}

export interface BinaryNode {
  type: 'binary';
  operator: BinaryOperator;
  left: AstNode;
  right: AstNode;
}

export interface CallNode {
  type: 'call';
  name: string;
  args: AstNode[];
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | '&&'
  | '||';
