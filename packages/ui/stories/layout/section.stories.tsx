import type { Meta, StoryObj } from '@storybook/react';
import { Section } from '../../src/layout/section';

const meta: Meta = {
  title: 'Layout/Section',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Section label="Details">
      <p>Section content goes here.</p>
    </Section>
  ),
};

export const Collapsible: StoryObj = {
  render: () => (
    <Section label="Advanced Settings" collapsible>
      <p>This content can be collapsed.</p>
    </Section>
  ),
};

export const CollapsedByDefault: StoryObj = {
  render: () => (
    <Section label="Hidden Details" collapsible defaultCollapsed>
      <p>This content is initially hidden.</p>
    </Section>
  ),
};

export const WithPadding: StoryObj = {
  render: () => (
    <Section label="Padded Section" padding="lg">
      <p>Content with large padding.</p>
    </Section>
  ),
};
