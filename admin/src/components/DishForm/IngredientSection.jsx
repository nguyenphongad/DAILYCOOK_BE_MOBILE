import React, { useState } from 'react';
import { Card, Button, Row, Col, InputNumber, Image, Typography, Input } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

const IngredientSection = ({
  selectedIngredients,
  setSelectedIngredients,
  allIngredients,
  measurementUnits,
  getMeasureUnitLabel
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  // Lấy danh sách nguyên liệu chưa được chọn
  const getAvailableIngredients = () => {
    const selectedIds = selectedIngredients.map(ing => ing.ingredient_id).filter(id => id);
    return allIngredients.filter(ingredient => !selectedIds.includes(ingredient._id));
  };

  // Lọc nguyên liệu theo từ khóa tìm kiếm
  const getFilteredIngredients = () => {
    const availableIngredients = getAvailableIngredients();
    if (!searchKeyword.trim()) return availableIngredients;
    
    return availableIngredients.filter(ingredient =>
      ingredient.nameIngredient.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  };

  // Xử lý chọn nguyên liệu từ danh sách bên trái
  const handleSelectIngredient = (ingredient) => {
    const newIngredient = {
      ingredient_id: ingredient._id,
      quantity: ingredient.defaultAmount || 1,
      unit: ingredient.defaultUnit || 'GRAM',
      ingredientInfo: ingredient
    };
    setSelectedIngredients([...selectedIngredients, newIngredient]);
  };

  // Xử lý xóa nguyên liệu
  const handleRemoveIngredient = (index) => {
    const newIngredients = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(newIngredients);
  };

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (index, quantity) => {
    const newIngredients = [...selectedIngredients];
    newIngredients[index].quantity = quantity;
    setSelectedIngredients(newIngredients);
  };

  return (
    <Card title="Quản lý nguyên liệu" style={{ height: 'fit-content' }}>
      <Row gutter={16} style={{ minHeight: '500px' }}>
        {/* Cột trái - Danh sách nguyên liệu có sẵn */}
        <Col span={8}>
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: 8, 
            height: '500px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #e8e8e8',
              backgroundColor: '#fafafa'
            }}>
              <Text strong>Nguyên liệu có sẵn</Text>
            </div>
            
            {/* Thanh tìm kiếm */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Input
                placeholder="Tìm kiếm nguyên liệu..."
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                size="small"
              />
            </div>

            {/* Danh sách nguyên liệu */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              padding: '8px'
            }}>
              {getFilteredIngredients().map((ingredient, index) => (
                <div
                  key={ingredient._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    margin: '4px 0',
                    border: '1px solid #e8e8e8',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateX(0)',
                    opacity: 1,
                    animation: `slideInLeft 0.7s ease-out ${index * 0.05}s both`,
                    backgroundColor: '#fff'
                  }}
                  className="ingredient-item"
                  onClick={() => handleSelectIngredient(ingredient)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = '#e6f4ff';
                    e.target.style.transform = 'translateX(2px) scale(1.01)';
                    e.target.style.boxShadow = '0 1px 4px rgba(24, 144, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.borderColor = '#e8e8e8';
                    e.target.style.transform = 'translateX(0) scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <Image
                    src={ingredient.ingredientImage}
                    width={32}
                    height={32}
                    style={{ borderRadius: 4, objectFit: 'cover', marginRight: 8 }}
                    
                    />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                      style={{ 
                        fontSize: 13, 
                        fontWeight: 500,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ingredient.nameIngredient}
                    </Text>
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: 11,
                        display: 'block',
                        marginTop: 2
                      }}
                    >
                      {ingredient.defaultAmount} {getMeasureUnitLabel(ingredient.defaultUnit)}
                    </Text>
                  </div>
                </div>
              ))}
              
              {getFilteredIngredients().length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '40px 20px',
                  fontSize: 13
                }}>
                  {searchKeyword ? 'Không tìm thấy nguyên liệu phù hợp' : 'Tất cả nguyên liệu đã được chọn'}
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Cột phải - Nguyên liệu đã chọn */}
        <Col span={16}>
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: 8, 
            height: '500px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #e8e8e8',
              backgroundColor: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text strong>Nguyên liệu đã chọn</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({selectedIngredients.length} nguyên liệu)
              </Text>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              padding: '12px'
            }}>
              {selectedIngredients.map((ingredient, index) => (
                <div
                  key={`${ingredient.ingredient_id}-${index}`}
                  style={{
                    marginBottom: 12,
                    padding: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `slideInRight 0.4s ease-out ${index * 0.08}s both`,
                    transform: 'translateX(0)',
                    opacity: 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  className="selected-ingredient-item"
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.target.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    e.target.style.borderColor = '#e8e8e8';
                  }}
                >
                  <Row gutter={12} align="middle">
                    <Col span={3}>
                      <div style={{ 
                        width: 48, 
                        height: 48, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8,
                        border: '1px solid #e8e8e8'
                      }}>
                        {ingredient.ingredientInfo ? (
                          <Image
                            src={ingredient.ingredientInfo.ingredientImage}
                            width={46}
                            height={46}
                            style={{ borderRadius: 6, objectFit: 'cover' }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            backgroundColor: '#e8e8e8', 
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#999'
                          }}>
                            IMG
                          </div>
                        )}
                      </div>
                    </Col>
                    
                    <Col span={9}>
                      <div>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: 14,
                            display: 'block',
                            marginBottom: 4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ingredient.ingredientInfo?.nameIngredient || 'Nguyên liệu không xác định'}
                        </Text>
                        <Text 
                          type="secondary" 
                          style={{ fontSize: 12 }}
                        >
                          Đơn vị: {getMeasureUnitLabel(ingredient.unit)}
                        </Text>
                      </div>
                    </Col>
                    
                    <Col span={9}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#666', minWidth: 'fit-content' }}>
                          Số lượng:
                        </Text>
                        <InputNumber
                          value={ingredient.quantity}
                          onChange={(value) => handleQuantityChange(index, value)}
                          min={0}
                          size="small"
                          style={{ 
                            width: '100%',
                            minWidth: '80px',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#1890ff';
                            e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d9d9d9';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </Col>
                    
                    <Col span={3}>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveIngredient(index)}
                        style={{
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              ))}

              {selectedIngredients.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '60px 20px',
                  fontSize: 14
                }}>
                  <div style={{ 
                    fontSize: 48, 
                    marginBottom: 16, 
                    opacity: 0.3 
                  }}>
                    🥘
                  </div>
                  Chưa có nguyên liệu nào được chọn
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Nhấp vào nguyên liệu bên trái để thêm
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* CSS Animation trong style tag */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }

        .ingredient-item:hover {
          transform: translateX(2px) scale(1.01) !important;
        }

        .selected-ingredient-item:hover {
          transform: translateY(-2px) !important;
        }

        /* Custom scrollbar */
        .ingredients-list-container::-webkit-scrollbar,
        .selected-ingredients-container::-webkit-scrollbar {
          width: 6px;
        }

        .ingredients-list-container::-webkit-scrollbar-track,
        .selected-ingredients-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .ingredients-list-container::-webkit-scrollbar-thumb,
        .selected-ingredients-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .ingredients-list-container::-webkit-scrollbar-thumb:hover,
        .selected-ingredients-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </Card>
  );
};

export default IngredientSection;
