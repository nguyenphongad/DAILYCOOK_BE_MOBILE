import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Image, Typography, Divider, Descriptions, Tag, Card, List, Steps, Button, Form, Avatar, Spin } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FireOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecipeById } from '../../redux/thunks/recipeThunk';
import DishForm from '../DishForm/DishForm';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const DishDetailModal = ({ isVisible, onClose, meal, onEdit, onDelete, allIngredients, mealCategories }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [ingredientDetails, setIngredientDetails] = useState([]);
  const [fetchingRecipe, setFetchingRecipe] = useState(false);
  
  // Lấy chi tiết công thức từ Redux store
  const { selectedRecipe, loading: recipeLoading } = useSelector(state => state.recipes);
  
  // Debug dữ liệu recipe được fetch
  console.log("Redux selectedRecipe:", selectedRecipe);
  
  // Fetch công thức khi meal thay đổi và có recipe_id
  useEffect(() => {
    if (meal && meal.recipe && meal.recipe.recipe_id && isVisible) {
      setFetchingRecipe(true);
      
      dispatch(fetchRecipeById(meal.recipe.recipe_id))
        .then(response => {
          setFetchingRecipe(false);
        })
        .catch(error => {
          setFetchingRecipe(false);
        });
    }
  }, [meal, isVisible, dispatch]);
  
  // Tìm thông tin chi tiết của các nguyên liệu dựa trên ingredient_id
  useEffect(() => {
    if (meal && meal.ingredients && Array.isArray(allIngredients)) {
      const details = meal.ingredients.map(ing => {
        const ingredientInfo = allIngredients.find(i => i._id === ing.ingredient_id);
        return {
          id: ing.ingredient_id,
          name: ingredientInfo?.nameIngredient || 'Nguyên liệu không xác định',
          quantity: ing.quantity || 0,
          unit: ing.unit || 'g',
          image: ingredientInfo?.ingredientImage || ''
        };
      });
      setIngredientDetails(details);
    }
  }, [meal, allIngredients]);

  // Tính toán tổng dinh dưỡng từ tất cả nguyên liệu
  const calculateTotalNutrition = () => {
    if (!Array.isArray(ingredientDetails) || ingredientDetails.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    ingredientDetails.forEach(ingredient => {
      const ingredientInfo = allIngredients.find(i => i._id === ingredient.id);
      if (!ingredientInfo || !ingredientInfo.nutrition) return;
      
      const ratio = ingredient.quantity / (ingredientInfo.defaultAmount || 100);
      
      totals.calories += (ingredientInfo.nutrition?.calories || 0) * ratio;
      totals.protein += (ingredientInfo.nutrition?.protein || 0) * ratio;
      totals.carbs += (ingredientInfo.nutrition?.carbs || 0) * ratio;
      totals.fat += (ingredientInfo.nutrition?.fat || 0) * ratio;
    });
    
    return totals;
  };

  // Tính dinh dưỡng sau khi áp dụng cooking effect
  const calculateFinalNutrition = () => {
    const totalNutrition = calculateTotalNutrition();
    const cookingEffect = meal?.recipe?.cookingEffect || { calo: 100, protein: 100, carb: 100, fat: 100 };
    
    return {
      calories: (totalNutrition.calories * (cookingEffect.calo / 100)).toFixed(1),
      protein: (totalNutrition.protein * (cookingEffect.protein / 100)).toFixed(1),
      carbs: (totalNutrition.carbs * (cookingEffect.carb / 100)).toFixed(1),
      fat: (totalNutrition.fat * (cookingEffect.fat / 100)).toFixed(1)
    };
  };
  
  const finalNutrition = calculateFinalNutrition();

  if (!meal) return null;

  console.log("meal", meal);
  console.log("selectedRecipe", selectedRecipe);
  console.log("ingredient details", ingredientDetails);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSaveEdit = (values) => {
    if (onEdit) {
      onEdit({ ...values, id: meal.id });
    }
    setIsEditing(false);
  };

  // Xóa nguyên liệu (hiện modal confirm)
  const handleDelete = () => {
    if (!meal) return;

    modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa nguyên liệu "${meal.name}" không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: () => {
        if (onDelete) {
          onDelete(meal._id);
        }
        onClose();
      }
    });
  };

  const getCategoryTitle = (categoryId) => {
    const found = mealCategories.find(cat => cat._id === categoryId);
    return found ? found.title || found.nameCategory : 'Chưa phân loại';
  };

  // Nếu đang trong chế độ chỉnh sửa, hiển thị form thay vì thông tin chi tiết
  if (isEditing) {
    return (
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chỉnh sửa món ăn</span>}
        open={isVisible}
        onCancel={handleCancelEdit}
        width={1600}
        style={{
          top: 10,
          maxWidth: '90%',
          margin: '0 auto'
        }}
        footer={null}
        className="dish-detail-modal editing"
      >
        <DishForm
          form={form}
          initialValues={meal}
          onFinish={handleSaveEdit}
          onCancel={handleCancelEdit}
          allIngredients={allIngredients || []}
          isEdit={true}
        />
      </Modal>
    );
  }

  // Hiển thị thông tin chi tiết món ăn
  return (
    <Modal
      title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chi tiết món ăn</span>}
      open={isVisible}
      onCancel={onClose}
      width={1600}
      style={{
        top: 20,
        maxWidth: '90%',
        margin: '0 auto'
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Xóa món ăn
          </Button>
          <div>
            <Button style={{ marginRight: 8 }} onClick={onClose}>
              Đóng
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEditClick}>
              Chỉnh sửa
            </Button>
          </div>
        </div>
      }
      className="dish-detail-modal"
    >
      <Row gutter={24}>
        {/* Phần bên trái (60%) - Thông tin cơ bản và nguyên liệu */}
        <Col span={14}>
          <Card
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin cơ bản</span>}
            variant="bordered"
          >
            <Row gutter={16}>
              <Col span={10}>
                <div className="dish-image-container">
                  <Image
                    src={meal.mealImage}
                    alt={meal.nameMeal}
                    className="dish-image"
                    style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              </Col>
              <Col span={14}>
                <Title level={3}>{meal.nameMeal}</Title>
                <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                  {getCategoryTitle(meal.mealCategory)}
                </Tag>
                <Paragraph>{meal.description}</Paragraph>

                <Descriptions column={1} size="small">
                  <Descriptions.Item label={<strong>Thời gian chuẩn bị</strong>}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {selectedRecipe?.data?.prepTimeMinutes || 'N/A'} phút
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Thời gian nấu</strong>}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {selectedRecipe?.data?.cookTimeMinutes || 'N/A'} phút
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Tổng thời gian</strong>}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {selectedRecipe?.data ? 
                      `${(selectedRecipe.data.prepTimeMinutes || 0) + (selectedRecipe.data.cookTimeMinutes || 0)} phút` 
                      : 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Số thành phần</strong>}>
                    {ingredientDetails.length} nguyên liệu
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Độ khó</strong>}>
                    <StarOutlined style={{ marginRight: 8 }} />
                    {selectedRecipe?.data?.difficulty === 'easy' ? 'Dễ' :
                     selectedRecipe?.data?.difficulty === 'medium' ? 'Trung bình' :
                     selectedRecipe?.data?.difficulty === 'hard' ? 'Khó' : 'Không xác định'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Calories</strong>}>
                    <FireOutlined style={{ marginRight: 8 }} />~450 kcal/khẩu phần
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Nguyên liệu</span>}
            variant="bordered"
          >
            <List
              bordered
              dataSource={ingredientDetails}
              renderItem={item => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar 
                      size={32} 
                      src={item.image} 
                      shape="square"
                      style={{ marginRight: 8 }}
                    >
                      {!item.image && item.name?.charAt(0)}
                    </Avatar>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 10 }} />
                    <div style={{ flex: 1 }}>{item.name}</div>
                    <div>
                      <Text strong>{item.quantity} {item.unit}</Text>
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'Không có nguyên liệu nào' }}
            />
          </Card>
        </Col>

        {/* Phần bên phải (40%) - Các bước thực hiện */}
        <Col span={10}>
          <Card
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Công thức nấu ăn</span>}
            variant="bordered"
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: '15px', marginBottom: 16, display: 'block' }}>
                Các bước thực hiện
              </Text>
              
              {fetchingRecipe || recipeLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Spin tip="Đang tải công thức..." />
                </div>
              ) : (
                selectedRecipe && selectedRecipe.data && 
                selectedRecipe.data.steps && 
                Array.isArray(selectedRecipe.data.steps) && 
                selectedRecipe.data.steps.length > 0 ? (
                  <Steps
                    direction="vertical"
                    size="small"
                    current={selectedRecipe.data.steps.length}
                    className="cooking-steps"
                    progressDot={(iconDot, { index }) => (
                      <div className="step-number-icon" style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#1890ff',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {selectedRecipe.data.steps[index].stepNumber || (index + 1)}
                      </div>
                    )}
                  >
                    {selectedRecipe.data.steps.map((step, index) => (
                      <Step
                        key={index}
                        title={<Text strong>{step.title || `Bước ${step.stepNumber || (index+1)}`}</Text>}
                        description={(
                          <>
                            <Paragraph>{step.description}</Paragraph>
                            {step.image && (
                              <Image 
                                src={step.image} 
                                alt={`Bước ${step.stepNumber || (index+1)}`} 
                                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} 
                              />
                            )}
                          </>
                        )}
                      />
                    ))}
                  </Steps>
                ) : (
                  <Text type="secondary">Không có thông tin về các bước thực hiện</Text>
                )
              )}
            </div>

            <Divider>
              <span style={{ fontWeight: 600 }}>Thông tin dinh dưỡng</span>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Calories" variant="bordered">
                  <div style={{ textAlign: 'center' }}>
                    <div>{finalNutrition.calories} kcal</div>
                    <small>Giữ lại: {meal.recipe?.cookingEffect?.calo || 100}%</small>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Protein" variant="bordered">
                  <div style={{ textAlign: 'center' }}>
                    <div>{finalNutrition.protein}g</div>
                    <small>Giữ lại: {meal.recipe?.cookingEffect?.protein || 100}%</small>
                  </div>
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small" title="Carbs" variant="bordered">
                  <div style={{ textAlign: 'center' }}>
                    <div>{finalNutrition.carbs}g</div>
                    <small>Giữ lại: {meal.recipe?.cookingEffect?.carb || 100}%</small>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Fat" variant="bordered">
                  <div style={{ textAlign: 'center' }}>
                    <div>{finalNutrition.fat}g</div>
                    <small>Giữ lại: {meal.recipe?.cookingEffect?.fat || 100}%</small>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      {contextHolder}
    </Modal>
  );
};

export default DishDetailModal;