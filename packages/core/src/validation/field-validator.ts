import type { ResolvedModel } from '../schema/types.js';
import type { ValidationConfig } from '@rangka/shared';
import { isNil } from '../helpers/coerce.js';

export interface FieldViolation {
  field: string;
  rule: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FORMAT_VALIDATORS: Record<string, (value: string) => boolean> = {
  email: (v) => EMAIL_RE.test(v),
  url: (v) => URL_RE.test(v),
  uuid: (v) => UUID_RE.test(v),
};

export function validateFields(
  model: ResolvedModel,
  body: Record<string, unknown>,
  operation: 'create' | 'update',
): FieldViolation[] {
  const violations: FieldViolation[] = [];

  for (const field of model.fields) {
    if (!('validation' in field.config)) continue;
    const validation = (field.config as { validation?: ValidationConfig }).validation;
    if (!validation) continue;

    const value = body[field.name];

    if (isNil(value)) {
      if (operation === 'update') continue;
      continue;
    }

    const fieldViolations = validateValue(field.name, value, validation);
    violations.push(...fieldViolations);
  }

  return violations;
}

function validateValue(
  fieldName: string,
  value: unknown,
  config: ValidationConfig,
): FieldViolation[] {
  const violations: FieldViolation[] = [];

  if (typeof value === 'string') {
    if (config.minLength !== undefined && value.length < config.minLength) {
      violations.push({
        field: fieldName,
        rule: 'minLength',
        message: config.message ?? `${fieldName} must be at least ${config.minLength} characters`,
      });
    }

    if (config.maxLength !== undefined && value.length > config.maxLength) {
      violations.push({
        field: fieldName,
        rule: 'maxLength',
        message: config.message ?? `${fieldName} must be at most ${config.maxLength} characters`,
      });
    }

    if (config.pattern !== undefined) {
      const re = new RegExp(config.pattern);
      if (!re.test(value)) {
        violations.push({
          field: fieldName,
          rule: 'pattern',
          message: config.message ?? `${fieldName} does not match the required pattern`,
        });
      }
    }

    if (config.format !== undefined) {
      const validator = FORMAT_VALIDATORS[config.format];
      if (validator && !validator(value)) {
        violations.push({
          field: fieldName,
          rule: 'format',
          message: config.message ?? `${fieldName} must be a valid ${config.format}`,
        });
      }
    }
  }

  if (typeof value === 'number') {
    if (config.min !== undefined && value < config.min) {
      violations.push({
        field: fieldName,
        rule: 'min',
        message: config.message ?? `${fieldName} must be at least ${config.min}`,
      });
    }

    if (config.max !== undefined && value > config.max) {
      violations.push({
        field: fieldName,
        rule: 'max',
        message: config.message ?? `${fieldName} must be at most ${config.max}`,
      });
    }
  }

  return violations;
}
