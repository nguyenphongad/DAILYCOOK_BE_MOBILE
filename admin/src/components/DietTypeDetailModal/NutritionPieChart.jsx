import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, Typography } from 'antd';

const { Text, Title } = Typography;

// Màu sắc cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

// Component hiển thị giá trị và phần trăm trong biểu đồ
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      style={{ fontSize: '12px', fontWeight: 'bold' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const NutritionPieChart = ({ nutrition }) => {
  // Tính tổng macros (protein, carbs, fat) để làm biểu đồ
  const totalMacros = (nutrition?.protein || 0) + (nutrition?.carbs || 0) + (nutrition?.fat || 0);
  
  // Chuẩn bị dữ liệu cho biểu đồ
  const data = [
    { name: 'Protein', value: parseFloat(nutrition?.protein || 0), color: COLORS[0] },
    { name: 'Carbs', value: parseFloat(nutrition?.carbs || 0), color: COLORS[1] },
    { name: 'Fat', value: parseFloat(nutrition?.fat || 0), color: COLORS[2] },
  ];

  // Lọc bỏ các giá trị là 0
  const filteredData = data.filter(item => item.value > 0);

  // Nếu không có dữ liệu dinh dưỡng hoặc tổng là 0
  if (!nutrition || filteredData.length === 0 || totalMacros === 0) {
    return (
      <Card title="Phân bổ dinh dưỡng" style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text type="secondary">Không có thông tin dinh dưỡng</Text>
      </Card>
    );
  }

  return (
    <Card title="Phân bổ dinh dưỡng" style={{ height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          {nutrition?.calories || 0} kcal
        </Title>
        <Text type="secondary">Calories khuyến nghị hàng ngày</Text>
      </div>

      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value}g`, null]}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {value}: {entry.payload.value}g
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: 16 }}>
        {filteredData.map((item, index) => (
          <div key={index} style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 4, backgroundColor: `${item.color}20` }}>
            <Text strong style={{ color: item.color }}>{item.name}</Text>
            <div>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.value}g</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {totalMacros > 0 ? `${Math.round((item.value / totalMacros) * 100)}%` : '0%'}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NutritionPieChart;
