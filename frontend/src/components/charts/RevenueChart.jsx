import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Dữ liệu giả
const data = [
  { name: 'Thg 5', Revenue: 4000 },
  { name: 'Thg 6', Revenue: 3000 },
  { name: 'Thg 7', Revenue: 4500 },
  { name: 'Thg 8', Revenue: 3800 },
  { name: 'Thg 9', Revenue: 5200 },
  { name: 'Thg 10', Revenue: 6000 },
];

function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value}`} />
        <Bar dataKey="Revenue" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RevenueChart;
