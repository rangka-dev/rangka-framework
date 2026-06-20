---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Field type rendering, display modes, and customization
---

# Field Renderers

Every model field type maps to a built-in renderer that handles both form (editable) and list (read-only) contexts. You can override any renderer with a custom one.

## Built-in renderers

### Form context

| Field Type | Renders as                                    |
| ---------- | --------------------------------------------- |
| `string`   | Text input                                    |
| `text`     | Textarea (auto-resize)                        |
| `int`      | Number input (integer step)                   |
| `decimal`  | Number input (decimal)                        |
| `money`    | Number with currency prefix                   |
| `boolean`  | Checkbox                                      |
| `enum`     | Dropdown (searchable when > 8 options)        |
| `date`     | Date picker                                   |
| `datetime` | Date + time picker                            |
| `link`     | Searchable select (fetches from linked model) |

### List context

| Field Type | Displays as            |
| ---------- | ---------------------- |
| `string`   | Plain text (truncated) |
| `text`     | First line only        |
| `int`      | Formatted number       |
| `decimal`  | Formatted decimal      |
| `money`    | With currency symbol   |
| `boolean`  | Check icon             |
| `enum`     | Colored badge          |
| `date`     | Locale-formatted date  |
| `datetime` | Date + time            |
| `link`     | Clickable record label |

## Writing a custom renderer

Custom renderers live in `modules/{module}/ui/fields/`:

```tsx
// modules/inventory/ui/fields/color-picker.tsx
import { FieldRendererProps } from '@rangka/client';

export const meta = {
  name: 'color-picker',
  label: 'Color Picker',
  forTypes: ['Data'],
};

export default function ColorPicker({
  value,
  onChange,
  field,
  readOnly,
  error,
  context,
}: FieldRendererProps) {
  if (context === 'list') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block w-3 h-3 rounded-sm border border-default"
          style={{ backgroundColor: value || 'transparent' }}
        />
        {value || '—'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        aria-label={field.label}
        aria-invalid={!!error}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        readOnly={readOnly}
        className="input-base w-28"
      />
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
}
```

## Props interface

Every renderer receives:

```typescript
interface FieldRendererProps {
  value: any;
  onChange(value: any): void;
  field: {
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
    linkedModel?: string;
    readOnly?: boolean;
  };
  readOnly: boolean;
  error?: string;
  context: 'form' | 'list';
}
```

In list context, `onChange` is a no-op and `readOnly` is always true.

## Assigning a renderer

### Per field

Set `renderer` on the field in your model:

```typescript
fields: {
  color: field.string({ renderer: 'color-picker' }),
}
```

### Per type (global)

Register a renderer that replaces the built-in for all fields of a given type:

```typescript
import { registerFieldRenderer } from '@rangka/client';
import RichTextEditor from './fields/rich-text-editor';

registerFieldRenderer('rich-text', RichTextEditor, { forTypes: ['LongText'] });
```

## Resolution order

1. Field-specific `renderer` property
2. Module field directory (`modules/{module}/ui/fields/{name}.tsx`)
3. Global registry (`registerFieldRenderer()`)
4. Built-in renderer for the field type

## Accessibility

Custom renderers should include:

- `aria-label` or associated `<label>`
- `aria-invalid="true"` when error is present
- `aria-describedby` pointing to the error message
- Keyboard operability
- Visible focus ring
