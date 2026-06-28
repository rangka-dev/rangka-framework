import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../../src/feedback/alert';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  render: () => (
    <Alert variant="info">
      <Alert.Icon />
      <div className="flex flex-col gap-1">
        <Alert.Title>Information</Alert.Title>
        <Alert.Description>This is an informational message.</Alert.Description>
      </div>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert variant="success">
      <Alert.Icon />
      <div className="flex flex-col gap-1">
        <Alert.Title>Success</Alert.Title>
        <Alert.Description>Operation completed successfully.</Alert.Description>
      </div>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant="warning">
      <Alert.Icon />
      <div className="flex flex-col gap-1">
        <Alert.Title>Warning</Alert.Title>
        <Alert.Description>Please review before continuing.</Alert.Description>
      </div>
    </Alert>
  ),
};

export const Error: Story = {
  render: () => (
    <Alert variant="error">
      <Alert.Icon />
      <div className="flex flex-col gap-1">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>Something went wrong. Please try again.</Alert.Description>
      </div>
    </Alert>
  ),
};

export const WithDismiss: Story = {
  render: () => (
    <Alert variant="info">
      <Alert.Icon />
      <div className="flex flex-col gap-1">
        <Alert.Title>Dismissible</Alert.Title>
        <Alert.Description>Click the X to dismiss this alert.</Alert.Description>
      </div>
      <Alert.Dismiss onClick={() => console.log('dismissed')} />
    </Alert>
  ),
};

export const DescriptionOnly: Story = {
  render: () => (
    <Alert variant="info">
      <Alert.Icon />
      <Alert.Description>A simple alert with no title.</Alert.Description>
    </Alert>
  ),
};
