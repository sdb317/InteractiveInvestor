import React from 'react';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory';

/**
 * Chart component to display a line chart of stock prices.
 * 
 * @param {Array<{x: string|number, y: number}>} data - The data to display in the chart.
 * @param {string} title - The title of the chart.
 * @param {string} color - The color of the line.
 * @returns {React.JSX.Element}
 */
export const Chart = ({ data, title, color = "#007bff" }) => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      {title && <h3 style={{ textAlign: 'center' }}>{title}</h3>}
      <VictoryChart
        data={data}
        theme={VictoryTheme.material}
        height={400}
        width={800}
        padding={{ top: 50, bottom: 50, left: 50, right: 50 }}
      >
        <VictoryAxis
          tickFormat={(x) => x}
          style={{
            axis: {
              padding: 5,
            },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(y) => `$${y}`}
          style={{
            axis: {
              padding: 5,
            },
          }}
        />
        <VictoryLine
          data={data}
          x="x"
          y="y"
          animate={{ duration: 2000 }}
          style={{
            data: {
              stroke: color,
              strokeWidth: 3,
            },
          }}
        />
      </VictoryChart>
    </div>
  );
};

export default Chart;
