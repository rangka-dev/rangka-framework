# @rangka/ui → Base UI Component Mapping

Maps each `@rangka/ui` component to its Base UI (`@base-ui/react`) primitive. Components marked "custom" have no Base UI equivalent and are built from scratch with Tailwind + CVA.

## Import Pattern

```typescript
import { Dialog } from '@base-ui/react/dialog';
import { Select } from '@base-ui/react/select';
import { Checkbox } from '@base-ui/react/checkbox';
```

Base UI uses compound component pattern. Each import gives you the Root + sub-parts (e.g., `Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`, `Dialog.Title`).

---

## Primitives

| @rangka/ui Component | Base UI Primitive             | Notes                                                                                     |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| Button               | `@base-ui/react/button`       | Wrap with CVA variants                                                                    |
| Badge                | custom                        | No Base UI equivalent. Pure styled span                                                   |
| Input                | `@base-ui/react/input`        | Wrap with CVA + token styles                                                              |
| Textarea             | custom                        | HTML textarea + CVA (Base UI Input is single-line)                                        |
| Checkbox             | `@base-ui/react/checkbox`     | `Checkbox.Root`, `Checkbox.Indicator`                                                     |
| Radio Group          | `@base-ui/react/radio`        | `Radio.Root`, `Radio.Item`, `Radio.Indicator`                                             |
| Switch               | `@base-ui/react/switch`       | `Switch.Root`, `Switch.Thumb`                                                             |
| Select               | `@base-ui/react/select`       | `Select.Root`, `Select.Trigger`, `Select.Popup`, `Select.Item`                            |
| Combobox             | `@base-ui/react/combobox`     | `Combobox.Root`, `Combobox.Input`, `Combobox.Popup`, `Combobox.Item`                      |
| Toggle               | `@base-ui/react/toggle`       | `Toggle.Root`                                                                             |
| Toggle Group         | `@base-ui/react/toggle-group` | `ToggleGroup.Root`, `ToggleGroup.Item`                                                    |
| Label                | custom                        | HTML label + CVA (Base UI Field handles labels)                                           |
| Slider               | `@base-ui/react/slider`       | `Slider.Root`, `Slider.Track`, `Slider.Thumb`                                             |
| Progress             | `@base-ui/react/progress`     | `Progress.Root`, `Progress.Track`, `Progress.Indicator`                                   |
| Avatar               | `@base-ui/react/avatar`       | `Avatar.Root`, `Avatar.Image`, `Avatar.Fallback`                                          |
| Separator            | `@base-ui/react/separator`    | `Separator.Root`                                                                          |
| Skeleton             | custom                        | Pure styled div with animation                                                            |
| Kbd                  | custom                        | Pure styled element                                                                       |
| Icon                 | custom                        | Lucide icon wrapper                                                                       |
| Input OTP            | `@base-ui/react/otp-field`    | `OTPField.Root`, `OTPField.Group`, `OTPField.Input`                                       |
| Number Input         | `@base-ui/react/number-field` | `NumberField.Root`, `NumberField.Input`, `NumberField.Increment`, `NumberField.Decrement` |
| Calendar             | `@base-ui/react/calendar`     | New in Base UI, use if stable enough                                                      |

## Layout

| @rangka/ui Component | Base UI Primitive            | Notes                                                                                |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| Card                 | custom                       | Styled div composition. No Base UI equivalent                                        |
| Stack                | custom                       | Flex column with gap. Pure CSS layout                                                |
| Group                | custom                       | Flex row with gap. Pure CSS layout                                                   |
| Grid                 | custom                       | CSS grid wrapper. Pure CSS layout                                                    |
| Section              | `@base-ui/react/collapsible` | Use Collapsible for expand/collapse behavior                                         |
| Split                | custom                       | Resizable panels. No Base UI equivalent                                              |
| Scroll Area          | `@base-ui/react/scroll-area` | `ScrollArea.Root`, `ScrollArea.Viewport`, `ScrollArea.Scrollbar`, `ScrollArea.Thumb` |
| Resizable            | custom                       | Drag-to-resize panels. Build with pointer events                                     |
| Collapsible          | `@base-ui/react/collapsible` | `Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Panel`                       |
| Tabs                 | `@base-ui/react/tabs`        | `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`                                   |
| Accordion            | `@base-ui/react/accordion`   | `Accordion.Root`, `Accordion.Item`, `Accordion.Trigger`, `Accordion.Panel`           |
| Carousel             | custom                       | No Base UI equivalent. Use embla-carousel                                            |
| Aspect Ratio         | custom                       | Pure CSS aspect-ratio                                                                |
| Table (HTML)         | custom                       | Styled HTML table elements                                                           |

## Shell

| @rangka/ui Component | Base UI Primitive                | Notes                                                                                      |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| Sidebar              | custom                           | App shell navigation. No Base UI equivalent                                                |
| Breadcrumb           | custom                           | Nav list with separators. Pure HTML/ARIA                                                   |
| Navigation Menu      | `@base-ui/react/navigation-menu` | `NavigationMenu.Root`, `NavigationMenu.List`, `NavigationMenu.Item`, `NavigationMenu.Link` |
| Menubar              | `@base-ui/react/menubar`         | `Menubar.Root`, `Menubar.Menu`, `Menubar.Trigger`, `Menubar.Popup`                         |
| Toolbar              | `@base-ui/react/toolbar`         | `Toolbar.Root`, `Toolbar.Button`, `Toolbar.Separator`                                      |
| Pagination           | custom                           | No Base UI equivalent. Button + nav composition                                            |
| Header               | custom                           | App header layout. Pure composition                                                        |
| Shell Layout         | custom                           | App shell grid. Pure CSS layout                                                            |

## Overlays

| @rangka/ui Component | Base UI Primitive             | Notes                                                                                                                  |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Dialog / Modal       | `@base-ui/react/dialog`       | `Dialog.Root`, `Dialog.Trigger`, `Dialog.Portal`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close` |
| Alert Dialog         | `@base-ui/react/alert-dialog` | `AlertDialog.Root`, `AlertDialog.Trigger`, `AlertDialog.Popup`, `AlertDialog.Title`, `AlertDialog.Description`         |
| Drawer               | `@base-ui/react/drawer`       | `Drawer.Root`, `Drawer.Trigger`, `Drawer.Popup`, `Drawer.Title`, `Drawer.Description`, `Drawer.Close`                  |
| Popover              | `@base-ui/react/popover`      | `Popover.Root`, `Popover.Trigger`, `Popover.Popup`, `Popover.Title`, `Popover.Description`                             |
| Dropdown Menu        | `@base-ui/react/menu`         | `Menu.Root`, `Menu.Trigger`, `Menu.Popup`, `Menu.Item`, `Menu.Separator`, `Menu.SubmenuRoot`                           |
| Context Menu         | `@base-ui/react/context-menu` | `ContextMenu.Root`, `ContextMenu.Trigger`, `ContextMenu.Popup`, `ContextMenu.Item`                                     |
| Tooltip              | `@base-ui/react/tooltip`      | `Tooltip.Root`, `Tooltip.Trigger`, `Tooltip.Popup`                                                                     |
| Preview Card         | `@base-ui/react/preview-card` | `PreviewCard.Root`, `PreviewCard.Trigger`, `PreviewCard.Popup`                                                         |
| Command Palette      | custom                        | Build on Combobox or keep cmdk dependency                                                                              |

## Feedback

| @rangka/ui Component | Base UI Primitive      | Notes                                                                                               |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| Toast                | `@base-ui/react/toast` | `Toast.Provider`, `Toast.Viewport`, `Toast.Root`, `Toast.Title`, `Toast.Description`, `Toast.Close` |
| Alert                | custom                 | Static alert box. Pure styled div (not an overlay)                                                  |
| Spinner              | custom                 | CSS animation. No Base UI equivalent                                                                |
| Empty                | custom                 | Empty state composition. No Base UI equivalent                                                      |
| Meter                | `@base-ui/react/meter` | `Meter.Root`, `Meter.Track`, `Meter.Indicator`                                                      |

## Form

| @rangka/ui Component | Base UI Primitive         | Notes                                                                            |
| -------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| Field                | `@base-ui/react/field`    | `Field.Root`, `Field.Label`, `Field.Description`, `Field.Error`, `Field.Control` |
| Fieldset             | `@base-ui/react/fieldset` | `Fieldset.Root`, `Fieldset.Legend`                                               |
| Form                 | `@base-ui/react/form`     | `Form.Root`                                                                      |
| InputGroup           | custom                    | Addon/prefix/suffix wrapper around Input                                         |

## Data (all custom)

| @rangka/ui Component | Base UI Primitive | Notes                                                            |
| -------------------- | ----------------- | ---------------------------------------------------------------- |
| DataTable            | custom            | TanStack Table. No Base UI equivalent                            |
| Datagrid             | custom            | TanStack Table + Virtual. No Base UI equivalent                  |
| Cell Editors         | mixed             | Text/Number editors use Base UI Input/NumberField. Others custom |

---

## Summary

| Category   | Total   | Uses Base UI | Custom  |
| ---------- | ------- | ------------ | ------- |
| Primitives | 22      | 16           | 6       |
| Layout     | 14      | 5            | 9       |
| Shell      | 8       | 3            | 5       |
| Overlays   | 8       | 7            | 1       |
| Feedback   | 5       | 2            | 3       |
| Form       | 4       | 3            | 1       |
| Data       | 12+     | 0            | 12+     |
| **Total**  | **73+** | **36**       | **37+** |

---

## Implementation Notes

1. **Base UI uses `render` prop pattern** for custom element rendering. Our wrapper provides the styled version:

   ```typescript
   // Base UI exposes parts, we style them
   <Select.Trigger render={<button className={cn(triggerVariants())} />}>
     {children}
   </Select.Trigger>
   ```

2. **Base UI sub-parts map to our sub-components:**

   ```
   Base UI: Dialog.Root → Dialog.Trigger → Dialog.Popup → Dialog.Title
   Ours:    Modal       → (trigger external) → Modal.Header → Modal.Title
   ```

3. **Custom components** (Badge, Card, Stack, Grid, Skeleton, Spinner, etc.) don't need headless behavior — they're pure styled elements. Build with CVA + forwardRef directly.

4. **Data layer** has zero Base UI coverage. Use TanStack Table + TanStack Virtual. These are the most complex components.

5. **Command Palette** can either use Base UI Combobox (built-in filtering + keyboard nav) or keep cmdk as a dependency. Base UI Combobox is the better long-term fit since we're already on Base UI.
