import { useMemo } from 'react';
import { useMeta } from '../context/MetaContext.js';
import { WidgetSlotRenderer } from '../widgets/shell/WidgetSlotRenderer.js';

export function PageOutlet({ pageKey }: { pageKey: string }) {
  const { pages } = useMeta();
  const page = useMemo(() => pages.find((p) => p.key === pageKey), [pages, pageKey]);

  if (!page) {
    return <div data-page-key={pageKey}>Page not found: {pageKey}</div>;
  }

  return (
    <div
      data-page-key={pageKey}
      className="w-full h-full px-6 py-4 flex flex-col gap-6 animate-page-enter"
    >
      <WidgetSlotRenderer nodes={page.body} />
    </div>
  );
}
