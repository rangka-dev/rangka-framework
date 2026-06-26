import type { Preview } from '@storybook/react';
import './styles.css';

const preview: Preview = {
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
