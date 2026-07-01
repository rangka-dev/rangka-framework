import type { UIKit } from '@rangka/shared';
import { widgetComponents } from './widgets';
import { ShellLayout } from './shell/kit/ShellLayout';
import { LoginScreen } from './shell/kit/LoginScreen';
import { PageOutlet } from './shell/kit/PageOutlet';
import { ShellToast } from './shell/kit/Toast';
import { ShellConfirmDialog } from './shell/kit/ConfirmDialog';
import { NotFound } from './shell/kit/NotFound';

export const defaultKit: UIKit = {
  widgets: widgetComponents as UIKit['widgets'],
  shell: {
    Layout: ShellLayout,
    LoginScreen,
    PageOutlet,
    Toast: ShellToast,
    ConfirmDialog: ShellConfirmDialog,
    NotFound,
  },
};
