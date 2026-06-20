import type { AstNode, BinaryOperator } from './types.js';

const BINARY_OPS: Record<string, { prec: number; op: BinaryOperator }> = {
  '||': { prec: 1, op: '||' },
  '&&': { prec: 2, op: '&&' },
  '==': { prec: 3, op: '==' },
  '!=': { prec: 3, op: '!=' },
  '>': { prec: 4, op: '>' },
  '<': { prec: 4, op: '<' },
  '>=': { prec: 4, op: '>=' },
  '<=': { prec: 4, op: '<=' },
  '+': { prec: 5, op: '+' },
  '-': { prec: 5, op: '-' },
  '*': { prec: 6, op: '*' },
  '/': { prec: 6, op: '/' },
  '%': { prec: 6, op: '%' },
};

export function parse(input: string): AstNode {
  const trimmed = input.trim();
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    input = trimmed.slice(2, -2).trim();
  }
  const parser = new Parser(input);
  const ast = parser.parseExpression(0);
  parser.skipWhitespace();
  if (parser.pos < parser.input.length) {
    throw new Error(
      `Unexpected character: '${parser.input[parser.pos]}' at position ${parser.pos}`,
    );
  }
  return ast;
}

class Parser {
  input: string;
  pos: number;

  constructor(input: string) {
    this.input = input;
    this.pos = 0;
  }

  parseExpression(minPrec: number): AstNode {
    let left = this.parseUnary();

    while (true) {
      this.skipWhitespace();
      const op = this.peekOperator();
      if (!op) break;
      const info = BINARY_OPS[op];
      if (!info || info.prec < minPrec) break;
      this.pos += op.length;
      this.skipWhitespace();
      const right = this.parseExpression(info.prec + 1);
      left = { type: 'binary', operator: info.op, left, right };
    }

    return left;
  }

  parseUnary(): AstNode {
    this.skipWhitespace();
    const ch = this.input[this.pos];

    if (ch === '!') {
      this.pos++;
      const operand = this.parseUnary();
      return { type: 'unary', operator: '!', operand };
    }

    if (ch === '-' && !this.isAfterValue()) {
      this.pos++;
      const operand = this.parseUnary();
      return { type: 'unary', operator: '-', operand };
    }

    return this.parsePrimary();
  }

  parsePrimary(): AstNode {
    this.skipWhitespace();
    const ch = this.input[this.pos];

    if (ch === '(') {
      this.pos++;
      const expr = this.parseExpression(0);
      this.skipWhitespace();
      this.expect(')');
      return expr;
    }

    if (ch === '"' || ch === "'") {
      return this.parseString();
    }

    if (this.isDigit(ch)) {
      return this.parseNumber();
    }

    if (this.isIdentStart(ch)) {
      return this.parseIdentifierOrCall();
    }

    throw new Error(`Unexpected character: '${ch}' at position ${this.pos}`);
  }

  parseString(): AstNode {
    const quote = this.input[this.pos];
    this.pos++;
    let value = '';
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === '\\') {
        this.pos++;
        const esc = this.input[this.pos];
        if (esc === 'n') value += '\n';
        else if (esc === 't') value += '\t';
        else value += esc;
      } else {
        value += this.input[this.pos];
      }
      this.pos++;
    }
    this.expect(quote);
    return { type: 'literal', value };
  }

  parseNumber(): AstNode {
    const start = this.pos;
    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      this.pos++;
    }
    if (this.pos < this.input.length && this.input[this.pos] === '.') {
      this.pos++;
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        this.pos++;
      }
    }
    return { type: 'literal', value: Number(this.input.slice(start, this.pos)) };
  }

  parseIdentifierOrCall(): AstNode {
    const name = this.readIdentifier();

    if (name === 'true') return { type: 'literal', value: true };
    if (name === 'false') return { type: 'literal', value: false };
    if (name === 'null') return { type: 'literal', value: null };

    this.skipWhitespace();

    if (this.input[this.pos] === '(') {
      this.pos++;
      const args: AstNode[] = [];
      this.skipWhitespace();
      if (this.input[this.pos] !== ')') {
        args.push(this.parseExpression(0));
        while (this.input[this.pos] === ',') {
          this.pos++;
          this.skipWhitespace();
          args.push(this.parseExpression(0));
        }
      }
      this.skipWhitespace();
      this.expect(')');
      return { type: 'call', name, args };
    }

    const path = [name];
    while (this.pos < this.input.length && this.input[this.pos] === '.') {
      this.pos++;
      path.push(this.readIdentifier());
    }

    return { type: 'field', path };
  }

  readIdentifier(): string {
    const start = this.pos;
    while (this.pos < this.input.length && this.isIdentChar(this.input[this.pos])) {
      this.pos++;
    }
    if (this.pos === start) {
      throw new Error(`Expected identifier at position ${this.pos}`);
    }
    return this.input.slice(start, this.pos);
  }

  peekOperator(): string | null {
    for (const op of ['||', '&&', '==', '!=', '>=', '<=', '>', '<', '+', '-', '*', '/', '%']) {
      if (this.input.startsWith(op, this.pos)) {
        return op;
      }
    }
    return null;
  }

  skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  expect(ch: string): void {
    if (this.input[this.pos] !== ch) {
      throw new Error(
        `Expected '${ch}' at position ${this.pos}, got '${this.input[this.pos] ?? 'EOF'}'`,
      );
    }
    this.pos++;
  }

  isDigit(ch: string | undefined): boolean {
    return ch !== undefined && ch >= '0' && ch <= '9';
  }

  isIdentStart(ch: string | undefined): boolean {
    return ch !== undefined && /[a-zA-Z_$]/.test(ch);
  }

  isIdentChar(ch: string | undefined): boolean {
    return ch !== undefined && /[a-zA-Z0-9_$]/.test(ch);
  }

  isAfterValue(): boolean {
    if (this.pos === 0) return false;
    const prev = this.input[this.pos - 1];
    return prev === ')' || this.isDigit(prev) || this.isIdentChar(prev);
  }
}
