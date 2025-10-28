import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Dữ liệu giả
const data = [
  { name: 'Thg 5', Bookings: 80 },
  { name: 'Thg 6', Bookings: 65 },
  { name: 'Thg 7', Bookings: 90 },
  { name: 'Thg 8', Bookings: 75 },
  { name: 'Thg 9', Bookings: 110 },
  { name: 'Thg 10', Bookings: 120 },
];

function BookingChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="Bookings" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default BookingChart;
