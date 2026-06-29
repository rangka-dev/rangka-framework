import type { ComponentType } from 'react';
import type { WidgetProps } from '../types.js';
import { DataController } from './DataController.js';
import { FormController } from './FormController.js';
import { TableController } from './TableController.js';
import { RepeatController } from './RepeatController.js';
import { DatagridController } from './DatagridController.js';
import { ModalController } from './ModalController.js';
import { DrawerController } from './DrawerController.js';

export const widgetControllers: Record<string, ComponentType<WidgetProps>> = {
  data: DataController,
  form: FormController,
  table: TableController,
  repeat: RepeatController,
  datagrid: DatagridController,
  modal: ModalController,
  drawer: DrawerController,
};
