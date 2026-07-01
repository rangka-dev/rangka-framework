import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Tabs, tabsListVariants, tabsTriggerVariants } from '../tabs';

describe('Tabs API surface', () => {
  it('exports Tabs component and variants', () => {
    expect(Tabs).toBeDefined();
    expect(tabsListVariants).toBeDefined();
    expect(tabsTriggerVariants).toBeDefined();
  });

  it('has sub-components', () => {
    expect(Tabs.List).toBeDefined();
    expect(Tabs.Trigger).toBeDefined();
    expect(Tabs.Content).toBeDefined();
  });

  it('forwards ref on root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tabs ref={ref} defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">Tab A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content A</Tabs.Content>
      </Tabs>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders trigger and content', () => {
    const { getByText } = render(
      <Tabs defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">First</Tabs.Trigger>
          <Tabs.Trigger value="two">Second</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Content One</Tabs.Content>
        <Tabs.Content value="two">Content Two</Tabs.Content>
      </Tabs>,
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Content One')).toBeTruthy();
  });

  it('accepts size variant on list and trigger', () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <Tabs.List size="sm">
          <Tabs.Trigger value="a" size="sm">
            Small
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content</Tabs.Content>
      </Tabs>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
