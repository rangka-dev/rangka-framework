import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from '../../src/primitives/radio-group';

const meta: Meta = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-2">
        <RadioGroup.Item value="option-1">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <label>Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroup.Item value="option-2">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <label>Option 2</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroup.Item value="option-3">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <label>Option 3</label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <RadioGroup defaultValue="option-1" disabled>
      <div className="flex items-center gap-2">
        <RadioGroup.Item value="option-1">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <label>Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroup.Item value="option-2">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <label>Option 2</label>
      </div>
    </RadioGroup>
  ),
};
