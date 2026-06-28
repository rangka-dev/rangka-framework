import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '../../src/feedback/toast';

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = {
  render: () => (
    <Toast variant="info">
      <Toast.Icon />
      <Toast.Message>File uploaded successfully.</Toast.Message>
      <Toast.Dismiss />
    </Toast>
  ),
};

export const Success: Story = {
  render: () => (
    <Toast variant="success">
      <Toast.Icon />
      <Toast.Message>Changes saved.</Toast.Message>
      <Toast.Dismiss />
    </Toast>
  ),
};

export const Warning: Story = {
  render: () => (
    <Toast variant="warning">
      <Toast.Icon />
      <Toast.Message>Your session is about to expire.</Toast.Message>
      <Toast.Dismiss />
    </Toast>
  ),
};

export const Error: Story = {
  render: () => (
    <Toast variant="error">
      <Toast.Icon />
      <Toast.Message>Failed to save changes.</Toast.Message>
      <Toast.Dismiss />
    </Toast>
  ),
};

export const Container: Story = {
  render: () => (
    <Toast.Container position="bottom-right">
      <Toast variant="info">
        <Toast.Icon />
        <Toast.Message>First notification.</Toast.Message>
        <Toast.Dismiss />
      </Toast>
      <Toast variant="success">
        <Toast.Icon />
        <Toast.Message>Second notification.</Toast.Message>
        <Toast.Dismiss />
      </Toast>
      <Toast variant="error">
        <Toast.Icon />
        <Toast.Message>Third notification.</Toast.Message>
        <Toast.Dismiss />
      </Toast>
    </Toast.Container>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="relative h-64 w-full border border-dashed border-gray-300 rounded-md">
      <Toast.Container position="top-left">
        <Toast variant="info">
          <Toast.Icon />
          <Toast.Message>Top left</Toast.Message>
        </Toast>
      </Toast.Container>
      <Toast.Container position="top-right">
        <Toast variant="success">
          <Toast.Icon />
          <Toast.Message>Top right</Toast.Message>
        </Toast>
      </Toast.Container>
      <Toast.Container position="bottom-left">
        <Toast variant="warning">
          <Toast.Icon />
          <Toast.Message>Bottom left</Toast.Message>
        </Toast>
      </Toast.Container>
      <Toast.Container position="bottom-right">
        <Toast variant="error">
          <Toast.Icon />
          <Toast.Message>Bottom right</Toast.Message>
        </Toast>
      </Toast.Container>
    </div>
  ),
};
