import { InvestmentList } from './InvestmentList.jsx';

const noop = () => {};

const INVESTMENTS = [
  { name: 'Amazon', deployedAt: '2026-02-03T16:45:12Z' },
  { name: 'Nvidia', deployedAt: '2026-02-27T11:02:33Z' },
  { name: 'Microsoft', deployedAt: '2026-01-14T09:20:00Z' },
];

export default {
  title: 'Components/Layouts/InvestmentList',
  component: InvestmentList,
  parameters: {
    layout: 'padded',
  },
  args: {
    investments: INVESTMENTS,
    loading: false,
    error: null,
    onRefresh: noop,
    onOpen: noop,
  },
};


export const Empty = {
  args: {
    investments: [],
  },
};

