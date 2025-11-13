import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, Typography } from 'antd';

const { Text, Title } = Typography;

// Màu sắc cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

// Component hiển thị giá trị và phần trăm trong biểu đồ
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
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

const NutritionChart = ({ nutrition, nutritionEffect }) => {
  // Chuẩn bị dữ liệu cho biểu đồ
  const data = [
    { name: 'Protein', value: parseFloat(nutrition.protein), color: COLORS[0], retention: nutritionEffect?.protein || 100 },
    { name: 'Carbs', value: parseFloat(nutrition.carbs), color: COLORS[1], retention: nutritionEffect?.carbs || 100 },
    { name: 'Fat', value: parseFloat(nutrition.fat), color: COLORS[2], retention: nutritionEffect?.fat || 100 },
  ];

  // Lọc bỏ các giá trị là 0
  const filteredData = data.filter(item => item.value > 0);

  // Tính tổng calories
  const totalCalories = parseFloat(nutrition.calories);

  return (
    <Card 
      title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin dinh dưỡng</span>}
      variant="bordered"
      style={{ marginBottom: 16 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 0, color: '#FF6B3D' }}>
            {totalCalories} kcal
          </Title>
          <Text type="secondary">Tổng calories mỗi khẩu phần</Text>
        </div>

        {/* Layout flex ngang cho biểu đồ và thông tin chi tiết */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 24 }}>
          {/* Biểu đồ */}
          <div style={{ width: '60%', height: 250 }}>
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
                  formatter={(value, name, props) => [`${value}g (${props.payload.retention}% sau chế biến)`, name]}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                />
                <Legend 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>
                      {value}: <strong>{entry.payload.value}g</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Thông tin chi tiết */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '40%' }}>
            {filteredData.map((item, index) => (
              <div key={index} style={{ 
                textAlign: 'center', 
                padding: '12px 16px', 
                borderRadius: 6, 
                backgroundColor: `${item.color}20`,
                border: `1px solid ${item.color}40`
              }}>
                <Text strong style={{ color: item.color, fontSize: '14px' }}>{item.name}</Text>
                <div>
                  <Text style={{ fontSize: '18px', fontWeight: 'bold', display: 'block' }}>{item.value}g</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Tỉ lệ: {item.retention}%</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NutritionChart;
