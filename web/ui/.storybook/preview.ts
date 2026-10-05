import type { Preview } from '@storybook/react-vite';
// Pulls in Bootstrap + the Bootswatch Zephyr theme (compiled from main.scss).
import '../src/styles/main.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
    // Match Storybook's canvas to the Bootswatch Zephyr palette so stories
    // render against the same background they get in the app.
    backgrounds: {
      default: 'zephyr',
      values: [
        { name: 'zephyr', value: '#fff' },
        { name: 'zephyr-body', value: '#f8f9fa' },
        { name: 'zephyr-dark', value: '#212529' },
      ],
    },
  },
};

export default preview;
