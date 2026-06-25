# @rangka/ui Component Map

Complete inventory of visual components to recreate in `@rangka/ui`, mapped from `packages/client/src/`.

## Primitives

| Component     | Source file                       | Description                                                                                       |
| ------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Button        | `components/ui/button.tsx`        | Variants: default, outline, secondary, ghost, destructive, link. Sizes: xs, sm, default, lg, icon |
| Badge         | `components/ui/badge.tsx`         | Inline label. Variants: default, secondary, destructive, outline, ghost, link                     |
| Input         | `components/ui/input.tsx`         | Text input with file upload support, disabled/error states                                        |
| Textarea      | `components/ui/textarea.tsx`      | Multi-line text input                                                                             |
| Checkbox      | `components/ui/checkbox.tsx`      | Checkbox control                                                                                  |
| Radio Group   | `components/ui/radio-group.tsx`   | Radio button group                                                                                |
| Switch        | `components/ui/switch.tsx`        | Toggle switch                                                                                     |
| Select        | `components/ui/select.tsx`        | Dropdown select with Trigger, Content, Item, Group                                                |
| Combobox      | `components/ui/combobox.tsx`      | Searchable select                                                                                 |
| Native Select | `components/ui/native-select.tsx` | HTML native select fallback                                                                       |
| Toggle        | `components/ui/toggle.tsx`        | Toggle button with variants                                                                       |
| Toggle Group  | `components/ui/toggle-group.tsx`  | Grouped toggle buttons                                                                            |
| Button Group  | `components/ui/button-group.tsx`  | Grouped buttons with shared styling                                                               |
| Label         | `components/ui/label.tsx`         | Form label with disabled state                                                                    |
| Input OTP     | `components/ui/input-otp.tsx`     | One-time-password input                                                                           |
| Calendar      | `components/ui/calendar.tsx`      | Date picker calendar                                                                              |
| Slider        | `components/ui/slider.tsx`        | Range slider                                                                                      |
| Progress      | `components/ui/progress.tsx`      | Progress bar                                                                                      |
| Kbd           | `components/ui/kbd.tsx`           | Keyboard key display                                                                              |
| Skeleton      | `components/ui/skeleton.tsx`      | Loading skeleton placeholder                                                                      |
| Avatar        | `components/ui/avatar.tsx`        | User avatar with fallback                                                                         |
| Separator     | `components/ui/separator.tsx`     | Horizontal/vertical divider                                                                       |
| Icon          | `components/Icon.tsx`             | Lucide icon wrapper                                                                               |

## Layout

| Component    | Source file                            | Description                                                   |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Card         | `components/ui/card.tsx`               | Card with Header, Title, Description, Action, Content, Footer |
| Stack        | `widgets/components/StackWidget.tsx`   | Vertical stack container with padding                         |
| Group        | `widgets/components/GroupWidget.tsx`   | Flex container with gap/padding/alignment                     |
| Grid         | `widgets/components/GridWidget.tsx`    | CSS grid layout                                               |
| Section      | `widgets/components/SectionWidget.tsx` | Collapsible section with border/title                         |
| Split        | `widgets/components/SplitWidget.tsx`   | Resizable split panels                                        |
| Scroll Area  | `components/ui/scroll-area.tsx`        | Scrollable area with custom scrollbar                         |
| Resizable    | `components/ui/resizable.tsx`          | Resizable panel group/panel/handle                            |
| Collapsible  | `components/ui/collapsible.tsx`        | Collapsible trigger/content                                   |
| Tabs         | `components/ui/tabs.tsx`               | Tab navigation with list and content                          |
| Accordion    | `components/ui/accordion.tsx`          | Expandable accordion panels                                   |
| Carousel     | `components/ui/carousel.tsx`           | Image/content carousel                                        |
| Aspect Ratio | `components/ui/aspect-ratio.tsx`       | Fixed aspect ratio container                                  |
| Table (HTML) | `components/ui/table.tsx`              | Semantic HTML table with styling                              |

## Shell

| Component       | Source file                            | Description                                                       |
| --------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Sidebar         | `components/ui/sidebar.tsx`            | Provider, Header, Content, Footer, Group, Menu, MenuItem, Trigger |
| ShellLayout     | `shell/ShellLayout.tsx`                | Main app shell with sidebar, header, breadcrumbs, drawer          |
| AppSidebar      | `shell/app-sidebar/AppSidebar.tsx`     | App-specific sidebar wrapper                                      |
| ModuleSwitcher  | `shell/app-sidebar/ModuleSwitcher.tsx` | Module/workspace switcher                                         |
| NavMain         | `shell/app-sidebar/NavMain.tsx`        | Main navigation with collapsible sections                         |
| NavUser         | `shell/app-sidebar/NavUser.tsx`        | User menu in sidebar                                              |
| SearchMenu      | `shell/app-sidebar/SearchMenu.tsx`     | Search trigger in sidebar                                         |
| HeaderActions   | `shell/HeaderActions.tsx`              | Action buttons in header                                          |
| CommandPalette  | `shell/CommandPalette.tsx`             | Cmd+K search palette                                              |
| Breadcrumb      | `components/ui/breadcrumb.tsx`         | Breadcrumb nav with list, item, link, separator                   |
| Navigation Menu | `components/ui/navigation-menu.tsx`    | Horizontal navigation menu                                        |
| Menubar         | `components/ui/menubar.tsx`            | Menu bar with menus and items                                     |
| Pagination      | `components/ui/pagination.tsx`         | Pagination controls                                               |

## Data

| Component              | Source file                                                      | Description                                        |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| DataTable              | `widgets/components/TableWidget.tsx`                             | Table with pagination, sorting, filtering, toolbar |
| TableToolbar           | `widgets/components/table/TableToolbar.tsx`                      | Table search/filter bar                            |
| TablePagination        | `widgets/components/table/TablePagination.tsx`                   | Pagination controls                                |
| CellRenderers          | `widgets/components/table/CellRenderers.tsx`                     | Cell rendering for different field types           |
| Datagrid               | `widgets/components/datagrid/DatagridWidget.tsx`                 | Virtual scrolling grid with inline editing         |
| DatagridToolbar        | `widgets/components/datagrid/grid/DatagridToolbar.tsx`           | Grid toolbar                                       |
| DatagridHeader         | `widgets/components/datagrid/grid/DatagridHeader.tsx`            | Column headers with sorting/resizing               |
| DatagridBody           | `widgets/components/datagrid/grid/DatagridBody.tsx`              | Grid rows and cells                                |
| DatagridCell           | `widgets/components/datagrid/grid/DatagridCell.tsx`              | Individual cell                                    |
| DatagridRow            | `widgets/components/datagrid/grid/DatagridRow.tsx`               | Grid row                                           |
| ColumnResizeHandle     | `widgets/components/datagrid/columns/ColumnResizeHandle.tsx`     | Draggable resize handle                            |
| ColumnVisibilityToggle | `widgets/components/datagrid/columns/ColumnVisibilityToggle.tsx` | Column visibility menu                             |

### Cell Editors (inline editing in datagrid)

| Component      | Source file                                              |
| -------------- | -------------------------------------------------------- |
| TextEditor     | `widgets/components/datagrid/editors/TextEditor.tsx`     |
| NumberEditor   | `widgets/components/datagrid/editors/NumberEditor.tsx`   |
| CheckboxEditor | `widgets/components/datagrid/editors/CheckboxEditor.tsx` |
| DateEditor     | `widgets/components/datagrid/editors/DateEditor.tsx`     |
| DatetimeEditor | `widgets/components/datagrid/editors/DatetimeEditor.tsx` |
| ComboboxEditor | `widgets/components/datagrid/editors/ComboboxEditor.tsx` |
| EnumEditor     | `widgets/components/datagrid/editors/EnumEditor.tsx`     |
| MoneyEditor    | `widgets/components/datagrid/editors/MoneyEditor.tsx`    |

## Overlays

| Component      | Source file                                           | Description                                        |
| -------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Dialog         | `components/ui/dialog.tsx`                            | Modal dialog with overlay, content, header, footer |
| Alert Dialog   | `components/ui/alert-dialog.tsx`                      | Confirmation dialog                                |
| Drawer / Sheet | `components/ui/drawer.tsx`, `components/ui/sheet.tsx` | Side drawer/sheet panel                            |
| Popover        | `components/ui/popover.tsx`                           | Floating popover with trigger and content          |
| Dropdown Menu  | `components/ui/dropdown-menu.tsx`                     | Dropdown menu with items and groups                |
| Context Menu   | `components/ui/context-menu.tsx`                      | Right-click context menu                           |
| Hover Card     | `components/ui/hover-card.tsx`                        | Card on hover                                      |
| Tooltip        | `components/ui/tooltip.tsx`                           | Tooltip with trigger and content                   |
| Command        | `components/ui/command.tsx`                           | Command palette (cmdk)                             |
| ConfirmDialog  | `shell/ConfirmDialog.tsx`                             | App-level confirm modal                            |

## Feedback

| Component | Source file                 | Description                                        |
| --------- | --------------------------- | -------------------------------------------------- |
| Alert     | `components/ui/alert.tsx`   | Alert box with variants (default, destructive)     |
| Toast     | `shell/Toast.tsx`           | Notification toast (info, success, warning, error) |
| Spinner   | `components/ui/spinner.tsx` | Animated loading spinner                           |
| Empty     | `components/ui/empty.tsx`   | Empty state with icon/title/description            |
| Sonner    | `components/ui/sonner.tsx`  | Toast library integration                          |

## Form

| Component        | Source file                               | Description                                              |
| ---------------- | ----------------------------------------- | -------------------------------------------------------- |
| Field            | `components/ui/field.tsx`                 | Fieldset with legend, label, content, description, error |
| InputGroup       | `components/ui/input-group.tsx`           | Input with addons (buttons, text, icons)                 |
| FormWidget       | `widgets/form/FormWidget.tsx`             | Form container with submission/validation                |
| InputWidget      | `widgets/components/InputWidget.tsx`      | Input field with label and error                         |
| TextareaWidget   | `widgets/components/TextareaWidget.tsx`   | Textarea with label and error                            |
| SelectWidget     | `widgets/components/SelectWidget.tsx`     | Select with label and error                              |
| CheckboxWidget   | `widgets/components/CheckboxWidget.tsx`   | Checkbox with label                                      |
| DatePickerWidget | `widgets/components/DatePickerWidget.tsx` | Date picker with popover calendar                        |
| DatetimeWidget   | `widgets/components/DatetimeWidget.tsx`   | DateTime picker                                          |
| TreeWidget       | `widgets/components/TreeWidget.tsx`       | Hierarchical tree selector                               |
| LinkWidget       | `widgets/components/LinkWidget.tsx`       | Relationship/link selector                               |

## Display

| Component | Source file                            | Description                                                    |
| --------- | -------------------------------------- | -------------------------------------------------------------- |
| Text      | `widgets/components/TextWidget.tsx`    | Text with style variants (heading, body, caption, bold, muted) |
| Image     | `widgets/components/ImageWidget.tsx`   | Image display                                                  |
| Code      | `widgets/components/CodeWidget.tsx`    | Code display                                                   |
| Json      | `widgets/components/JsonWidget.tsx`    | JSON display                                                   |
| Divider   | `widgets/components/DividerWidget.tsx` | Visual divider                                                 |
| Spacer    | `widgets/components/SpacerWidget.tsx`  | Vertical spacer                                                |

## Auth

| Component          | Source file                    | Description                    |
| ------------------ | ------------------------------ | ------------------------------ |
| LoginForm          | `auth/LoginForm.tsx`           | Login form with email/password |
| SetupForm          | `auth/SetupForm.tsx`           | Registration/setup form        |
| SessionExpired     | `auth/SessionExpired.tsx`      | Session expired screen         |
| ModuleSelectorPage | `shell/ModuleSelectorPage.tsx` | Module selection UI            |

---

## Migration Notes

- **Headless base:** Replace Radix UI wrappers with Base UI (`@base-ui/react`)
- **Styling:** All components use Tailwind v4 + CVA via `cn()` utility
- **Dark mode:** Currently via `[data-theme="dark"]` attribute. Will use `.dark` class with OKLch tokens
- **Spacing scale:** 7 tokens (none, xs, sm, md, lg, xl, 2xl)
- **Data attributes:** Components use `data-slot="name"` for testing hooks
- **Composition pattern:** Multi-section components use static sub-properties (e.g., `Card.Header`)

## Priority Order

Build in this order to unblock the client migration:

1. **Primitives** — Button, Input, Select, Checkbox, Badge, Label (everything else depends on these)
2. **Layout** — Card, Stack, Group, Grid, Tabs, Scroll Area
3. **Form** — Field, InputGroup (needed by form widgets)
4. **Overlays** — Dialog, Popover, Dropdown Menu, Tooltip (used everywhere)
5. **Feedback** — Toast, Spinner, Empty, Alert
6. **Shell** — Sidebar, Breadcrumb, Shell Layout
7. **Data** — DataTable, Datagrid, Cell Editors (most complex, do last)
8. **Display** — Text, Icon, Image, Code (simple wrappers)
9. **Auth** — LoginForm, SetupForm (last, simple composition of primitives)
