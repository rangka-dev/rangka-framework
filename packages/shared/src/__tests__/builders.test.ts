import { describe, it, expect } from 'vitest';
import {
  input,
  text,
  button,
  badge,
  icon,
  group,
  section,
  table,
  column,
  divider,
  spacer,
  split,
  grid,
  data,
  repeat,
  drawer,
  modal,
  image,
  setValue,
  clearValue,
  setValues,
  service,
  navigate,
  fetchOptions,
  refreshSource,
  validate,
  addRow,
  removeRow,
  duplicateRow,
  sequence,
  conditional,
} from '../builders.js';
import {
  WidgetBuilder,
  PageBuilder,
  page,
  $input,
  $text,
  $button,
  $badge,
  $icon,
  $group,
  $section,
  $table,
  $column,
  $divider,
  $spacer,
  $image,
} from '../widget-builder.js';

describe('Builder Helpers — Widget Factories', () => {
  it('input creates field-bound widget', () => {
    const node = input('name');
    expect(node).toEqual({ type: 'input', bind: { field: 'name' } });
  });

  it('input with opts merges correctly', () => {
    const node = input('email', { props: { label: 'Email' } });
    expect(node.type).toBe('input');
    expect(node.bind).toEqual({ field: 'email' });
    expect(node.props).toEqual({ label: 'Email' });
  });

  it('text creates expression-bound widget', () => {
    const node = text('name');
    expect(node).toEqual({ type: 'text', bind: { expression: '{{name}}' } });
  });

  it('button creates widget with label prop', () => {
    const node = button('Save');
    expect(node.type).toBe('button');
    expect(node.props!.label).toBe('Save');
  });

  it('button with extra props', () => {
    const node = button('Delete', { props: { variant: 'danger', icon: 'trash' } });
    expect(node.props!.label).toBe('Delete');
    expect(node.props!.variant).toBe('danger');
    expect(node.props!.icon).toBe('trash');
  });

  it('badge creates field-bound widget', () => {
    const node = badge('status');
    expect(node).toEqual({ type: 'badge', bind: { field: 'status' } });
  });

  it('badge with colorMap', () => {
    const node = badge('status', { props: { colorMap: { draft: 'gray', active: 'green' } } });
    expect(node.props!.colorMap).toEqual({ draft: 'gray', active: 'green' });
  });

  it('icon creates widget with name prop', () => {
    const node = icon('settings');
    expect(node.type).toBe('icon');
    expect(node.props!.name).toBe('settings');
  });

  it('icon with extra props', () => {
    const node = icon('alert', { props: { size: 'lg', color: 'red' } });
    expect(node.props!.name).toBe('alert');
    expect(node.props!.size).toBe('lg');
  });

  it('group creates container with direction', () => {
    const children = [input('a'), input('b')];
    const node = group('row', children);
    expect(node.type).toBe('group');
    expect(node.props!.direction).toBe('row');
    expect(node.children).toHaveLength(2);
  });

  it('section creates labeled container', () => {
    const children = [input('name')];
    const node = section('Personal Info', children);
    expect(node.type).toBe('section');
    expect(node.props!.label).toBe('Personal Info');
    expect(node.children).toHaveLength(1);
  });

  it('table creates model-bound container', () => {
    const cols = [column('Name', [text('name')])];
    const node = table('sales.order', cols);
    expect(node.type).toBe('table');
    expect(node.bind!.model).toEqual({ name: 'sales.order' });
    expect(node.children).toHaveLength(1);
  });

  it('column creates labeled container', () => {
    const node = column('Amount', [text('amount')]);
    expect(node.type).toBe('column');
    expect(node.props!.label).toBe('Amount');
    expect(node.children).toHaveLength(1);
  });

  it('divider creates empty widget', () => {
    expect(divider()).toEqual({ type: 'divider' });
  });

  it('spacer creates empty widget', () => {
    expect(spacer()).toEqual({ type: 'spacer' });
  });

  it('composing complex layouts', () => {
    const node = group('column', [
      section('Header', [group('row', [text('title'), badge('status')])]),
      divider(),
      section('Details', [input('name'), input('email')]),
      spacer(),
      group('row', [
        button('Cancel', { props: { variant: 'ghost' } }),
        button('Save', { props: { variant: 'primary' } }),
      ]),
    ]);

    expect(node.type).toBe('group');
    expect(node.children).toHaveLength(5);
    expect(node.children![0].type).toBe('section');
    expect(node.children![1].type).toBe('divider');
    expect(node.children![2].children).toHaveLength(2);
    expect(node.children![4].children![1].props!.variant).toBe('primary');
  });
});

describe('Builder Helpers — Action Factories', () => {
  it('setValue produces correct action', () => {
    expect(setValue('name', 'John')).toEqual({ type: 'setValue', field: 'name', value: 'John' });
  });

  it('setValue with expression', () => {
    expect(setValue('total', '{{qty * rate}}')).toEqual({
      type: 'setValue',
      field: 'total',
      value: '{{qty * rate}}',
    });
  });

  it('setValue with $state target', () => {
    expect(setValue('$state.loading', true)).toEqual({
      type: 'setValue',
      field: '$state.loading',
      value: true,
    });
  });

  it('clearValue produces correct action', () => {
    expect(clearValue('name')).toEqual({ type: 'clearValue', field: 'name' });
  });

  it('setValues produces correct action', () => {
    const action = setValues({ '$state.step': 2, status: 'draft' });
    expect(action).toEqual({
      type: 'setValues',
      values: { '$state.step': 2, status: 'draft' },
    });
  });

  it('service produces correct action', () => {
    const action = service('approve', { orderId: '{{id}}' });
    expect(action).toEqual({
      type: 'service',
      name: 'approve',
      params: { orderId: '{{id}}' },
    });
  });

  it('service with onSuccess/onError', () => {
    const action = service(
      'save',
      { data: '{{$record}}' },
      {
        onSuccess: navigate('/list'),
        onError: setValue('$state.error', '{{$response.message}}'),
      },
    );
    expect(action.type).toBe('service');
    expect((action as any).onSuccess).toEqual({ type: 'navigate', path: '/list' });
    expect((action as any).onError.type).toBe('setValue');
  });

  it('navigate produces correct action', () => {
    expect(navigate('/orders/{{id}}')).toEqual({ type: 'navigate', path: '/orders/{{id}}' });
  });

  it('fetchOptions produces correct action', () => {
    expect(fetchOptions('contact_id', ['customer_id'])).toEqual({
      type: 'fetchOptions',
      field: 'contact_id',
      depends: ['customer_id'],
    });
  });

  it('refreshSource produces correct action', () => {
    expect(refreshSource()).toEqual({ type: 'refreshSource' });
  });

  it('validate produces correct action', () => {
    expect(validate()).toEqual({ type: 'validate', fields: undefined });
    expect(validate(['name', 'email'])).toEqual({ type: 'validate', fields: ['name', 'email'] });
  });

  it('addRow produces correct action', () => {
    expect(addRow('items')).toEqual({ type: 'addRow', field: 'items' });
  });

  it('removeRow produces correct action', () => {
    expect(removeRow('items')).toEqual({ type: 'removeRow', field: 'items' });
  });

  it('duplicateRow produces correct action', () => {
    expect(duplicateRow('items')).toEqual({ type: 'duplicateRow', field: 'items' });
  });

  it('sequence chains multiple actions', () => {
    const action = sequence(
      setValue('$state.saving', true),
      service('save', {}),
      setValue('$state.saving', false),
      navigate('/list'),
    );
    expect(action.type).toBe('sequence');
    expect((action as any).actions).toHaveLength(4);
  });

  it('conditional produces correct action', () => {
    const action = conditional(
      { field: 'status', operator: 'eq', value: 'draft' },
      navigate('/submit'),
      setValue('$state.error', 'Cannot submit'),
    );
    expect(action.type).toBe('conditional');
    expect((action as any).condition.field).toBe('status');
    expect((action as any).then.type).toBe('navigate');
    expect((action as any).else.type).toBe('setValue');
  });

  it('conditional without else', () => {
    const action = conditional({ field: 'total', operator: 'gt', value: 0 }, refreshSource());
    expect((action as any).else).toBeUndefined();
  });

  it('composing complex action sequences', () => {
    const action = sequence(
      setValue('$state.loading', true),
      conditional(
        { field: 'status', operator: 'eq', value: 'draft' },
        sequence(
          service('validate', { id: '{{id}}' }),
          service('submit', { id: '{{id}}' }),
          navigate('/orders/{{id}}'),
        ),
        setValue('$state.error', 'Only draft orders can be submitted'),
      ),
      setValue('$state.loading', false),
    );
    expect(action.type).toBe('sequence');
    expect((action as any).actions).toHaveLength(3);
    expect((action as any).actions[1].type).toBe('conditional');
    expect((action as any).actions[1].then.type).toBe('sequence');
  });
});

describe('Chainable Widget Builder', () => {
  it('$input produces correct JSON', () => {
    const node = $input('name').toJSON();
    expect(node).toEqual({ type: 'input', bind: { field: 'name' } });
  });

  it('$input with on trigger', () => {
    const node = $input('customer_id')
      .on('change', fetchOptions('contact_id', ['customer_id']))
      .toJSON();
    expect(node.type).toBe('input');
    expect(node.bind).toEqual({ field: 'customer_id' });
    expect(node.on!.change).toEqual({
      type: 'fetchOptions',
      field: 'contact_id',
      depends: ['customer_id'],
    });
  });

  it('$button with props, visible, and on', () => {
    const node = $button('Submit')
      .props({ variant: 'primary', icon: 'check' })
      .visible({ field: 'status', operator: 'eq', value: 'draft' })
      .on('click', service('sales.submitOrder'))
      .toJSON();

    expect(node.type).toBe('button');
    expect(node.props!.label).toBe('Submit');
    expect(node.props!.variant).toBe('primary');
    expect(node.visible).toEqual({ field: 'status', operator: 'eq', value: 'draft' });
    expect(node.on!.click).toEqual({ type: 'service', name: 'sales.submitOrder', params: {} });
  });

  it('$text with expression binding', () => {
    const node = $text('qty * rate').toJSON();
    expect(node).toEqual({ type: 'text', bind: { expression: '{{qty * rate}}' } });
  });

  it('$badge with field binding', () => {
    const node = $badge('status')
      .props({ colorMap: { active: 'green' } })
      .toJSON();
    expect(node.bind).toEqual({ field: 'status' });
    expect(node.props!.colorMap).toEqual({ active: 'green' });
  });

  it('$icon with props', () => {
    const node = $icon('settings').props({ size: 'lg' }).toJSON();
    expect(node.props!.name).toBe('settings');
    expect(node.props!.size).toBe('lg');
  });

  it('$group with children', () => {
    const node = $group('row')
      .children([$input('a'), $input('b')])
      .toJSON();
    expect(node.type).toBe('group');
    expect(node.props!.direction).toBe('row');
    expect(node.children).toHaveLength(2);
    expect(node.children![0].bind!.field).toBe('a');
  });

  it('$section with children', () => {
    const node = $section('Details')
      .props({ collapsible: true })
      .children([$input('name'), $input('email')])
      .toJSON();
    expect(node.props!.label).toBe('Details');
    expect(node.props!.collapsible).toBe(true);
    expect(node.children).toHaveLength(2);
  });

  it('$table with model binding and column children', () => {
    const node = $table('sales.order')
      .props({ selectable: true, bordered: true })
      .children([
        $column('Customer').children([$text('customer_name')]),
        $column('Total').children([$text('total')]),
      ])
      .toJSON();

    expect(node.type).toBe('table');
    expect(node.bind!.model).toEqual({ name: 'sales.order' });
    expect(node.props!.selectable).toBe(true);
    expect(node.children).toHaveLength(2);
    expect(node.children![0].props!.label).toBe('Customer');
  });

  it('$column with children', () => {
    const node = $column('Amount')
      .props({ align: 'right', width: '120px' })
      .children([$text('amount')])
      .toJSON();
    expect(node.props!.label).toBe('Amount');
    expect(node.props!.align).toBe('right');
    expect(node.children).toHaveLength(1);
  });

  it('$divider and $spacer', () => {
    expect($divider().toJSON()).toEqual({ type: 'divider' });
    expect($spacer().toJSON()).toEqual({ type: 'spacer' });
  });

  it('id method sets stable identifier', () => {
    const node = $button('Save').id('save-btn').toJSON();
    expect(node.id).toBe('save-btn');
  });

  it('bind method sets arbitrary binding', () => {
    const node = new WidgetBuilder('custom')
      .bind({ model: { name: 'test.model', filters: { active: true }, limit: 10 } })
      .toJSON();
    expect(node.bind!.model).toEqual({ name: 'test.model', filters: { active: true }, limit: 10 });
  });

  it('bindModel method', () => {
    const node = new WidgetBuilder('table')
      .bindModel('sales.order', { status: 'draft' }, 50)
      .toJSON();
    expect(node.bind!.model).toEqual({
      name: 'sales.order',
      filters: { status: 'draft' },
      limit: 50,
    });
  });

  it('multiple on calls accumulate triggers', () => {
    const node = $input('qty')
      .on('change', setValue('total', '{{qty * rate}}'))
      .on('focus', setValue('$state.editing', true))
      .on('blur', setValue('$state.editing', false))
      .toJSON();
    expect(Object.keys(node.on!)).toEqual(['change', 'focus', 'blur']);
  });

  it('visible with multiple conditions (AND)', () => {
    const node = $button('Approve')
      .visible([
        { field: 'status', operator: 'eq', value: 'draft' },
        { field: 'total', operator: 'gt', value: 0 },
      ])
      .toJSON();
    expect(Array.isArray(node.visible)).toBe(true);
    expect((node.visible as any[]).length).toBe(2);
  });

  it('chaining produces identical JSON to factory', () => {
    const fromFactory = table('sales.order', [
      column('Name', [text('name')]),
      column('Total', [text('total')]),
    ]);

    const fromBuilder = $table('sales.order')
      .children([
        $column('Name').children([$text('name')]),
        $column('Total').children([$text('total')]),
      ])
      .toJSON();

    expect(fromBuilder.type).toBe(fromFactory.type);
    expect(fromBuilder.bind).toEqual(fromFactory.bind);
    expect(fromBuilder.children!.length).toBe(fromFactory.children!.length);
    expect(fromBuilder.children![0].props!.label).toBe(fromFactory.children![0].props!.label);
  });

  it('deeply nested builder composition', () => {
    const page = $group('column')
      .children([
        $section('Order Details')
          .props({ collapsible: true })
          .children([
            $group('row').children([
              $input('customer_id').on('change', fetchOptions('contact_id', ['customer_id'])),
              $input('order_date'),
            ]),
            $table('sales.order_line')
              .props({ bordered: true })
              .children([
                $column('Product').children([$text('product_name')]),
                $column('Qty')
                  .props({ align: 'right' })
                  .children([$text('qty')]),
                $column('Rate')
                  .props({ align: 'right' })
                  .children([$text('rate')]),
                $column('Amount')
                  .props({ align: 'right' })
                  .children([$text('qty * rate')]),
              ]),
          ]),
        $group('row').children([
          $button('Cancel').props({ variant: 'ghost' }).on('click', navigate('/orders')),
          $button('Save')
            .props({ variant: 'primary' })
            .visible({ field: '$state.dirty', operator: 'eq', value: true })
            .on(
              'click',
              sequence(service('orders.save', { id: '{{id}}' }), navigate('/orders/{{id}}')),
            ),
        ]),
      ])
      .toJSON();

    expect(page.type).toBe('group');
    expect(page.children).toHaveLength(2);
    expect(page.children![0].type).toBe('section');
    expect(page.children![0].children![1].type).toBe('table');
    expect(page.children![0].children![1].children).toHaveLength(4);
    expect(page.children![1].children![1].visible).toBeDefined();
  });
});

describe('Builder Helpers — Layout Widget Factories', () => {
  it('split creates widget with sizes and children', () => {
    const children = [input('a'), input('b')];
    const node = split([60, 40], children);
    expect(node).toEqual({
      type: 'split',
      props: { sizes: [60, 40] },
      children,
    });
  });

  it('grid creates widget with columns and children', () => {
    const children = [input('a'), input('b'), input('c')];
    const node = grid(3, children);
    expect(node).toEqual({
      type: 'grid',
      props: { columns: 3 },
      children,
    });
  });

  it('data creates widget with source and children', () => {
    const children = [input('name')];
    const node = data('sales.customer', '123', children);
    expect(node).toEqual({
      type: 'data',
      source: { model: 'sales.customer', id: '123' },
      children,
    });
  });

  it('data with undefined id', () => {
    const children = [input('name')];
    const node = data('sales.customer', undefined, children);
    expect(node).toEqual({
      type: 'data',
      source: { model: 'sales.customer', id: undefined },
      children,
    });
  });

  it('repeat creates widget with children and options', () => {
    const children = [text('name')];
    const node = repeat(children, { layout: 'grid', columns: 3 });
    expect(node).toEqual({
      type: 'repeat',
      props: { layout: 'grid', columns: 3 },
      children,
    });
  });

  it('repeat without options', () => {
    const children = [text('name')];
    const node = repeat(children);
    expect(node).toEqual({
      type: 'repeat',
      props: undefined,
      children,
    });
  });

  it('drawer creates widget with children and options', () => {
    const children = [input('name')];
    const node = drawer(children, { width: 'lg', title: 'Edit Customer' });
    expect(node).toEqual({
      type: 'drawer',
      props: { width: 'lg', title: 'Edit Customer' },
      children,
    });
  });

  it('drawer without options', () => {
    const children = [input('name')];
    const node = drawer(children);
    expect(node).toEqual({
      type: 'drawer',
      props: undefined,
      children,
    });
  });

  it('modal creates widget with children and options', () => {
    const children = [input('name')];
    const node = modal(children, { size: 'lg', title: 'Confirm' });
    expect(node).toEqual({
      type: 'modal',
      props: { size: 'lg', title: 'Confirm' },
      children,
    });
  });

  it('modal without options', () => {
    const children = [input('name')];
    const node = modal(children);
    expect(node).toEqual({
      type: 'modal',
      props: undefined,
      children,
    });
  });

  it('image creates field-bound widget', () => {
    const node = image('avatar_url');
    expect(node).toEqual({ type: 'image', bind: { field: 'avatar_url' } });
  });

  it('image with extra opts', () => {
    const node = image('photo', { props: { width: 200, height: 200 } });
    expect(node.type).toBe('image');
    expect(node.bind).toEqual({ field: 'photo' });
    expect(node.props).toEqual({ width: 200, height: 200 });
  });
});

describe('Chainable Widget Builder — $image', () => {
  it('$image produces correct JSON', () => {
    const node = $image('avatar_url').toJSON();
    expect(node).toEqual({ type: 'image', bind: { field: 'avatar_url' } });
  });

  it('$image with props', () => {
    const node = $image('photo').props({ width: 100 }).toJSON();
    expect(node.type).toBe('image');
    expect(node.bind).toEqual({ field: 'photo' });
    expect(node.props).toEqual({ width: 100 });
  });
});

describe('Page Builder', () => {
  it('page() produces correct PageDefinition', () => {
    const def = page('customers', 'Customers', 'collection').toJSON();
    expect(def).toEqual({
      key: 'customers',
      label: 'Customers',
      type: 'collection',
      body: [],
    });
  });

  it('page() with path', () => {
    const def = page('dashboard', 'Dashboard', 'dashboard').path('/dashboard').toJSON();
    expect(def.path).toBe('/dashboard');
  });

  it('page() with actions', () => {
    const actions = [
      { type: 'button' as const, label: 'Create', action: 'create', variant: 'primary' as const },
    ];
    const def = page('orders', 'Orders', 'collection').actions(actions).toJSON();
    expect(def.actions).toEqual(actions);
  });

  it('page() body accepts raw WidgetNode objects', () => {
    const def = page('detail', 'Detail', 'record')
      .body([input('name'), text('status')])
      .toJSON();
    expect(def.body).toHaveLength(2);
    expect(def.body![0]).toEqual({ type: 'input', bind: { field: 'name' } });
    expect(def.body![1]).toEqual({ type: 'text', bind: { expression: '{{status}}' } });
  });

  it('page() body accepts WidgetBuilder instances and converts them', () => {
    const def = page('detail', 'Detail', 'record')
      .body([$input('name').props({ label: 'Name' }), $text('status')])
      .toJSON();
    expect(def.body).toHaveLength(2);
    expect(def.body![0].type).toBe('input');
    expect(def.body![0].bind).toEqual({ field: 'name' });
    expect(def.body![0].props).toEqual({ label: 'Name' });
    expect(def.body![1].type).toBe('text');
  });

  it('page() body accepts mixed WidgetNode and WidgetBuilder', () => {
    const def = page('mixed', 'Mixed', 'dashboard')
      .body([input('name'), $button('Save').props({ variant: 'primary' })])
      .toJSON();
    expect(def.body).toHaveLength(2);
    expect(def.body![0].type).toBe('input');
    expect(def.body![1].type).toBe('button');
    expect(def.body![1].props!.label).toBe('Save');
    expect(def.body![1].props!.variant).toBe('primary');
  });

  it('page() chaining all methods', () => {
    const def = page('orders', 'Orders', 'collection')
      .path('/sales/orders')
      .actions([{ type: 'button', label: 'New', action: 'create' }])
      .body([$group('column').children([$input('customer'), $input('date')])])
      .toJSON();

    expect(def.key).toBe('orders');
    expect(def.label).toBe('Orders');
    expect(def.type).toBe('collection');
    expect(def.path).toBe('/sales/orders');
    expect(def.actions).toHaveLength(1);
    expect(def.body).toHaveLength(1);
    expect(def.body![0].type).toBe('group');
    expect(def.body![0].children).toHaveLength(2);
  });

  it('PageBuilder is exported and constructable', () => {
    const builder = new PageBuilder('test', 'Test', 'dashboard');
    expect(builder.toJSON().key).toBe('test');
  });
});
