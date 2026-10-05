import HeaderBar from './HeaderBar.jsx';

const noop = () => {};

export default {
  title: 'Components/Items/HeaderBar',
  component: HeaderBar,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    project: null,
    onMenuToggle: noop,
    onDeleteClick: noop,
  },
};

// No project loaded: shows the default title and hides the delete button.
export const Default = {};
