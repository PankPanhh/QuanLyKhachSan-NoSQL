import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Dữ liệu giả cho Active Users
const data = [
  { name: 'May', Users: 280 },
  { name: 'Jun', Users: 165 },
  { name: 'Jul', Users: 390 },
  { name: 'Aug', Users: 275 },
  { name: 'Sep', Users: 410 },
  { name: 'Oct', Users: 320 },
];

// Style cho tooltip
const tooltipStyle = {
  backgroundColor: '#0f1734',
  border: '1px solid #1f2a4f',
  color: '#ffffff'
};

function BookingChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2a4f" />
        <XAxis dataKey="name" stroke="#a0aec0" />
        <YAxis stroke="#a0aec0" />
        <Tooltip 
          contentStyle={tooltipStyle} 
          labelStyle={{ color: '#a0aec0' }}
        />
        <Bar dataKey="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default BookingChart;