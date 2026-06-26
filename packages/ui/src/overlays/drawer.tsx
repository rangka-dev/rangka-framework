import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';
import { Sheet } from './sheet';

// --- Drawer (Root) ---

export type DrawerProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

const DrawerRoot = ({ open, onOpenChange, children }: DrawerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    {children}
  </Sheet>
);
DrawerRoot.displayName = 'Drawer';

// --- Drawer.Content ---

export type DrawerContentProps = ComponentProps<'div'> & {
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
};

const widthClasses = {
  sm: 'w-80',
  md: 'w-[480px]',
  lg: 'w-[640px]',
};

const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, side = 'right', width = 'md', children, ...props }, ref) => (
    <Sheet.Content
      ref={ref}
      side={side}
      className={cn('flex flex-col p-0', widthClasses[width], className)}
      {...props}
    >
      {children}
    </Sheet.Content>
  ),
);
DrawerContent.displayName = 'Drawer.Content';

// --- Drawer.Header ---

export type DrawerHeaderProps = ComponentProps<'div'> & {
  onClose?: () => void;
};

const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ className, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-header"
      className={cn(
        'flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-5',
        className,
      )}
      {...props}
    >
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-6 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-foreground/6 hover:text-foreground"
          aria-label="Close"
        >
          <Icon icon={X} size="sm" />
        </button>
      )}
    </div>
  ),
);
DrawerHeader.displayName = 'Drawer.Header';

// --- Drawer.Title ---

export type DrawerTitleProps = ComponentProps<'h3'>;

const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="drawer-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  ),
);
DrawerTitle.displayName = 'Drawer.Title';

// --- Drawer.Body ---

export type DrawerBodyProps = ComponentProps<'div'>;

const DrawerBody = forwardRef<HTMLDivElement, DrawerBodyProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="drawer-body"
    className={cn('flex-1 overflow-auto px-5 py-4', className)}
    {...props}
  />
));
DrawerBody.displayName = 'Drawer.Body';

// --- Drawer.Footer ---

export type DrawerFooterProps = ComponentProps<'div'>;

const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-footer"
      className={cn(
        'flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle px-5 py-3',
        className,
      )}
      {...props}
    />
  ),
);
DrawerFooter.displayName = 'Drawer.Footer';

// --- Compose ---

export const Drawer = Object.assign(DrawerRoot, {
  Content: DrawerContent,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Body: DrawerBody,
  Footer: DrawerFooter,
});
