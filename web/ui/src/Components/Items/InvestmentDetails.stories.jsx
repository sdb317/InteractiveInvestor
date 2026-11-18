import { InvestmentDetails } from './InvestmentDetails.jsx';

const mockInvestment = {
  name: 'sep-summary',
  deployedAt: '2026-01-14T09:20:00Z',
};

export default {
  title: 'Components/Items/InvestmentDetails',
  component: InvestmentDetails,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    investment: mockInvestment,
    onRun: (name) => console.log(`Running: ${name}`),
    onClose: () => console.log('Closed'),
  },
};
