import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, Typography, Row, Col, Divider } from 'antd';

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

const NutritionChart = ({ nutrition, nutritionalComponents = [] }) => {
  // Chuẩn bị dữ liệu cho biểu đồ chính (3 macro)
  const macroData = [
    { name: 'Protein', value: parseFloat(nutrition.protein) || 0, color: COLORS[0] },
    { name: 'Carbs', value: parseFloat(nutrition.carbs) || 0, color: COLORS[1] },
    { name: 'Fat', value: parseFloat(nutrition.fat) || 0, color: COLORS[2] },
  ];

  // Lọc bỏ các giá trị là 0
  const filteredMacroData = macroData.filter(item => item.value > 0);

  // Tính tổng calories
  const totalCalories = parseFloat(nutrition.calories) || 0;

  // Lọc và nhóm các thành phần dinh dưỡng khác (vitamins, minerals)
  const otherNutrients = nutritionalComponents.filter(nutrient => {
    const nameEn = (nutrient.nameEn || nutrient.name || '').toLowerCase();
    return !nameEn.includes('energy') && 
           !nameEn.includes('protein') && 
           !nameEn.includes('carbohydrate') && 
           !nameEn.includes('fat') &&
           !nameEn.includes('năng lượng') &&
           !nameEn.includes('đạm') &&
           !nameEn.includes('glucid') &&
           !nameEn.includes('lipid');
  });

  return (
    <Card 
      title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin dinh dưỡng</span>}
      variant="bordered"
      style={{ marginBottom: 16 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Tổng Calories */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 0, color: '#FF6B3D' }}>
            {totalCalories} kcal
          </Title>
          <Text type="secondary">Tổng calories mỗi khẩu phần</Text>
        </div>

        {/* Layout flex ngang cho biểu đồ và 3 macro */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 24, marginBottom: 24 }}>
          {/* Biểu đồ */}
          <div style={{ width: '60%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredMacroData}
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
                  {filteredMacroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}g`, name]}
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
          
          {/* Thông tin 3 macro */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '40%' }}>
            {filteredMacroData.map((item, index) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Các thành phần dinh dưỡng khác (vitamins, minerals) */}
        {otherNutrients.length > 0 && (
          <>
            <Divider orientation="left">
              <Text strong>Thành phần dinh dưỡng chi tiết</Text>
            </Divider>
            <Row gutter={[16, 16]}>
              {otherNutrients.map((nutrient, index) => (
                <Col span={6} key={index}>
                  <Card size="small" hoverable style={{ textAlign: 'center', borderRadius: 8 }}>
                    <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                      {nutrient.name}
                    </Text>
                    {nutrient.nameEn && nutrient.nameEn !== nutrient.name && (
                      <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: 4, fontStyle: 'italic' }}>
                        ({nutrient.nameEn})
                      </Text>
                    )}
                    <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                      {nutrient.amount || 0} {nutrient.unit_name || ''}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </div>
    </Card>
  );
};

export default NutritionChart;
