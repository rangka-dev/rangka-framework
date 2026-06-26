import { Slider as BaseSlider } from '@base-ui/react/slider';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type SliderProps = ComponentProps<'div'> & {
  /** The controlled value */
  value?: number | readonly number[];
  /** The default value (uncontrolled) */
  defaultValue?: number | readonly number[];
  /** Callback fired when value changes */
  onValueChange?: (value: number, eventDetails: unknown) => void;
  /** Callback fired when value change is committed */
  onValueCommitted?: (value: number, eventDetails: unknown) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Orientation of the slider */
  orientation?: 'horizontal' | 'vertical';
};

export type SliderTrackProps = ComponentProps<'div'>;

export type SliderIndicatorProps = ComponentProps<'div'>;

export type SliderThumbProps = ComponentProps<'div'>;

const Root = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      onValueCommitted,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      orientation = 'horizontal',
      ...props
    },
    ref,
  ) => (
    <BaseSlider.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange as never}
      onValueCommitted={onValueCommitted as never}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      orientation={orientation}
      className={cn(
        'relative flex touch-none select-none',
        orientation === 'horizontal' ? 'w-full items-center' : 'h-full flex-col items-center',
        className,
      )}
      {...props}
    />
  ),
);
Root.displayName = 'Slider';

const SliderTrack = forwardRef<HTMLDivElement, SliderTrackProps>(({ className, ...props }, ref) => (
  <BaseSlider.Track
    ref={ref}
    className={cn('relative w-full grow overflow-hidden rounded-full bg-muted', 'h-1.5', className)}
    {...props}
  />
));
SliderTrack.displayName = 'Slider.Track';

const SliderIndicator = forwardRef<HTMLDivElement, SliderIndicatorProps>(
  ({ className, ...props }, ref) => (
    <BaseSlider.Indicator
      ref={ref}
      className={cn('absolute h-full bg-primary', className)}
      {...props}
    />
  ),
);
SliderIndicator.displayName = 'Slider.Indicator';

const Thumb = forwardRef<HTMLDivElement, SliderThumbProps>(({ className, ...props }, ref) => (
  <BaseSlider.Thumb
    ref={ref}
    className={cn(
      'block h-4 w-4 rounded-full border-2 border-primary bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Thumb.displayName = 'Slider.Thumb';

export const Slider = Object.assign(Root, {
  Track: SliderTrack,
  Indicator: SliderIndicator,
  Thumb,
});
