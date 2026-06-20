import type {
  StringFieldConfig,
  TextFieldConfig,
  IntFieldConfig,
  DecimalFieldConfig,
  BooleanFieldConfig,
  DateFieldConfig,
  DatetimeFieldConfig,
  EnumFieldConfig,
  JsonFieldConfig,
  LinkFieldConfig,
  HasManyFieldConfig,
  ChildrenFieldConfig,
  ManyToManyFieldConfig,
  DynamicLinkFieldConfig,
  MoneyFieldConfig,
  CodeFieldConfig,
  TreeFieldConfig,
  SequenceFieldConfig,
  AttachmentFieldConfig,
  AttachmentsFieldConfig,
  ComputedFieldConfig,
} from './types/field.js';

type StringOptions = Omit<StringFieldConfig, 'type'>;
type TextOptions = Omit<TextFieldConfig, 'type'>;
type IntOptions = Omit<IntFieldConfig, 'type'>;
type DecimalOptions = Omit<DecimalFieldConfig, 'type'>;
type BooleanOptions = Omit<BooleanFieldConfig, 'type'>;
type DateOptions = Omit<DateFieldConfig, 'type'>;
type DatetimeOptions = Omit<DatetimeFieldConfig, 'type'>;
type EnumOptions = Omit<EnumFieldConfig, 'type' | 'options'>;
type JsonOptions = Omit<JsonFieldConfig, 'type'>;
type LinkOptions = Omit<LinkFieldConfig, 'type' | 'model'>;
type HasManyOptions = Omit<HasManyFieldConfig, 'type' | 'model'>;
type ChildrenOptions = Omit<ChildrenFieldConfig, 'type' | 'model'>;
type ManyToManyOptions = Omit<ManyToManyFieldConfig, 'type' | 'model'>;
type MoneyOptions = Omit<MoneyFieldConfig, 'type'>;
type CodeOptions = Omit<CodeFieldConfig, 'type'>;
type TreeOptions = Omit<TreeFieldConfig, 'type'>;
type SequenceOptions = Omit<SequenceFieldConfig, 'type'>;
type AttachmentOptions = Omit<AttachmentFieldConfig, 'type'>;
type AttachmentsOptions = Omit<AttachmentsFieldConfig, 'type'>;
type ComputedOptions = Omit<ComputedFieldConfig, 'type'>;

/**
 * Factory for creating typed field configurations.
 *
 * @example
 * ```ts
 * import { field } from 'rangka';
 *
 * const fields = {
 *   name: field.string({ required: true, maxLength: 200 }),
 *   amount: field.decimal({ precision: 18, scale: 2 }),
 *   customer: field.link('sales.customer', { required: true }),
 * };
 * ```
 */
export const field = {
  /** Short text field. Maps to `VARCHAR(n)` or `VARCHAR(255)`. */
  string(opts?: StringOptions): StringFieldConfig {
    return { type: 'string', ...opts };
  },

  /** Long-form text field. Maps to `TEXT` with no length limit. */
  text(opts?: TextOptions): TextFieldConfig {
    return { type: 'text', ...opts };
  },

  /** Integer field. Maps to `INTEGER`. */
  int(opts?: IntOptions): IntFieldConfig {
    return { type: 'int', ...opts };
  },

  /** Decimal field with configurable precision and scale. Maps to `NUMERIC(p, s)`. */
  decimal(opts?: DecimalOptions): DecimalFieldConfig {
    return { type: 'decimal', ...opts };
  },

  /** Boolean field. Maps to `BOOLEAN`. */
  boolean(opts?: BooleanOptions): BooleanFieldConfig {
    return { type: 'boolean', ...opts };
  },

  /** Date field without time. Format: `YYYY-MM-DD`. Maps to `DATE`. */
  date(opts?: DateOptions): DateFieldConfig {
    return { type: 'date', ...opts };
  },

  /** Date with time. Stored as UTC in ISO 8601 format. Maps to `TIMESTAMPTZ`. */
  datetime(opts?: DatetimeOptions): DatetimeFieldConfig {
    return { type: 'datetime', ...opts };
  },

  /**
   * Enum field restricted to a fixed set of allowed values.
   * @param options - Array of allowed string values
   */
  enum(options: readonly string[], opts?: EnumOptions): EnumFieldConfig {
    return { type: 'enum', options, ...opts };
  },

  /** Arbitrary JSON data. Maps to `JSONB`. */
  json(opts?: JsonOptions): JsonFieldConfig {
    return { type: 'json', ...opts };
  },

  /**
   * Foreign key reference to another model.
   * @param model - Qualified model name (e.g., `'sales.customer'`)
   */
  link(model: string, opts?: LinkOptions): LinkFieldConfig {
    return { type: 'link', model, ...opts };
  },

  /**
   * Virtual one-to-many relationship. Does not create a column.
   * Used for eager-loading via `?include=`.
   * @param model - Qualified model name of related records
   */
  hasMany(model: string, opts: HasManyOptions): HasManyFieldConfig {
    return { type: 'hasMany', model, ...opts };
  },

  /**
   * Parent-child relationship. Children are saved and deleted with the parent
   * in a single transaction.
   * @param model - Qualified model name for the child table
   */
  children(model: string, opts: ChildrenOptions): ChildrenFieldConfig {
    return { type: 'children', model, ...opts };
  },

  /**
   * Many-to-many relationship via a junction table.
   * @param model - Qualified model name of the related model
   */
  manyToMany(model: string, opts: ManyToManyOptions): ManyToManyFieldConfig {
    return { type: 'manyToMany', model, ...opts };
  },

  /**
   * Polymorphic reference where the target model is stored in another field.
   * @param modelField - Name of the field that stores the target model name
   */
  dynamicLink(modelField: string): DynamicLinkFieldConfig {
    return { type: 'dynamicLink', modelField };
  },

  /** Monetary value. Stored as decimal, formatted as currency in the UI. */
  money(opts?: MoneyOptions): MoneyFieldConfig {
    return { type: 'money', ...opts };
  },

  /** Code editor field with syntax highlighting. */
  code(opts: CodeOptions): CodeFieldConfig {
    return { type: 'code', ...opts };
  },

  /** Hierarchical self-referencing field for tree structures. */
  tree(opts: TreeOptions): TreeFieldConfig {
    return { type: 'tree', ...opts };
  },

  /** Auto-incrementing sequence with optional prefix and zero-padding. */
  sequence(opts?: SequenceOptions): SequenceFieldConfig {
    return { type: 'sequence', ...opts };
  },

  /** Single file upload field. */
  attachment(opts?: AttachmentOptions): AttachmentFieldConfig {
    return { type: 'attachment', ...opts };
  },

  /** Multiple file upload field. */
  attachments(opts?: AttachmentsOptions): AttachmentsFieldConfig {
    return { type: 'attachments', ...opts };
  },

  /**
   * Computed field derived from other field values.
   * @param opts - Must include `depends` (field names) and `compute` (function)
   */
  computed(opts: ComputedOptions): ComputedFieldConfig {
    return { type: 'computed', ...opts };
  },
};
