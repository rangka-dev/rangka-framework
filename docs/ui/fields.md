---
status: stable
since: 0.1.0
last-updated: 2026-06-21
description: Field type rendering, display modes, and customization
---

# Field Renderers

Every model field type maps to a built-in renderer. Each renderer handles both form (editable) and list (read-only) contexts. You can override any renderer with a custom widget.

Widget components live in `packages/ui/src/widgets/input/`. All accept `WidgetComponentProps` from `@rangka/shared`.

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
| `datetime` | Date + time picker (12-hour with AM/PM)       |
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

Custom field renderers are widgets that live in `apps/{app}/widgets/`:

```tsx
// widgets/color-picker.tsx
import { defineWidget, registerWidget } from 'rangka';

const meta = defineWidget({
  name: 'inventory.color-picker',
  label: 'Color Picker',
  category: 'input',
  schema: {},
  binding: 'field',
  triggers: [],
  container: false,
});

registerWidget(meta, ({ bind }) => {
  const { value, setValue, meta: fieldMeta } = bind;

  if (!setValue) {
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
        onChange={(e) => setValue(e.target.value)}
        aria-label={fieldMeta?.label}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        placeholder="#000000"
        readOnly={!setValue}
        className="input-base w-28"
      />
    </div>
  );
});
```

## Assigning a renderer

### Per field

Set `renderer` on the field in your model:

```typescript
fields: {
  color: field.string({ renderer: 'inventory.color-picker' }),
}
```

### Per type (global)

Register a widget that replaces the built-in for all fields of a given type:

```typescript
import { registerFieldRenderer } from '@rangka/client';
import RichTextEditor from './widgets/rich-text-editor';

registerFieldRenderer('rich-text', RichTextEditor, { forTypes: ['LongText'] });
```

## Resolution order

1. Field-specific `renderer` property
2. Global registry (`registerFieldRenderer()`)
3. Built-in renderer for the field type

## Accessibility

Custom renderers must include:

- `aria-label` or associated `<label>`
- `aria-invalid="true"` when an error is present
- `aria-describedby` pointing to the error message
- Keyboard operability
- Visible focus ring
