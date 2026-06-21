---
'@rangka/client': patch
'@rangka/shared': patch
---

feat: add datagrid widget with spreadsheet-like editing

New `datagrid` widget for `@rangka/client` providing an Airtable/NocoDB-style spreadsheet experience.

Features:

- Virtual scrolling with infinite loading (no pagination)
- Inline cell editing with field-type-aware editors (text, number, date, datetime, enum, combobox, money, checkbox)
- Column resizing, reordering (drag), and visibility toggle
- CSS Grid layout for consistent column alignment
- Keyboard navigation (arrows, tab, enter, escape, home/end, copy)
- Row selection with row-number-to-checkbox hover pattern
- Row creation (local temp row until required fields filled, then auto-persists)
- Row deletion with optimistic removal
- Multi-column sort (shift+click)
- Search and filter toolbar
- Auto-column derivation from model metadata
- Sort stability during editing (no row reorder on cell edit)
- Field type icons in column headers

Also adds `layout` field to `PageDefinition` (`'default' | 'full'`) for edge-to-edge pages.
