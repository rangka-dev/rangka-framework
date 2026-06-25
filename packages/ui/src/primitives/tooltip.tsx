import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { forwardRef, type ComponentProps, type ReactNode, Children, isValidElement } from 'react';

export type TooltipProps = {
  /** Simple string content for the tooltip */
  content?: string;
  /** Delay before showing in milliseconds */
  delayDuration?: number;
  children?: ReactNode;
};

export type TooltipTriggerProps = ComponentProps<'button'>;

export type TooltipContentProps = ComponentProps<'div'>;

export type TooltipArrowProps = ComponentProps<'div'>;

const hasContentChild = (children: ReactNode): boolean => {
  let found = false;
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TooltipContent) {
      found = true;
    }
  });
  return found;
};

const TooltipRoot = ({ content, delayDuration: _delayDuration, children }: TooltipProps) => {
  const hasCustomContent = hasContentChild(children);

  if (content && !hasCustomContent) {
    return (
      <BaseTooltip.Root>
        {children}
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner>
            <BaseTooltip.Popup>{content}</BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    );
  }

  return <BaseTooltip.Root>{children}</BaseTooltip.Root>;
};

const TooltipTrigger = forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseTooltip.Trigger
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        delay={0}
        {...props}
      >
        {children}
      </BaseTooltip.Trigger>
    );
  },
);
TooltipTrigger.displayName = 'Tooltip.Trigger';

const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner>
          <BaseTooltip.Popup
            ref={ref}
            className={typeof className === 'string' ? className : undefined}
            {...props}
          >
            {children}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    );
  },
);
TooltipContent.displayName = 'Tooltip.Content';

const TooltipArrow = forwardRef<HTMLDivElement, TooltipArrowProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseTooltip.Arrow
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
TooltipArrow.displayName = 'Tooltip.Arrow';

export const Tooltip = Object.assign(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Arrow: TooltipArrow,
});
