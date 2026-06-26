# @rangka/ui Component Map

Complete inventory of visual components to recreate in `@rangka/ui`, mapped from `packages/client/src/`.

Status: Done / Pending / Skipped (with reason)

## Primitives

| Component     | Source file                       | Status  | Notes                                     |
| ------------- | --------------------------------- | ------- | ----------------------------------------- |
| Button        | `components/ui/button.tsx`        | Done    | `src/primitives/button.tsx`               |
| Badge         | `components/ui/badge.tsx`         | Done    | `src/primitives/badge.tsx`                |
| Input         | `components/ui/input.tsx`         | Done    | `src/primitives/input.tsx`                |
| Textarea      | `components/ui/textarea.tsx`      | Done    | `src/primitives/textarea.tsx`             |
| Checkbox      | `components/ui/checkbox.tsx`      | Done    | `src/primitives/checkbox.tsx`             |
| Radio Group   | `components/ui/radio-group.tsx`   | Done    | `src/primitives/radio-group.tsx`          |
| Switch        | `components/ui/switch.tsx`        | Done    | `src/primitives/switch.tsx`               |
| Select        | `components/ui/select.tsx`        | Done    | `src/primitives/select.tsx`               |
| Combobox      | `components/ui/combobox.tsx`      | Done    | `src/primitives/combobox.tsx`             |
| Native Select | `components/ui/native-select.tsx` | Skipped | Covered by Select primitive               |
| Toggle        | `components/ui/toggle.tsx`        | Done    | `src/primitives/toggle.tsx`               |
| Toggle Group  | `components/ui/toggle-group.tsx`  | Done    | `src/primitives/toggle-group.tsx`         |
| Button Group  | `components/ui/button-group.tsx`  | Skipped | Compose with Group layout + Button        |
| Label         | `components/ui/label.tsx`         | Done    | `src/primitives/label.tsx`                |
| Input OTP     | `components/ui/input-otp.tsx`     | Done    | `src/primitives/input-otp.tsx`            |
| Number Input  | —                                 | Done    | `src/primitives/number-input.tsx`         |
| Calendar      | `components/ui/calendar.tsx`      | Skipped | Integrated into DatePicker form component |
| Slider        | `components/ui/slider.tsx`        | Done    | `src/primitives/slider.tsx`               |
| Progress      | `components/ui/progress.tsx`      | Done    | `src/primitives/progress.tsx`             |
| Kbd           | `components/ui/kbd.tsx`           | Done    | `src/primitives/kbd.tsx`                  |
| Skeleton      | `components/ui/skeleton.tsx`      | Done    | `src/primitives/skeleton.tsx`             |
| Avatar        | `components/ui/avatar.tsx`        | Done    | `src/primitives/avatar.tsx`               |
| Separator     | `components/ui/separator.tsx`     | Done    | `src/primitives/separator.tsx`            |
| Icon          | `components/Icon.tsx`             | Done    | `src/primitives/icon.tsx`                 |
| Tooltip       | `components/ui/tooltip.tsx`       | Done    | `src/primitives/tooltip.tsx`              |

## Layout

| Component    | Source file                            | Status  | Notes                                           |
| ------------ | -------------------------------------- | ------- | ----------------------------------------------- |
| Card         | `components/ui/card.tsx`               | Done    | `src/layout/card.tsx` — composition pattern     |
| Stack        | `widgets/components/StackWidget.tsx`   | Done    | `src/layout/stack.tsx`                          |
| Group        | `widgets/components/GroupWidget.tsx`   | Done    | `src/layout/group.tsx`                          |
| Grid         | `widgets/components/GridWidget.tsx`    | Done    | `src/layout/grid.tsx`                           |
| Section      | `widgets/components/SectionWidget.tsx` | Done    | `src/layout/section.tsx` — collapsible variant  |
| Split        | `widgets/components/SplitWidget.tsx`   | Done    | `src/layout/split.tsx` — react-resizable-panels |
| Scroll Area  | `components/ui/scroll-area.tsx`        | Done    | `src/layout/scroll-area.tsx`                    |
| Collapsible  | `components/ui/collapsible.tsx`        | Done    | `src/layout/collapsible.tsx`                    |
| Tabs         | `components/ui/tabs.tsx`               | Done    | `src/layout/tabs.tsx`                           |
| Divider      | `widgets/components/DividerWidget.tsx` | Done    | `src/layout/divider.tsx`                        |
| Spacer       | `widgets/components/SpacerWidget.tsx`  | Done    | `src/layout/spacer.tsx`                         |
| Resizable    | `components/ui/resizable.tsx`          | Skipped | Covered by Split component                      |
| Accordion    | `components/ui/accordion.tsx`          | Pending | Base UI accordion                               |
| Carousel     | `components/ui/carousel.tsx`           | Pending | embla-carousel                                  |
| Aspect Ratio | `components/ui/aspect-ratio.tsx`       | Pending | Pure CSS                                        |
| Table (HTML) | `components/ui/table.tsx`              | Pending | Styled HTML table                               |

## Shell

| Component       | Source file                            | Status  | Notes                                                     |
| --------------- | -------------------------------------- | ------- | --------------------------------------------------------- |
| Sidebar         | `components/ui/sidebar.tsx`            | Done    | `src/shell/sidebar.tsx` — full composition with Provider  |
| ShellContent    | `shell/ShellLayout.tsx`                | Done    | `src/shell/shell-content.tsx` — Header + Main             |
| PageContainer   | —                                      | Done    | `src/shell/page-container.tsx`                            |
| Breadcrumb      | `components/ui/breadcrumb.tsx`         | Done    | `src/shell/breadcrumb.tsx`                                |
| Topbar          | `shell/ShellLayout.tsx`                | Done    | Implemented as `ShellContent.Header`                      |
| Navigation      | `shell/app-sidebar/NavMain.tsx`        | Done    | Handled by `Sidebar.Menu` + `Sidebar.MenuButton` + Groups |
| Command Palette | `shell/CommandPalette.tsx`             | Done    | Covered by `Command` overlay + `Dialog` wrapper           |
| ModuleSwitcher  | `shell/app-sidebar/ModuleSwitcher.tsx` | Skipped | App-level composition (DropdownMenu + Sidebar.MenuButton) |
| NavUser         | `shell/app-sidebar/NavUser.tsx`        | Skipped | App-level composition (DropdownMenu + Avatar)             |
| Navigation Menu | `components/ui/navigation-menu.tsx`    | Pending | Base UI navigation-menu                                   |
| Menubar         | `components/ui/menubar.tsx`            | Pending | Base UI menubar                                           |
| Pagination      | `components/ui/pagination.tsx`         | Pending | Button + nav composition                                  |

## Data

| Component              | Source file                                                      | Status  | Notes                         |
| ---------------------- | ---------------------------------------------------------------- | ------- | ----------------------------- |
| DataTable              | `widgets/components/TableWidget.tsx`                             | Pending | TanStack Table                |
| Datagrid               | `widgets/components/datagrid/DatagridWidget.tsx`                 | Pending | TanStack Table + Virtual      |
| TableToolbar           | `widgets/components/table/TableToolbar.tsx`                      | Pending | Part of DataTable composition |
| TablePagination        | `widgets/components/table/TablePagination.tsx`                   | Pending | Part of DataTable composition |
| CellRenderers          | `widgets/components/table/CellRenderers.tsx`                     | Pending | Part of DataTable             |
| DatagridToolbar        | `widgets/components/datagrid/grid/DatagridToolbar.tsx`           | Pending | Part of Datagrid composition  |
| DatagridHeader         | `widgets/components/datagrid/grid/DatagridHeader.tsx`            | Pending | Part of Datagrid composition  |
| DatagridBody           | `widgets/components/datagrid/grid/DatagridBody.tsx`              | Pending | Part of Datagrid composition  |
| ColumnResizeHandle     | `widgets/components/datagrid/columns/ColumnResizeHandle.tsx`     | Pending | Part of Datagrid              |
| ColumnVisibilityToggle | `widgets/components/datagrid/columns/ColumnVisibilityToggle.tsx` | Pending | Part of Datagrid              |
| TextEditor             | `widgets/components/datagrid/editors/TextEditor.tsx`             | Pending | Cell editor                   |
| NumberEditor           | `widgets/components/datagrid/editors/NumberEditor.tsx`           | Pending | Cell editor                   |
| CheckboxEditor         | `widgets/components/datagrid/editors/CheckboxEditor.tsx`         | Pending | Cell editor                   |
| DateEditor             | `widgets/components/datagrid/editors/DateEditor.tsx`             | Pending | Cell editor                   |
| DatetimeEditor         | `widgets/components/datagrid/editors/DatetimeEditor.tsx`         | Pending | Cell editor                   |
| ComboboxEditor         | `widgets/components/datagrid/editors/ComboboxEditor.tsx`         | Pending | Cell editor                   |
| EnumEditor             | `widgets/components/datagrid/editors/EnumEditor.tsx`             | Pending | Cell editor                   |
| MoneyEditor            | `widgets/components/datagrid/editors/MoneyEditor.tsx`            | Pending | Cell editor                   |

## Overlays

| Component     | Source file                                           | Status  | Notes                                              |
| ------------- | ----------------------------------------------------- | ------- | -------------------------------------------------- |
| Dialog        | `components/ui/dialog.tsx`                            | Done    | `src/overlays/dialog.tsx`                          |
| Sheet         | `components/ui/drawer.tsx`, `components/ui/sheet.tsx` | Done    | `src/overlays/sheet.tsx` — Base UI Drawer          |
| Popover       | `components/ui/popover.tsx`                           | Done    | `src/overlays/popover.tsx`                         |
| Dropdown Menu | `components/ui/dropdown-menu.tsx`                     | Done    | `src/overlays/dropdown-menu.tsx`                   |
| Context Menu  | `components/ui/context-menu.tsx`                      | Done    | `src/overlays/context-menu.tsx`                    |
| Command       | `components/ui/command.tsx`                           | Done    | `src/overlays/command.tsx` — custom implementation |
| Tooltip       | `components/ui/tooltip.tsx`                           | Done    | `src/primitives/tooltip.tsx` (in primitives layer) |
| ConfirmDialog | `shell/ConfirmDialog.tsx`                             | Done    | `src/feedback/confirm-dialog.tsx`                  |
| Alert Dialog  | `components/ui/alert-dialog.tsx`                      | Skipped | Covered by ConfirmDialog                           |
| Hover Card    | `components/ui/hover-card.tsx`                        | Pending | Base UI preview-card                               |

## Feedback

| Component     | Source file                 | Status | Notes                             |
| ------------- | --------------------------- | ------ | --------------------------------- |
| Alert         | `components/ui/alert.tsx`   | Done   | `src/feedback/alert.tsx`          |
| Toast         | `shell/Toast.tsx`           | Done   | `src/feedback/toast.tsx`          |
| ConfirmDialog | `shell/ConfirmDialog.tsx`   | Done   | `src/feedback/confirm-dialog.tsx` |
| Spinner       | `components/ui/spinner.tsx` | Done   | `src/feedback/spinner.tsx`        |
| Empty         | `components/ui/empty.tsx`   | Done   | `src/feedback/empty.tsx`          |

## Form

| Component      | Source file                     | Status  | Notes                                                                    |
| -------------- | ------------------------------- | ------- | ------------------------------------------------------------------------ |
| Field          | `components/ui/field.tsx`       | Done    | `src/form/field.tsx` — label, description, error                         |
| DatePicker     | —                               | Done    | `src/form/date-picker.tsx`                                               |
| DateTimePicker | —                               | Done    | `src/form/date-time-picker.tsx`                                          |
| MoneyInput     | —                               | Done    | `src/form/money-input.tsx`                                               |
| InputGroup     | `components/ui/input-group.tsx` | Done    | `src/form/input-group.tsx` — Addon/Text/Input                            |
| FormField      | —                               | Skipped | Already covered by `Field` (Field.Label, Field.Description, Field.Error) |

## Tokens

| File           | Status  | Notes                           |
| -------------- | ------- | ------------------------------- |
| index.css      | Pending | Imports all token files         |
| colors.css     | Pending | Semantic color tokens (OKLch)   |
| spacing.css    | Pending | Spacing scale (xs–2xl)          |
| typography.css | Pending | Font family, sizes, weights     |
| animations.css | Pending | Keyframes and transition tokens |

---

## Summary

| Layer      | Done   | Pending | Skipped |
| ---------- | ------ | ------- | ------- |
| Primitives | 21     | 0       | 4       |
| Layout     | 11     | 4       | 1       |
| Shell      | 7      | 3       | 2       |
| Overlays   | 7      | 1       | 1       |
| Feedback   | 3      | 2       | 0       |
| Form       | 4      | 2       | 0       |
| Data       | 0      | 18      | 0       |
| Tokens     | 0      | 5       | 0       |
| **Total**  | **53** | **35**  | **8**   |

---

## Priority for Remaining Work

1. **Feedback** — Spinner, Empty (small, quick wins)
2. **Form** — InputGroup, FormField (needed by widget migration)
3. **Tokens** — colors.css, spacing.css, typography.css, animations.css (design pass)
4. **Data** — DataTable, Datagrid, Cell Editors (most complex, do last)
5. **Layout** — Accordion, Carousel, Aspect Ratio, Table (nice to have)
6. **Shell** — Navigation Menu, Menubar, Pagination (low priority)
7. **Overlays** — Hover Card (low priority)
