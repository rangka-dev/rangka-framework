import type { LoginScreenProps } from '@rangka/shared';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export type LoginScreenRootProps = ComponentProps<'div'> & LoginScreenProps;

export const LoginScreen = forwardRef<HTMLDivElement, LoginScreenRootProps>(
  ({ className, logo, appName, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex min-h-screen w-full items-center justify-center bg-background p-4',
          className,
        )}
        {...props}
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          {(logo || appName) && (
            <div className="flex flex-col items-center gap-2">
              {logo}
              {appName && <h1 className="text-xl font-semibold text-foreground">{appName}</h1>}
            </div>
          )}
          <div className="w-full">{children}</div>
        </div>
      </div>
    );
  },
);

LoginScreen.displayName = 'LoginScreen';
