import type { PageOutletProps } from '@rangka/shared';
import { PageContainer } from '../page-container';

export function PageOutlet({ pageKey, layout = 'default', children }: PageOutletProps) {
  return (
    <PageContainer layout={layout === 'full' ? 'full' : 'default'} data-page={pageKey}>
      {children}
    </PageContainer>
  );
}

PageOutlet.displayName = 'PageOutlet';
