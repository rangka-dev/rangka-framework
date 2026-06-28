import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../../src/primitives/checkbox';

const meta: Meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Checkbox defaultChecked>
      <Checkbox.Indicator>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Checkbox.Indicator>
    </Checkbox>
  ),
};

export const Indeterminate: StoryObj = {
  render: () => (
    <Checkbox indeterminate>
      <Checkbox.Indicator>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Checkbox.Indicator>
    </Checkbox>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <Checkbox disabled>
      <Checkbox.Indicator>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Checkbox.Indicator>
    </Checkbox>
  ),
};
