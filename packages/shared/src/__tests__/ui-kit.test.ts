import { describe, it, expectTypeOf } from 'vitest';
import type {
  UIKit,
  WidgetProps,
  WidgetComponentMap,
  ShellComponents,
  ShellLayoutProps,
  PageOutletProps,
  ToastProps,
  ConfirmDialogProps,
  ModuleSelectorProps,
} from '../types/ui-kit.js';
import type { ComponentType, ReactNode } from 'react';

describe('UIKit types API surface', () => {
  describe('UIKit interface', () => {
    it('has widgets and shell fields', () => {
      expectTypeOf<UIKit>().toHaveProperty('widgets');
      expectTypeOf<UIKit>().toHaveProperty('shell');
      expectTypeOf<UIKit['widgets']>().toEqualTypeOf<WidgetComponentMap>();
      expectTypeOf<UIKit['shell']>().toEqualTypeOf<ShellComponents>();
    });
  });

  describe('WidgetComponentMap', () => {
    it('is a record of string to ComponentType<WidgetProps>', () => {
      expectTypeOf<WidgetComponentMap>().toEqualTypeOf<
        Record<string, ComponentType<WidgetProps>>
      >();
    });
  });

  describe('WidgetProps', () => {
    it('has props, bind, on, context fields', () => {
      expectTypeOf<WidgetProps>().toHaveProperty('props');
      expectTypeOf<WidgetProps>().toHaveProperty('bind');
      expectTypeOf<WidgetProps>().toHaveProperty('on');
      expectTypeOf<WidgetProps>().toHaveProperty('context');
    });

    it('has optional childNodes and children', () => {
      expectTypeOf<WidgetProps['childNodes']>().toEqualTypeOf<WidgetProps['childNodes']>();
      expectTypeOf<WidgetProps['children']>().toEqualTypeOf<ReactNode | undefined>();
    });

    it('bind has value, optional setValue, meta, error, id', () => {
      expectTypeOf<WidgetProps['bind']['value']>().toBeUnknown();
      expectTypeOf<WidgetProps['bind']>().toHaveProperty('setValue');
      expectTypeOf<WidgetProps['bind']>().toHaveProperty('meta');
      expectTypeOf<WidgetProps['bind']>().toHaveProperty('error');
      expectTypeOf<WidgetProps['bind']>().toHaveProperty('id');
    });

    it('context has record, model, mode', () => {
      expectTypeOf<WidgetProps['context']['record']>().toEqualTypeOf<Record<string, unknown>>();
      expectTypeOf<WidgetProps['context']['model']>().toBeString();
      expectTypeOf<WidgetProps['context']['mode']>().toEqualTypeOf<'view' | 'edit'>();
    });
  });

  describe('ShellComponents', () => {
    it('has all required shell slots', () => {
      expectTypeOf<ShellComponents>().toHaveProperty('Layout');
      expectTypeOf<ShellComponents>().toHaveProperty('PageOutlet');
      expectTypeOf<ShellComponents>().toHaveProperty('Toast');
      expectTypeOf<ShellComponents>().toHaveProperty('ConfirmDialog');
      expectTypeOf<ShellComponents>().toHaveProperty('NotFound');
      expectTypeOf<ShellComponents>().toHaveProperty('ModuleSelector');
    });

    it('Layout accepts ShellLayoutProps', () => {
      expectTypeOf<ShellComponents['Layout']>().toEqualTypeOf<ComponentType<ShellLayoutProps>>();
    });

    it('PageOutlet accepts PageOutletProps', () => {
      expectTypeOf<ShellComponents['PageOutlet']>().toEqualTypeOf<ComponentType<PageOutletProps>>();
    });

    it('Toast accepts ToastProps', () => {
      expectTypeOf<ShellComponents['Toast']>().toEqualTypeOf<ComponentType<ToastProps>>();
    });

    it('ConfirmDialog accepts ConfirmDialogProps', () => {
      expectTypeOf<ShellComponents['ConfirmDialog']>().toEqualTypeOf<
        ComponentType<ConfirmDialogProps>
      >();
    });

    it('ModuleSelector accepts ModuleSelectorProps', () => {
      expectTypeOf<ShellComponents['ModuleSelector']>().toEqualTypeOf<
        ComponentType<ModuleSelectorProps>
      >();
    });
  });

  describe('ShellLayoutProps', () => {
    it('has all required fields', () => {
      expectTypeOf<ShellLayoutProps>().toHaveProperty('children');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('navigation');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('activeApp');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('breadcrumbs');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('currentPath');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('onNavigate');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('onAppSwitch');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('onAllApps');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('onLogout');
      expectTypeOf<ShellLayoutProps>().toHaveProperty('onSearch');
    });

    it('user is optional', () => {
      expectTypeOf<ShellLayoutProps['user']>().toEqualTypeOf<
        { id: string; name: string; email: string } | undefined
      >();
    });

    it('activeApp is nullable', () => {
      expectTypeOf<ShellLayoutProps['activeApp']>().toEqualTypeOf<string | null>();
    });
  });

  describe('ToastProps', () => {
    it('type is a union of severity levels', () => {
      expectTypeOf<ToastProps['type']>().toEqualTypeOf<'info' | 'success' | 'warning' | 'error'>();
    });
  });

  describe('ConfirmDialogProps', () => {
    it('has open, message, onConfirm, onCancel', () => {
      expectTypeOf<ConfirmDialogProps['open']>().toBeBoolean();
      expectTypeOf<ConfirmDialogProps['message']>().toBeString();
      expectTypeOf<ConfirmDialogProps>().toHaveProperty('onConfirm');
      expectTypeOf<ConfirmDialogProps>().toHaveProperty('onCancel');
    });

    it('title is optional', () => {
      expectTypeOf<ConfirmDialogProps['title']>().toEqualTypeOf<string | undefined>();
    });
  });
});
