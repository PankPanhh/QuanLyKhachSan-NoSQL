import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { getDailyRevenue } from "../../services/reportService";

const formatDate = (d) => {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

// Style cho tooltip
const tooltipStyle = {
  backgroundColor: "#0f1734",
  border: "1px solid #1f2a4f",
  color: "#ffffff",
};

function BookingChart({ days = 30 }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        const rows = await getDailyRevenue(
          start.toISOString(),
          end.toISOString()
        );
        const mapped = rows.map((r) => ({
          name: formatDate(r.date),
          Users: r.revenue,
        }));
        setData(mapped);
      } catch (e) {
        console.error("Failed to load daily revenue", e);
        setData([]);
      }
    })();
  }, [days]);
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: 48, bottom: 20 }}
      >
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
        <Bar
          dataKey="Users"
          name="Revenue"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default BookingChart;
