import { Chart } from './Chart';

const data = [
  { x: '2023-01-01', y: 150 },
  { x: '2023-02-01', y: 155 },
  { x: '2023-03-01', y: 148 },
  { x: '2023-04-01', y: 162 },
  { x: '2023-05-01', y: 170 },
  { x: '2023-06-01', y: 168 },
  { x: '2023-07-01', y: 175 },
  { x: '2023-08-01', y: 180 },
  { x: '2023-09-01', y: 178 },
  { x: '2023-10-01', y: 185 },
  { x: '2023-11-01', y: 190 },
  { x: '2023-12-01', y: 195 },
];

/**
 * Story for the Chart component.
 * Displays a dummy line chart of stock prices over a period of time.
 */
export default {
  title: 'Components/Items/Chart',
  component: Chart,
  args: {
    data: data,
    title: "Stock Price Performance",
  },
};

// const Template = (args) => {
//   return (
//     <div style={{ padding: '20px' }}>
//       <Chart 
//         data={dummyData} 
//         title="Stock Price Performance" 
//         color="#007bff" 
//       />
//     </div>
//   );
// };

// export const Default = Template.args;

export const Default = {};