import type { LayoutProps, SpacingToken } from '@rangka/shared';

const LAYOUT_PROP_KEYS: readonly string[] = [
  'flex',
  'span',
  'rowSpan',
  'align',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'scroll',
  'padding',
  'paddingX',
  'paddingY',
  'margin',
  'marginX',
  'marginY',
  'hidden',
];

const SPACING_MAP: Record<SpacingToken, string> = {
  none: '0',
  xs: '1',
  sm: '2',
  md: '4',
  lg: '6',
  xl: '8',
  '2xl': '12',
};

function spacingClass(prefix: string, token: SpacingToken): string {
  return `${prefix}-${SPACING_MAP[token]}`;
}

export function extractLayoutProps(props: Record<string, unknown>): {
  layoutProps: LayoutProps;
  widgetProps: Record<string, unknown>;
} {
  const layoutProps: Record<string, unknown> = {};
  const widgetProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (LAYOUT_PROP_KEYS.includes(key)) {
      layoutProps[key] = value;
    } else {
      widgetProps[key] = value;
    }
  }

  return { layoutProps: layoutProps as LayoutProps, widgetProps };
}

export function hasLayoutProps(props: Record<string, unknown>): boolean {
  return Object.keys(props).some((key) => LAYOUT_PROP_KEYS.includes(key));
}

export function resolveLayoutClasses(layout: LayoutProps): string {
  const classes: string[] = [];

  // Flex
  if (layout.flex !== undefined) {
    if (layout.flex === 1) {
      classes.push('flex-1');
    } else if (typeof layout.flex === 'number') {
      classes.push(`flex-[${layout.flex}]`);
    } else if (typeof layout.flex === 'string') {
      classes.push(`flex-[${layout.flex.replace(/ /g, '_')}]`);
    }
  }

  // Grid span
  if (layout.span !== undefined) {
    classes.push(`col-span-${layout.span}`);
  }
  if (layout.rowSpan !== undefined) {
    classes.push(`row-span-${layout.rowSpan}`);
  }

  // Self-alignment
  if (layout.align) {
    const alignMap: Record<string, string> = {
      start: 'self-start',
      center: 'self-center',
      end: 'self-end',
      stretch: 'self-stretch',
    };
    classes.push(alignMap[layout.align] ?? '');
  }

  // Dimensions
  if (layout.width) {
    if (layout.width === '100%') classes.push('w-full');
    else if (layout.width === 'auto') classes.push('w-auto');
    else classes.push(`w-[${layout.width}]`);
  }
  if (layout.height) {
    if (layout.height === '100%') classes.push('h-full');
    else if (layout.height === 'auto') classes.push('h-auto');
    else classes.push(`h-[${layout.height}]`);
  }
  if (layout.minWidth) classes.push(`min-w-[${layout.minWidth}]`);
  if (layout.maxWidth) classes.push(`max-w-[${layout.maxWidth}]`);
  if (layout.minHeight) classes.push(`min-h-[${layout.minHeight}]`);
  if (layout.maxHeight) classes.push(`max-h-[${layout.maxHeight}]`);

  // Scroll
  if (layout.scroll) {
    const scrollMap: Record<string, string> = {
      auto: 'overflow-auto',
      vertical: 'overflow-y-auto',
      horizontal: 'overflow-x-auto',
    };
    classes.push(scrollMap[layout.scroll] ?? '');
  }

  // Padding
  if (layout.padding) classes.push(spacingClass('p', layout.padding));
  if (layout.paddingX) classes.push(spacingClass('px', layout.paddingX));
  if (layout.paddingY) classes.push(spacingClass('py', layout.paddingY));

  // Margin
  if (layout.margin) classes.push(spacingClass('m', layout.margin));
  if (layout.marginX) classes.push(spacingClass('mx', layout.marginX));
  if (layout.marginY) classes.push(spacingClass('my', layout.marginY));

  // Hidden
  if (layout.hidden) {
    classes.push(`${layout.hidden}:hidden`);
  }

  return classes.filter(Boolean).join(' ');
}
