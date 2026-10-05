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
export const NoProject = {};

// A project is loaded: title shows the project name and the delete
// button becomes visible on the right.
export const WithProject = {
  args: {
    project: { name: 'my-project' },
  },
};

export const LongProjectName = {
  args: {
    project: { name: 'a-rather-long-project-name-that-tests-truncation' },
  },
};
