import { forwardRef, type ComponentProps } from 'react';
import { icons } from 'lucide-react';
import { cn } from '../lib/cn';

export type DynamicIconProps = Omit<ComponentProps<'svg'>, 'ref'> & {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

const sizeMap = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

export const DynamicIcon = forwardRef<SVGSVGElement, DynamicIconProps>(
  ({ name, size = 'sm', className, ...props }, ref) => {
    const pascalName = name
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    const LucideIcon = icons[pascalName as keyof typeof icons];
    if (!LucideIcon) return null;

    return (
      <LucideIcon
        className={cn('inline-flex shrink-0', sizeMap[size], className)}
        ref={ref}
        {...props}
      />
    );
  },
);

DynamicIcon.displayName = 'DynamicIcon';
