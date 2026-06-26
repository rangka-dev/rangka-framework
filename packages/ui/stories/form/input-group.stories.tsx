import type { Meta, StoryObj } from '@storybook/react';
import { InputGroup } from '../../src/form/input-group';

const meta: Meta = {
  title: 'Form/InputGroup',
};

export default meta;

export const WithPrefix: StoryObj = {
  render: () => (
    <InputGroup>
      <InputGroup.Addon align="inline-start">
        <InputGroup.Text>USD</InputGroup.Text>
      </InputGroup.Addon>
      <InputGroup.Input placeholder="0.00" />
    </InputGroup>
  ),
};

export const WithSuffix: StoryObj = {
  render: () => (
    <InputGroup>
      <InputGroup.Input placeholder="Search..." />
      <InputGroup.Addon align="inline-end">
        <InputGroup.Text>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </InputGroup.Text>
      </InputGroup.Addon>
    </InputGroup>
  ),
};

export const WithBothAddons: StoryObj = {
  render: () => (
    <InputGroup>
      <InputGroup.Addon align="inline-start">
        <InputGroup.Text>https://</InputGroup.Text>
      </InputGroup.Addon>
      <InputGroup.Input placeholder="example.com" />
      <InputGroup.Addon align="inline-end">
        <InputGroup.Text>.com</InputGroup.Text>
      </InputGroup.Addon>
    </InputGroup>
  ),
};
