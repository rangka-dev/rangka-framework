---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: Mental model bridge for Excel and spreadsheet users
---

# Coming from Excel

If you build spreadsheets for your business, you already understand how Rangka works. The concepts map directly. This page translates what you know into Rangka terms.

## The core idea is the same

In Excel, you put data in cells, write formulas that reference other cells, and everything updates automatically when you change a value. You never manually recalculate. You declare relationships and the system maintains them.

Rangka works the same way. You declare what data to show, how to show it, and what happens when someone interacts. The framework keeps everything in sync.

## Concept mapping

| Excel                      | Rangka                                    | What it does                             |
| -------------------------- | ----------------------------------------- | ---------------------------------------- |
| Cell with a value          | Widget with a field binding               | Displays a piece of data                 |
| Formula (`=A1*B1`)         | Expression (`{{qty * rate}}`)             | Computes a value from other values       |
| Cell reference (`A1`)      | Field binding (`bind: { field: 'name' }`) | Points to where the data lives           |
| Named range                | `$state.selectedId`                       | A named value you can reference anywhere |
| Data validation (dropdown) | Input widget with field metadata          | Restricts what can be entered            |
| Conditional formatting     | `visible` condition                       | Shows or hides content based on a value  |
| Worksheet                  | Page                                      | One screen of your application           |
| Table (structured range)   | Table widget                              | Rows of records with columns             |
| Filter button on a table   | `$filter` reactive variable               | Narrows which rows appear                |
| Sort button on a table     | `$sort` reactive variable                 | Changes row order                        |
| VBA button macro           | Button widget with an action              | Does something when clicked              |

## How formulas become expressions

Excel formula:

```
=IF(B2="Draft", "Pending", UPPER(B2))
```

Rangka expression:

```
{{if(status == 'draft', 'Pending', upper(status))}}
```

Excel formula:

```
=SUM(D2:D10)
```

Rangka expression:

```
{{sum(items.amount)}}
```

The syntax is different but the idea is identical. You reference fields by name instead of cell addresses. The system evaluates the expression and updates the result when inputs change.

## How sheets become pages

In Excel, you organize related data into worksheets. Each worksheet shows a different view of your data. You might have an "Orders" sheet, a "Customers" sheet, and a "Dashboard" sheet.

In Rangka, each of those is a page. A page shows data from your models (like tables in a database) arranged with widgets.

```
Excel workbook           →  Rangka application
├── Orders sheet         →  ├── Orders page (table of orders)
├── Customers sheet      →  ├── Customers page (table of customers)
└── Dashboard sheet      →  └── Dashboard page (summary numbers)
```

## How filtering works

In Excel, you click the filter arrow on a column header and pick values. The rows that do not match disappear.

In Rangka, you set a filter variable. The table reacts by showing only matching rows.

```typescript
// Like clicking the Status filter and selecting "Draft"
$filter.sales.order.status = 'draft';

// Like setting a number filter "greater than 1000"
$filter.sales.order.total__gt = 1000;

// Like clearing all filters
$filter.sales.order.status = null;
```

The table watches these variables and re-queries automatically. No refresh button needed.

## How buttons work

In Excel with VBA, you create a button and assign a macro. The macro runs code that changes cells, shows messages, or interacts with other systems.

In Rangka, you create a button widget and wire it to an action. The action is not code you write. It is a declaration of what should happen.

```typescript
// Excel: Button → macro that sets status to "Submitted"
// Rangka: Button → action that updates the record
{ type: 'button', props: { label: 'Submit Order' },
  on: { click: { type: 'model.update', data: { status: 'Submitted' } } } }
```

## The key difference

In Excel, you are both the builder and the user. You design the sheet and you use it.

In Rangka, you design the application once and many users use it. The framework handles multiple users, permissions (who can see what), data storage, and concurrent access. Your declarations become a multi-user application without you managing any of that complexity.

## What you do not need to know

- Programming languages (TypeScript is used but page definitions are structured data)
- How databases work (the framework manages storage)
- How web browsers render pages (the framework handles all of that)
- How to build forms or tables (declare what fields to show, the framework renders them)
