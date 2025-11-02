import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Dữ liệu giả mới với 2 key
const data = [
  { name: "Thg 5", Sales: 4000, Profit: 2400 },
  { name: "Thg 6", Sales: 3000, Profit: 2000 },
  { name: "Thg 7", Sales: 4500, Profit: 3000 },
  { name: "Thg 8", Sales: 3800, Profit: 2500 },
  { name: "Thg 9", Sales: 5200, Profit: 4000 },
  { name: "Thg 10", Sales: 6000, Profit: 3800 },
];

// Style cho tooltip
const tooltipStyle = {
  backgroundColor: "#0f1734",
  border: "1px solid #1f2a4f",
  color: "#ffffff",
};

function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
      >
        {/* Định nghĩa gradient cho màu xanh */}
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2a4f" />
        <XAxis dataKey="name" stroke="#a0aec0" />
        <YAxis stroke="#a0aec0" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#a0aec0" }}
        />
        {/* Đường màu xanh */}
        <Area
          type="monotone"
          dataKey="Sales"
          stroke="#3b82f6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorSales)"
        />
        {/* Đường màu tím */}
        <Area
          type="monotone"
          dataKey="Profit"
          stroke="#8884d8"
          strokeWidth={3}
          fillOpacity={0} // Không tô màu
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default RevenueChart;
