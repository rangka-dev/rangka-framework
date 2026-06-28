import { Progress as BaseProgress } from '@base-ui/react/progress';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type ProgressProps = ComponentProps<'div'> & {
  /** The current value (null for indeterminate) */
  value?: number | null;
  /** The maximum value */
  max?: number;
};

export type ProgressTrackProps = ComponentProps<'div'>;

export type ProgressIndicatorProps = ComponentProps<'div'>;

const Root = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = null, max = 100, ...props }, ref) => (
    <BaseProgress.Root
      ref={ref}
      value={value}
      max={max}
      className={cn('relative', className)}
      {...props}
    />
  ),
);
Root.displayName = 'Progress';

const Track = forwardRef<HTMLDivElement, ProgressTrackProps>(({ className, ...props }, ref) => (
  <BaseProgress.Track
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    {...props}
  />
));
Track.displayName = 'Progress.Track';

const Indicator = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ className, ...props }, ref) => (
    <BaseProgress.Indicator
      ref={ref}
      className={cn('h-full bg-primary transition-all', className)}
      {...props}
    />
  ),
);
Indicator.displayName = 'Progress.Indicator';

export const Progress = Object.assign(Root, { Track, Indicator });
