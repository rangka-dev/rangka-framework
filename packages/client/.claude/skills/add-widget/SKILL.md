---
name: add-widget
description: Adding a new widget component to packages/client. Use when creating any new widget type.
---

## Before you write any code

1. Read an existing widget that is closest to what you are building:
   - Input widget → `src/widgets/components/InputWidget.tsx`
   - Display widget → `src/widgets/components/TextWidget.tsx`
   - Container widget → `src/widgets/components/GroupWidget.tsx`
   - Data widget → `src/widgets/components/DataWidget.tsx`
   - Form widget → `src/widgets/form/FormWidget.tsx`

2. Read the shared hooks you MUST use:
   - `src/widgets/hooks/useBind.ts` — binding resolution
   - `src/widgets/hooks/useAction.ts` — trigger handlers
   - `src/widgets/types.ts` — WidgetProps interface

3. Check if the logic you need already exists:
   - Data fetching → `src/widgets/data/useModelRecord.ts` or `src/widgets/data/useModelQuery.ts`
   - Form state → `src/widgets/form/FormContext.ts`
   - Page state → `src/widgets/hooks/usePageState.ts`
   - Expressions → `src/widgets/hooks/useExpression.ts`

## Widget file template

Every widget follows this exact structure:

```typescript
import React from 'react';
import type { WidgetProps } from '../types.js';

export function MyWidget({ props, bind, on, children }: WidgetProps) {
  // Read props (typed from schema below)
  const label = (props.label as string) ?? bind.meta?.label ?? '';

  // Read bound value (ALWAYS via bind, never via useWidgetContext)
  const value = bind.value;

  // Write via bind.setValue (ALWAYS, never direct state)
  const handleChange = (newVal: unknown) => {
    bind.setValue?.(newVal);
    on.change?.(newVal);  // fire trigger if applicable
  };

  // Read error from bind (comes from FormContext automatically)
  const error = bind.error;

  return (
    <div>
      {/* widget markup */}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

MyWidget.widgetMeta = {
  name: 'my-widget',
  label: 'My Widget',
  category: 'input' as const,  // input | display | layout | action | data
  schema: {
    label: { type: 'string' as const },
    // ... prop definitions
  },
  binding: 'field' as const,   // none | field | expression | record | model
  triggers: ['change'],        // events this widget fires via on.*
  container: false,            // true only if it renders children
};
```

## Registration

After creating the widget file, register it in `src/widgets/components/register.ts`:

1. Add the import at the end of the import block
2. Add the component to the `builtInWidgets` array

## Rules

- Props come from `props` (page definition config), NEVER from custom React props
- Bound value comes from `bind.value`, NEVER from `useWidgetContext().record` directly
- Writing goes through `bind.setValue`, which automatically handles form state integration
- Triggers fire through `on.triggerName?.()`, NEVER by calling `dispatch` directly
- Container widgets that provide new context use `childNodes` + `WidgetRenderer`, not `children`
- All widgets use the `WidgetProps` interface unchanged. If you need a new field, update the shared type and ALL consumers
- Use shadcn components from `src/components/ui/` for UI primitives
- Use Tailwind classes, never inline styles
- Error display pattern: `{bind.error && <p className="text-xs text-destructive mt-1">{bind.error}</p>}`

## Checklist before done

- [ ] Widget accepts only `WidgetProps` (no custom props)
- [ ] Uses `bind.value` / `bind.setValue` for data (not custom state)
- [ ] Fires triggers via `on.*` (not dispatch)
- [ ] Has `widgetMeta` with all fields
- [ ] Registered in `register.ts`
- [ ] If container: renders via `childNodes` + `WidgetRenderer` when providing new context
- [ ] If input: displays `bind.error` below the field
- [ ] No new hooks that duplicate existing ones (useBind, useModelRecord, etc.)
- [ ] Builds successfully: `pnpm --filter @rangka/client build`
