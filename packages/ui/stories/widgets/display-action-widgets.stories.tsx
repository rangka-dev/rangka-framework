import type { Meta, StoryObj } from '@storybook/react';
import {
  TextWidget,
  BadgeWidget,
  ImageWidget,
  IconWidget,
  ComputedWidget,
  SequenceWidget,
} from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import type { WidgetComponentProps } from '../../src/widgets/types';
import { Stack } from '../../src/layout/stack';
import { Group } from '../../src/layout/group';
import { Grid } from '../../src/layout/grid';
import { Card } from '../../src/layout/card';
import { Package, Star, AlertCircle, Check, Truck } from 'lucide-react';

const meta: Meta = {
  title: 'Widgets/Display & Action',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const emptyBind = { value: null, meta: undefined };
const defaultOn = {};
const defaultContext = { record: {}, model: 'test', mode: 'view' as const };

export const TextVariants: Story = {
  name: 'Text Widget Variants',
  render: () => (
    <Card>
      <Card.Content>
        <Stack gap="md">
          <TextWidget
            props={{ variant: 'heading' }}
            bind={{ value: 'Order Summary' }}
            on={defaultOn}
            context={defaultContext}
          />
          <TextWidget
            props={{ variant: 'body' }}
            bind={{ value: 'This order contains 3 items shipped to the warehouse.' }}
            on={defaultOn}
            context={defaultContext}
          />
          <TextWidget
            props={{ variant: 'caption' }}
            bind={{ value: 'Last updated: June 26, 2026 at 9:00 AM' }}
            on={defaultOn}
            context={defaultContext}
          />
          <TextWidget
            props={{ variant: 'bold' }}
            bind={{ value: 'Important: Payment due in 30 days' }}
            on={defaultOn}
            context={defaultContext}
          />
          <TextWidget
            props={{ variant: 'muted' }}
            bind={{ value: 'No additional notes.' }}
            on={defaultOn}
            context={defaultContext}
          />
        </Stack>
      </Card.Content>
    </Card>
  ),
};

export const Badges: Story = {
  name: 'Badge Widget',
  render: () => (
    <Card>
      <Card.Content>
        <Group gap="sm">
          <BadgeWidget
            props={{ variant: 'default', label: 'Confirmed' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <BadgeWidget
            props={{ variant: 'secondary', label: 'Pending' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <BadgeWidget
            props={{ variant: 'outline', label: 'Draft' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <BadgeWidget
            props={{ variant: 'destructive', label: 'Overdue' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
        </Group>
      </Card.Content>
    </Card>
  ),
};

export const Images: Story = {
  name: 'Image Widget',
  render: () => (
    <Card>
      <Card.Content>
        <Group gap="md">
          <ImageWidget
            props={{
              src: 'https://picsum.photos/120/120',
              alt: 'Product photo',
              rounded: 'md',
              width: 120,
              height: 120,
            }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <ImageWidget
            props={{
              src: 'https://picsum.photos/80/80',
              alt: 'Avatar',
              rounded: 'full',
              width: 80,
              height: 80,
            }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
        </Group>
      </Card.Content>
    </Card>
  ),
};

export const Icons: Story = {
  name: 'Icon Widget',
  render: () => (
    <Card>
      <Card.Content>
        <Group gap="md" align="center">
          <IconWidget
            props={{ icon: Package, size: 'sm' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <IconWidget
            props={{ icon: Star, size: 'md' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <IconWidget
            props={{ icon: AlertCircle, size: 'lg' }}
            bind={emptyBind}
            on={defaultOn}
            context={defaultContext}
          />
          <IconWidget
            props={{ icon: Truck, size: 'md' }}
            bind={emptyBind}
            on={{ click: () => alert('Clicked truck icon') }}
            context={defaultContext}
          />
        </Group>
      </Card.Content>
    </Card>
  ),
};

export const ComputedValues: Story = {
  name: 'Computed Widget',
  render: () => (
    <Card>
      <Card.Content>
        <Stack gap="sm">
          <Group gap="md" justify="between">
            <TextWidget
              props={{ variant: 'muted' }}
              bind={{ value: 'Subtotal' }}
              on={defaultOn}
              context={defaultContext}
            />
            <ComputedWidget
              props={{ format: 'currency', prefix: '$' }}
              bind={{ value: 4250 }}
              on={defaultOn}
              context={defaultContext}
            />
          </Group>
          <Group gap="md" justify="between">
            <TextWidget
              props={{ variant: 'muted' }}
              bind={{ value: 'Tax (10%)' }}
              on={defaultOn}
              context={defaultContext}
            />
            <ComputedWidget
              props={{ format: 'currency', prefix: '$' }}
              bind={{ value: 425 }}
              on={defaultOn}
              context={defaultContext}
            />
          </Group>
          <Group gap="md" justify="between">
            <TextWidget
              props={{ variant: 'bold' }}
              bind={{ value: 'Total' }}
              on={defaultOn}
              context={defaultContext}
            />
            <ComputedWidget
              props={{ format: 'currency', prefix: '$' }}
              bind={{ value: 4675 }}
              on={defaultOn}
              context={defaultContext}
            />
          </Group>
        </Stack>
      </Card.Content>
    </Card>
  ),
};

export const Sequences: Story = {
  name: 'Sequence Widget',
  render: () => (
    <Card>
      <Card.Content>
        <Group gap="sm">
          <SequenceWidget
            props={{}}
            bind={{ value: 'ORD-00142' }}
            on={defaultOn}
            context={defaultContext}
          />
          <SequenceWidget
            props={{}}
            bind={{ value: 'INV-00087' }}
            on={defaultOn}
            context={defaultContext}
          />
          <SequenceWidget
            props={{}}
            bind={{ value: null }}
            on={defaultOn}
            context={defaultContext}
          />
        </Group>
      </Card.Content>
    </Card>
  ),
};

export const Buttons: Story = {
  name: 'Button Widget',
  render: () => (
    <Card>
      <Card.Content>
        <Group gap="sm">
          <ButtonWidget
            props={{ label: 'Save', variant: 'primary', size: 'sm' }}
            bind={emptyBind}
            on={{ click: () => alert('Saved!') }}
            context={defaultContext}
          />
          <ButtonWidget
            props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
            bind={emptyBind}
            on={{ click: () => {} }}
            context={defaultContext}
          />
          <ButtonWidget
            props={{ label: 'Delete', variant: 'destructive', size: 'sm' }}
            bind={emptyBind}
            on={{ click: () => alert('Deleted!') }}
            context={defaultContext}
          />
          <ButtonWidget
            props={{ label: 'Export', variant: 'secondary', size: 'xs' }}
            bind={emptyBind}
            on={{ click: () => {} }}
            context={defaultContext}
          />
        </Group>
      </Card.Content>
    </Card>
  ),
};
