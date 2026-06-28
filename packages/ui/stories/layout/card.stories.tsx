import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../../src/layout/card';

const meta: Meta = {
  title: 'Layout/Card',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Card className="w-80">
      <Card.Header>
        <div>
          <Card.Title>Card Title</Card.Title>
          <Card.Description>Card description goes here</Card.Description>
        </div>
        <Card.Action>
          <button>Edit</button>
        </Card.Action>
      </Card.Header>
      <Card.Content>
        <p>This is the card content area.</p>
      </Card.Content>
      <Card.Footer>
        <button>Cancel</button>
        <button>Save</button>
      </Card.Footer>
    </Card>
  ),
};
