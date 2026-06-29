---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: Mental model bridge for jQuery and traditional ERP developers
---

# Coming from jQuery

If you have built ERP interfaces with jQuery (or Backbone, or vanilla JS with server-rendered HTML), Rangka will feel like a different world. This page maps what you know to how Rangka works.

## The fundamental shift

In jQuery you think in terms of the DOM. You select elements, attach event handlers, manipulate HTML, and manage state by reading from and writing to the page itself.

```javascript
// jQuery: find it, read it, change it
$('#status-badge').text(newStatus);
$('#submit-btn').prop('disabled', status !== 'Draft');
$('#order-table').DataTable().ajax.reload();
```

In Rangka you never touch the DOM. You describe the screen as a tree of widgets with data bindings. The framework renders and updates the DOM for you. Your job is to declare what should exist and what should happen.

```typescript
// Rangka: declare it, bind it, the framework handles the rest
{ type: 'badge', bind: { field: 'status' } }
{ type: 'button', props: { label: 'Submit', disabled: '{{status != "Draft"}}' },
  on: { click: { type: 'service', name: 'sales.submitOrder' } } }
{ type: 'table', source: { model: 'sales.order' }, children: [...] }
```

## Concept mapping

| jQuery pattern                 | Rangka equivalent                     | Key difference                                           |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------- |
| `$('#el').text(val)`           | `bind: { field: 'name' }`             | You bind once. Framework updates forever.                |
| `$('#el').on('click', fn)`     | `on: { click: action }`               | Action is data, not a callback function.                 |
| `$('#el').show()` / `.hide()`  | `visible: { field, operator, value }` | Visibility is reactive, not imperative.                  |
| `$.ajax()` + manual DOM update | `data` widget with `source`           | Fetching is automatic. No success callback needed.       |
| `$('#form').serialize()`       | `model.update` action                 | Framework knows the record. No manual serialization.     |
| DataTables plugin              | `table` widget                        | Built-in sorting, filtering, pagination. No plugin.      |
| `$('#el').append(html)`        | `repeat` widget                       | Looping is declarative. No HTML string building.         |
| Global variables for state     | `$state.key`                          | Reactive. Widgets auto-update when it changes.           |
| `$(document).trigger('event')` | `setValue` action                     | No custom events. State changes propagate automatically. |
| `location.href = url`          | `navigate` action                     | Framework handles routing.                               |

## The event handler problem

In jQuery the core pattern is: listen for an event, then imperatively update multiple parts of the page.

```javascript
$('#order-table').on('click', 'tr', function () {
  var id = $(this).data('id');

  // Update 5 different things manually
  $('#detail-panel').show();
  $('#detail-title').text($(this).find('.name').text());
  $('#status-badge')
    .removeClass()
    .addClass('badge-' + status);
  $('#submit-btn').prop('disabled', status !== 'Draft');
  loadOrderDetail(id); // another ajax call
});
```

In Rangka the same interaction is one action that sets one value. Everything else reacts.

```typescript
// One action
on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } }

// The drawer appears (reacts to $state.selectedId becoming non-empty)
// The title updates (bound to the fetched record's name field)
// The badge updates (bound to the fetched record's status field)
// The button state updates (expression references status)
// The detail loads (data widget reacts to $state.selectedId)
```

One state change. Five reactive updates. Zero manual DOM manipulation.

## No more "refresh"

In jQuery apps, after any mutation you manually reload data:

```javascript
function submitOrder(id) {
  $.post('/api/orders/' + id + '/submit', function () {
    $('#order-table').DataTable().ajax.reload(); // refresh table
    loadOrderDetail(id); // refresh detail
    showToast('Order submitted'); // show feedback
    updateSidebarCounts(); // refresh counts
  });
}
```

In Rangka, actions that change data automatically refresh affected sources:

```typescript
{ type: 'button', props: { label: 'Submit' },
  on: { click: { type: 'service', name: 'sales.submitOrder' } } }
```

When the service succeeds the framework refreshes all data sources that reference the affected model. The table updates. The detail updates. You do not manage this.

## No more state in the DOM

jQuery apps store state in the DOM: `data-` attributes, hidden inputs, class names, the text content of elements.

```javascript
var currentId = $('#detail-panel').data('record-id');
var isEditing = $('#form').hasClass('editing');
var filters = { status: $('#filter-status').val() };
```

This creates bugs. The DOM is mutable from anywhere. Two handlers can conflict. State gets out of sync.

In Rangka, state lives in the reactive store. Widgets render from it but never store state themselves.

```typescript
$state.selectedId; // which record is shown
$state.editing; // whether we're in edit mode
$filter.sales.order.status; // current filter
```

One source of truth. Widgets read from it. Actions write to it. No conflicts.

## Server-rendered pages vs widget trees

In a jQuery ERP the server renders HTML and sends it to the browser. jQuery enhances it with interactivity. Each page is a fresh HTML document.

```
Server renders HTML → Browser shows it → jQuery adds behavior
```

In Rangka the server sends data (JSON). The client renders widget trees from page definitions.

```
Server sends page definitions + data → Client renders widgets from the tree
```

This means:

- No full page reloads on navigation
- No server-side template language to learn
- No mixing HTML with business logic
- The same page definition drives both the rendered UI and a visual editor

## What you give up

- **Direct DOM control.** You cannot style elements imperatively. Style is handled by widget props and theming.
- **Progressive enhancement.** Rangka is a client-side app. No JS means no app.
- **Familiar plugins.** No DataTables, no Select2, no jQuery UI. Built-in widgets cover these use cases. For anything else, write a custom widget.
- **Server-rendered HTML.** Pages are client-rendered from JSON definitions.

## What you gain

- **No DOM bugs.** State cannot get out of sync with what is displayed.
- **No manual refresh.** Data updates propagate automatically.
- **No event soup.** One action, one state change, multiple reactive updates.
- **Less code.** A page that took 500 lines of jQuery is 30 lines of widget declarations.
- **Consistency.** Every screen works the same way.
