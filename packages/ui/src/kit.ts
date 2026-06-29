import type { UIKit } from '@rangka/shared';
import { widgetComponents } from './widgets';
import { ShellLayout } from './shell/kit/ShellLayout';
import { PageOutlet } from './shell/kit/PageOutlet';
import { ShellToast } from './shell/kit/Toast';
import { ShellConfirmDialog } from './shell/kit/ConfirmDialog';
import { NotFound } from './shell/kit/NotFound';
import { ModuleSelector } from './shell/kit/ModuleSelector';

export const defaultKit: UIKit = {
  widgets: widgetComponents as UIKit['widgets'],
  shell: {
    Layout: ShellLayout,
    PageOutlet,
    Toast: ShellToast,
    ConfirmDialog: ShellConfirmDialog,
    NotFound,
    ModuleSelector,
  },
};
