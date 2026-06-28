import { forwardRef, type ComponentProps } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';

// --- Props Types ---

export type BreadcrumbProps = ComponentProps<'nav'>;
export type BreadcrumbListProps = ComponentProps<'ol'>;
export type BreadcrumbItemProps = ComponentProps<'li'>;
export type BreadcrumbLinkProps = ComponentProps<'a'> & { asChild?: boolean };
export type BreadcrumbPageProps = ComponentProps<'span'>;
export type BreadcrumbSeparatorProps = ComponentProps<'li'>;
export type BreadcrumbEllipsisProps = ComponentProps<'span'>;

// --- Components ---

const BreadcrumbRoot = forwardRef<HTMLElement, BreadcrumbProps>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    data-slot="breadcrumb"
    className={cn(className)}
    {...props}
  />
));
BreadcrumbRoot.displayName = 'Breadcrumb';

const BreadcrumbList = forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="breadcrumb-list"
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-xs wrap-break-word text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = 'Breadcrumb.List';

const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  ),
);
BreadcrumbItem.displayName = 'Breadcrumb.Item';

const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild: _asChild = false, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="breadcrumb-link"
      className={cn('transition-colors hover:text-foreground', className)}
      {...props}
    />
  ),
);
BreadcrumbLink.displayName = 'Breadcrumb.Link';

const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = 'Breadcrumb.Page';

const BreadcrumbSeparator = forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(
  ({ children, className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <Icon icon={ChevronRight} size="sm" />}
    </li>
  ),
);
BreadcrumbSeparator.displayName = 'Breadcrumb.Separator';

const BreadcrumbEllipsis = forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-5 items-center justify-center [&>svg]:size-4', className)}
      {...props}
    >
      <Icon icon={MoreHorizontal} size="sm" />
      <span className="sr-only">More</span>
    </span>
  ),
);
BreadcrumbEllipsis.displayName = 'Breadcrumb.Ellipsis';

// --- Composed Export ---

export const Breadcrumb = Object.assign(BreadcrumbRoot, {
  List: BreadcrumbList,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Page: BreadcrumbPage,
  Separator: BreadcrumbSeparator,
  Ellipsis: BreadcrumbEllipsis,
});
