import { ScrollArea } from '../../layout/scroll-area';
import type { WidgetComponentProps } from '../types';

export function ScrollAreaWidget({ props, children }: WidgetComponentProps) {
  const height = (props.height as string) ?? '300px';
  const maxHeight = props.maxHeight as string | undefined;

  return (
    <div style={{ height, maxHeight }}>
      <ScrollArea>
        <ScrollArea.Viewport>{children}</ScrollArea.Viewport>
        <ScrollArea.Scrollbar>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea>
    </div>
  );
}

ScrollAreaWidget.displayName = 'ScrollAreaWidget';
