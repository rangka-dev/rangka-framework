import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '../../src/primitives/tabs';

const meta: Meta = {
  title: 'Primitives/Tabs',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="general">
      <Tabs.List>
        <Tabs.Trigger value="general">General</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        <Tabs.Trigger value="history">History</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="general">
        <p className="text-sm text-muted-foreground">General settings and preferences.</p>
      </Tabs.Content>
      <Tabs.Content value="settings">
        <p className="text-sm text-muted-foreground">Advanced configuration options.</p>
      </Tabs.Content>
      <Tabs.Content value="history">
        <p className="text-sm text-muted-foreground">Activity history and logs.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const SmallSize: Story = {
  name: 'Small Size',
  render: () => (
    <Tabs defaultValue="overview">
      <Tabs.List size="sm">
        <Tabs.Trigger value="overview" size="sm">
          Overview
        </Tabs.Trigger>
        <Tabs.Trigger value="details" size="sm">
          Details
        </Tabs.Trigger>
        <Tabs.Trigger value="notes" size="sm">
          Notes
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <p className="text-xs text-muted-foreground">Compact tab content.</p>
      </Tabs.Content>
      <Tabs.Content value="details">
        <p className="text-xs text-muted-foreground">Detail information.</p>
      </Tabs.Content>
      <Tabs.Content value="notes">
        <p className="text-xs text-muted-foreground">User notes.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  name: 'Disabled Tab',
  render: () => (
    <Tabs defaultValue="active">
      <Tabs.List>
        <Tabs.Trigger value="active">Active</Tabs.Trigger>
        <Tabs.Trigger value="disabled" disabled>
          Disabled
        </Tabs.Trigger>
        <Tabs.Trigger value="another">Another</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="active">
        <p className="text-sm text-muted-foreground">This tab is active.</p>
      </Tabs.Content>
      <Tabs.Content value="another">
        <p className="text-sm text-muted-foreground">Another panel.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  name: 'Many Tabs',
  render: () => (
    <Tabs defaultValue="tab-0">
      <Tabs.List>
        {Array.from({ length: 6 }, (_, i) => (
          <Tabs.Trigger key={i} value={`tab-${i}`}>
            Tab {i + 1}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {Array.from({ length: 6 }, (_, i) => (
        <Tabs.Content key={i} value={`tab-${i}`}>
          <p className="text-sm text-muted-foreground">Content for tab {i + 1}.</p>
        </Tabs.Content>
      ))}
    </Tabs>
  ),
};

export const InsideCard: Story = {
  name: 'Inside Card',
  render: () => (
    <div className="rounded-lg border border-border bg-card shadow-xs p-4 max-w-md">
      <Tabs defaultValue="info">
        <Tabs.List>
          <Tabs.Trigger value="info">Info</Tabs.Trigger>
          <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          <Tabs.Trigger value="attachments">Attachments</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="info">
          <p className="text-sm text-muted-foreground">Record information fields would go here.</p>
        </Tabs.Content>
        <Tabs.Content value="activity">
          <p className="text-sm text-muted-foreground">Activity timeline.</p>
        </Tabs.Content>
        <Tabs.Content value="attachments">
          <p className="text-sm text-muted-foreground">File attachments list.</p>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const NumericValues: Story = {
  name: 'Numeric Values',
  render: () => (
    <Tabs defaultValue={0}>
      <Tabs.List>
        <Tabs.Trigger value={0}>First</Tabs.Trigger>
        <Tabs.Trigger value={1}>Second</Tabs.Trigger>
        <Tabs.Trigger value={2}>Third</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value={0}>
        <p className="text-sm text-muted-foreground">Index-based tabs work too.</p>
      </Tabs.Content>
      <Tabs.Content value={1}>
        <p className="text-sm text-muted-foreground">Second panel.</p>
      </Tabs.Content>
      <Tabs.Content value={2}>
        <p className="text-sm text-muted-foreground">Third panel.</p>
      </Tabs.Content>
    </Tabs>
  ),
};
