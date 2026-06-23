import { useMemo } from 'react';
import { useMeta } from '../context/MetaContext.js';
import { WidgetSlotRenderer } from '../widgets/shell/WidgetSlotRenderer.js';

export function PageOutlet({ pageKey }: { pageKey: string }) {
  const { pages } = useMeta();
  const page = useMemo(() => pages.find((p) => p.key === pageKey), [pages, pageKey]);

  if (!page) {
    return <div data-page-key={pageKey}>Page not found: {pageKey}</div>;
  }

  const isFull = page.layout === 'full';

  return (
    <div
      data-page-key={pageKey}
      className={`w-full h-full flex flex-col animate-page-enter ${isFull ? '' : 'px-6 py-4 gap-6'}`}
    >
      <WidgetSlotRenderer nodes={page.widgets} />
    </div>
  );
}
