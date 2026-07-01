import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { ActivityFeed } from '../activity-feed';

describe('ActivityFeed API surface', () => {
  it('exports ActivityFeed with sub-components', () => {
    expect(ActivityFeed).toBeDefined();
    expect(ActivityFeed.Item).toBeDefined();
    expect(ActivityFeed.Avatar).toBeDefined();
    expect(ActivityFeed.Content).toBeDefined();
    expect(ActivityFeed.Header).toBeDefined();
    expect(ActivityFeed.Body).toBeDefined();
    expect(ActivityFeed.Diff).toBeDefined();
    expect(ActivityFeed.Empty).toBeDefined();
    expect(ActivityFeed.CommentInput).toBeDefined();
  });

  it('forwards ref on root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ActivityFeed ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders with showConnector prop', () => {
    const { container } = render(<ActivityFeed showConnector />);
    expect(container.querySelector('[aria-hidden]')).toBeTruthy();
  });

  it('renders Diff with from/to', () => {
    const { getByText } = render(<ActivityFeed.Diff from="Draft" to="Confirmed" />);
    expect(getByText('Draft')).toBeTruthy();
    expect(getByText('Confirmed')).toBeTruthy();
  });

  it('renders Header with timestamp', () => {
    const { getByText } = render(
      <ActivityFeed.Header timestamp="2 hours ago">
        <span>John Doe</span>
      </ActivityFeed.Header>,
    );
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('2 hours ago')).toBeTruthy();
  });

  it('renders empty state with default text', () => {
    const { getByText } = render(<ActivityFeed.Empty />);
    expect(getByText('No activity yet.')).toBeTruthy();
  });

  it('renders empty state with custom text', () => {
    const { getByText } = render(<ActivityFeed.Empty>Nothing here</ActivityFeed.Empty>);
    expect(getByText('Nothing here')).toBeTruthy();
  });
});
