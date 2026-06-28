import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { forwardRef, type ComponentProps } from 'react';

export type ScrollAreaProps = ComponentProps<'div'>;

export type ScrollAreaViewportProps = ComponentProps<'div'>;

export type ScrollAreaScrollbarProps = ComponentProps<'div'> & {
  /** The scrollbar axis */
  orientation?: 'vertical' | 'horizontal';
};

export type ScrollAreaThumbProps = ComponentProps<'div'>;

const ScrollAreaRoot = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseScrollArea.Root
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
ScrollAreaRoot.displayName = 'ScrollArea';

const ScrollAreaViewport = forwardRef<HTMLDivElement, ScrollAreaViewportProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseScrollArea.Viewport
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
ScrollAreaViewport.displayName = 'ScrollArea.Viewport';

const ScrollAreaScrollbar = forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <BaseScrollArea.Scrollbar
        ref={ref}
        orientation={orientation}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
ScrollAreaScrollbar.displayName = 'ScrollArea.Scrollbar';

const ScrollAreaThumb = forwardRef<HTMLDivElement, ScrollAreaThumbProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseScrollArea.Thumb
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
ScrollAreaThumb.displayName = 'ScrollArea.Thumb';

export const ScrollArea = Object.assign(ScrollAreaRoot, {
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
});
