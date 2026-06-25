import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../../src/primitives/switch';

const meta: Meta = {
  title: 'Primitives/Switch',
  component: Switch,
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Switch defaultChecked>
      <Switch.Thumb />
    </Switch>
  ),
};

export const Unchecked: StoryObj = {
  render: () => (
    <Switch>
      <Switch.Thumb />
    </Switch>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <Switch disabled defaultChecked>
      <Switch.Thumb />
    </Switch>
  ),
};
