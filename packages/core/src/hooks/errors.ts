export class ValidationError extends Error {
  public readonly field?: string;
  public readonly code: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = 'VALIDATION_ERROR';
  }
}
