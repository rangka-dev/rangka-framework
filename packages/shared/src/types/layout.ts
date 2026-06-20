export type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type Alignment = 'start' | 'center' | 'end' | 'stretch';

export type Justification = 'start' | 'center' | 'end' | 'between' | 'around';

export type ScrollDirection = 'auto' | 'vertical' | 'horizontal';

export type Breakpoint = 'sm' | 'md' | 'lg';

export interface LayoutProps {
  flex?: number | string;
  span?: number;
  rowSpan?: number;
  align?: Alignment;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  scroll?: ScrollDirection;
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  margin?: SpacingToken;
  marginX?: SpacingToken;
  marginY?: SpacingToken;
  hidden?: Breakpoint;
}
