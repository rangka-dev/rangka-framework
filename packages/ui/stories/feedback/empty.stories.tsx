import type { Meta, StoryObj } from '@storybook/react';
import { Empty } from '../../src/feedback/empty';
import { Button } from '../../src/primitives/button';

const meta: Meta = {
  title: 'Feedback/Empty',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Empty>
      <Empty.Header>
        <Empty.Media variant="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8V5c0-1 1-2 2-2h10c1 0 2 1 2 2v3" />
            <path d="M19 16v3c0 1-1 2-2 2H7c-1 0-2-1-2-2v-3" />
            <path d="M4 12h16" />
          </svg>
        </Empty.Media>
        <Empty.Title>No orders yet</Empty.Title>
        <Empty.Description>
          Create your first order to get started with sales tracking.
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="primary" size="sm">
          Create Order
        </Button>
      </Empty.Content>
    </Empty>
  ),
};

export const Simple: StoryObj = {
  render: () => (
    <Empty>
      <Empty.Header>
        <Empty.Title>No results found</Empty.Title>
        <Empty.Description>Try adjusting your search or filters.</Empty.Description>
      </Empty.Header>
    </Empty>
  ),
};
