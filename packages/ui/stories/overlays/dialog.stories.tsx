import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '../../src/overlays/dialog';

const meta: Meta = {
  title: 'Overlays/Dialog',
};

export default meta;

export const Basic: StoryObj = {
  render: () => (
    <Dialog>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Are you sure?</Dialog.Title>
          <Dialog.Description>
            This action cannot be undone. This will permanently delete your account.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close>Cancel</Dialog.Close>
          <button>Confirm</button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};
