import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from './Dashboard';

/**
 * @description The main dashboard layout component.
 */
const meta: Meta<typeof Dashboard> = {
  title: 'Layouts/Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  // Since Dashboard is a layout with no specific props, we don't need complex args here.
  parameters: {
    docs: {
      description: 'The main container for the application Dashboard view.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

/**
 * Default view of the Dashboard.
 */
export const Default: Story = {
  args: {
    // No props required for the base dashboard layout.
  },
};
