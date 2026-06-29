import type { ComponentType } from 'react';
import type { WidgetProps, WidgetNode } from '@rangka/shared';

export type WidgetComponentProps = WidgetProps;
export type WidgetBind = WidgetProps['bind'];
export type WidgetContext = WidgetProps['context'];
export type WidgetBindMeta = NonNullable<WidgetProps['bind']['meta']>;
export type FieldType = WidgetBindMeta['type'];
export type { WidgetNode };

export type WidgetComponent = ComponentType<WidgetComponentProps>;
export type WidgetRegistry = Record<string, WidgetComponent>;
