import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dữ liệu: 95% hoàn thành, 5% còn lại
const data = [
  { name: 'Complete', value: 95 },
  { name: 'Empty', value: 5 },
];

// Màu: Xanh cho 95%, màu nền tối cho 5%
const COLORS = ['#3b82f6', '#1f2a4f'];

function SatisfactionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60} // Tạo lỗ rỗng ở giữa
          outerRadius={80} // Bán kính ngoài
          startAngle={90}
          endAngle={450} // 90 + 360
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        {/* Thêm chữ 95% ở giữa */}
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="#ffffff"
          fontSize="24px"
          fontWeight="bold"
        >
          95%
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default SatisfactionChart;