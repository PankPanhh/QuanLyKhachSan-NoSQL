import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { getMonthlyRevenue } from "../../services/reportService";

const VN_MONTH = [
  "Thg 1",
  "Thg 2",
  "Thg 3",
  "Thg 4",
  "Thg 5",
  "Thg 6",
  "Thg 7",
  "Thg 8",
  "Thg 9",
  "Thg 10",
  "Thg 11",
  "Thg 12",
];

// Style cho tooltip
const tooltipStyle = {
  backgroundColor: "#0f1734",
  border: "1px solid #1f2a4f",
  color: "#ffffff",
};

function RevenueChart({ year = new Date().getFullYear() }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getMonthlyRevenue(year);
        const mapped = rows.map((r) => ({
          name: VN_MONTH[new Date(r.month).getMonth()],
          Sales: r.revenue,
          Profit: r.revenue, // if no profit data, show same
        }));
        // Ensure 12 months
        if (mapped.length < 12) {
          const mMap = new Map(mapped.map((m) => [m.name, m]));
          const full = VN_MONTH.map(
            (label) => mMap.get(label) || { name: label, Sales: 0, Profit: 0 }
          );
          setData(full);
        } else setData(mapped);
      } catch (e) {
        console.error("Failed to load monthly revenue", e);
        setData(
          VN_MONTH.map((label) => ({ name: label, Sales: 0, Profit: 0 }))
        );
      }
    })();
  }, [year]);
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 10, left: 48, bottom: 20 }}
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
        <YAxis
          stroke="#a0aec0"
          tickFormatter={(v) => v.toLocaleString("vi-VN")}
          width={60}
        />
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
        {/* Có thể tắt đường phụ nếu không dùng */}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default RevenueChart;
