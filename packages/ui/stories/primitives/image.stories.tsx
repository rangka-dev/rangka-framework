import type { Meta, StoryObj } from '@storybook/react';
import { Image } from '../../src/primitives/image';

const meta: Meta<typeof Image> = {
  title: 'Primitives/Image',
  component: Image,
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Default: Story = {
  render: () => (
    <Image src="https://placehold.co/400x200" alt="Placeholder" width={400} height={200} />
  ),
};

export const Rounded: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Image
        src="https://placehold.co/100x100"
        alt="none"
        rounded="none"
        width={100}
        height={100}
      />
      <Image src="https://placehold.co/100x100" alt="sm" rounded="sm" width={100} height={100} />
      <Image src="https://placehold.co/100x100" alt="md" rounded="md" width={100} height={100} />
      <Image src="https://placehold.co/100x100" alt="lg" rounded="lg" width={100} height={100} />
      <Image
        src="https://placehold.co/100x100"
        alt="full"
        rounded="full"
        width={100}
        height={100}
      />
    </div>
  ),
};
