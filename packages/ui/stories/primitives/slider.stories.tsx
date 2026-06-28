import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '../../src/primitives/slider';

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => (
    <Slider defaultValue={50} style={{ width: 300 }}>
      <Slider.Track>
        <Slider.Indicator />
      </Slider.Track>
      <Slider.Thumb />
    </Slider>
  ),
};

export const WithStep: Story = {
  render: () => (
    <Slider defaultValue={20} min={0} max={100} step={10} style={{ width: 300 }}>
      <Slider.Track>
        <Slider.Indicator />
      </Slider.Track>
      <Slider.Thumb />
    </Slider>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Slider defaultValue={40} disabled style={{ width: 300 }}>
      <Slider.Track>
        <Slider.Indicator />
      </Slider.Track>
      <Slider.Thumb />
    </Slider>
  ),
};
