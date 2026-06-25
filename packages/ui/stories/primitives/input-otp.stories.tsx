import type { Meta, StoryObj } from '@storybook/react';
import { InputOTP } from '../../src/primitives/input-otp';

const meta: Meta = {
  title: 'Primitives/InputOTP',
  component: InputOTP,
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <InputOTP length={6}>
      <InputOTP.Group>
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
      </InputOTP.Group>
      <InputOTP.Group>
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
      </InputOTP.Group>
    </InputOTP>
  ),
};

export const FourDigits: StoryObj = {
  render: () => (
    <InputOTP length={4}>
      <InputOTP.Group>
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
      </InputOTP.Group>
    </InputOTP>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <InputOTP length={6} disabled>
      <InputOTP.Group>
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
        <InputOTP.Slot />
      </InputOTP.Group>
    </InputOTP>
  ),
};
