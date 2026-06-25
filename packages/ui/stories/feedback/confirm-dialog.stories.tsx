import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmDialog } from '../../src/feedback/confirm-dialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Feedback/ConfirmDialog',
  component: ConfirmDialog,
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open dialog</button>
        <ConfirmDialog open={open} onOpenChange={setOpen}>
          <ConfirmDialog.Title>Confirm action</ConfirmDialog.Title>
          <ConfirmDialog.Description>Are you sure you want to proceed?</ConfirmDialog.Description>
          <ConfirmDialog.Actions>
            <ConfirmDialog.Cancel />
            <ConfirmDialog.Confirm />
          </ConfirmDialog.Actions>
        </ConfirmDialog>
      </>
    );
  },
};

export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button onClick={() => setOpen(true)}>Delete item</button>
        <ConfirmDialog open={open} onOpenChange={setOpen}>
          <ConfirmDialog.Title>Delete item?</ConfirmDialog.Title>
          <ConfirmDialog.Description>
            This action cannot be undone. The item will be permanently removed.
          </ConfirmDialog.Description>
          <ConfirmDialog.Actions>
            <ConfirmDialog.Cancel />
            <ConfirmDialog.Confirm destructive>Delete</ConfirmDialog.Confirm>
          </ConfirmDialog.Actions>
        </ConfirmDialog>
      </>
    );
  },
};

export const CustomLabels: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button onClick={() => setOpen(true)}>Archive</button>
        <ConfirmDialog open={open} onOpenChange={setOpen}>
          <ConfirmDialog.Title>Archive project?</ConfirmDialog.Title>
          <ConfirmDialog.Description>
            The project will be moved to the archive. You can restore it later.
          </ConfirmDialog.Description>
          <ConfirmDialog.Actions>
            <ConfirmDialog.Cancel>Keep active</ConfirmDialog.Cancel>
            <ConfirmDialog.Confirm>Yes, archive</ConfirmDialog.Confirm>
          </ConfirmDialog.Actions>
        </ConfirmDialog>
      </>
    );
  },
};
