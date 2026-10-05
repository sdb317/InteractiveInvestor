import { Investment } from './Investment.jsx';

const noop = () => {};

// `Investment` renders a <tr>, so it is only valid inside a table. The decorator
// supplies the table, the column headers and the tbody that the browser needs to
// lay the row out at all — without them the cells would not form a row box.
const inTable = (Story) => (
  <table className="table align-middle mb-0">
    <thead>
      <tr>
        <th scope="col">Investment Name</th>
        <th scope="col">Deployment Timestamp</th>
        <th scope="col" className="text-end">Actions</th>
      </tr>
    </thead>
    <tbody>
      <Story />
    </tbody>
  </table>
);

export default {
  title: 'Components/Items/Investment',
  component: Investment,
  decorators: [inTable],
  args: {
    investment: { name: 'sep-summary', deployedAt: '2026-01-14T09:20:00Z' },
    onRun: noop,
  },
};

