import type { Preview } from '@storybook/react';
import './styles.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return Story();
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Primitives',
          'Layout',
          'Form',
          'Data',
          'Overlays',
          'Feedback',
          'Widgets',
          'Shell',
          'Widget Compose',
        ],
      },
    },
  },
};

export default preview;
