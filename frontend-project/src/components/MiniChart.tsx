import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import type { MiniChartProps } from "../store/types/components.types";

const MiniChart = ({ data, color }: MiniChartProps) => {
  // Convert data to recharts format
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <YAxis domain={["auto", "auto"]} hide={true} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniChart;
