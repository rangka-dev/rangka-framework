import { forwardRef, useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { useIsMobile } from './use-mobile';
import { ShellContext, type ShellContextValue } from './shell-context';

const SIDEBAR_DEFAULT_WIDTH = 250;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const RAIL_STORAGE_KEY = 'rangka-rail-docked';

export type ShellProviderProps = ComponentProps<'div'> & {
  /** Default sidebar expanded state */
  defaultSidebarOpen?: boolean;
  /** Controlled sidebar open state */
  sidebarOpen?: boolean;
  /** Called when sidebar open state changes */
  onSidebarOpenChange?: (open: boolean) => void;
  /** Default sidebar width in pixels */
  defaultSidebarWidth?: number;
  /** Default rail docked state */
  defaultRailDocked?: boolean;
};

export const ShellProvider = forwardRef<HTMLDivElement, ShellProviderProps>(
  (
    {
      defaultSidebarOpen = true,
      sidebarOpen: sidebarOpenProp,
      onSidebarOpenChange,
      defaultSidebarWidth = SIDEBAR_DEFAULT_WIDTH,
      defaultRailDocked,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [_sidebarOpen, _setSidebarOpen] = useState(defaultSidebarOpen);
    const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
    const [railDocked, setRailDockedState] = useState(() => {
      if (defaultRailDocked !== undefined) return defaultRailDocked;
      try {
        const stored = localStorage.getItem(RAIL_STORAGE_KEY);
        return stored !== null ? stored === 'true' : true;
      } catch {
        return true;
      }
    });

    const setRailDocked = useCallback((docked: boolean) => {
      setRailDockedState(docked);
      try {
        localStorage.setItem(RAIL_STORAGE_KEY, String(docked));
      } catch {
        /* localStorage unavailable */
      }
    }, []);

    const sidebarOpen = sidebarOpenProp ?? _sidebarOpen;

    const setSidebarOpen = useCallback(
      (value: boolean) => {
        if (onSidebarOpenChange) {
          onSidebarOpenChange(value);
        } else {
          _setSidebarOpen(value);
        }
      },
      [onSidebarOpenChange],
    );

    const toggleSidebar = useCallback(() => {
      if (isMobile) {
        setSidebarMobileOpen((o) => !o);
      } else {
        setSidebarOpen(!sidebarOpen);
      }
    }, [isMobile, setSidebarOpen, sidebarOpen]);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    const clampedWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, sidebarWidth));

    const contextValue = useMemo<ShellContextValue>(
      () => ({
        sidebarOpen,
        setSidebarOpen,
        sidebarWidth: clampedWidth,
        setSidebarWidth,
        sidebarMobileOpen,
        setSidebarMobileOpen,
        isMobile,
        toggleSidebar,
        railDocked,
        setRailDocked,
      }),
      [
        sidebarOpen,
        setSidebarOpen,
        clampedWidth,
        sidebarMobileOpen,
        isMobile,
        toggleSidebar,
        railDocked,
        setRailDocked,
      ],
    );

    return (
      <ShellContext.Provider value={contextValue}>
        <div
          ref={ref}
          data-slot="shell"
          style={
            {
              '--shell-sidebar-width': `${clampedWidth}px`,
              ...style,
            } as React.CSSProperties
          }
          className={cn('flex h-screen w-full flex-col overflow-hidden bg-canvas', className)}
          {...props}
        >
          {children}
        </div>
      </ShellContext.Provider>
    );
  },
);
ShellProvider.displayName = 'Shell';
