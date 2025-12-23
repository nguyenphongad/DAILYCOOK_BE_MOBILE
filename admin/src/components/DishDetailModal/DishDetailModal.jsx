import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Image, Typography, Divider, Descriptions, Tag, Card, List, Steps, Button, Form, Avatar, Spin } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FireOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecipeById } from '../../redux/thunks/recipeThunk';
import { updateMeal, deleteMeal } from '../../redux/thunks/mealThunk';
import { fetchMeasurementUnits } from '../../redux/thunks/measurementUnitsThunk';
import DishForm from '../DishForm/DishForm';
import NutritionChart from './NutritionChart';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const DishDetailModal = ({ isVisible, onClose, meal, onEdit, onDelete, allIngredients, mealCategories }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [ingredientDetails, setIngredientDetails] = useState([]);
  const [fetchingRecipe, setFetchingRecipe] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Selector để lấy measurementUnits
  const measurementUnitsState = useSelector((state) => state.measurementUnits);
  const { measurementUnits = [] } = measurementUnitsState || {};

  // Helper function để lấy tên đơn vị
  const getMeasureUnitLabel = (unitKey) => {
    const found = measurementUnits.find(unit => unit.key === unitKey);
    return found ? found.label : unitKey;
  };
  
  // Lấy chi tiết công thức từ Redux store
  const { selectedRecipe, loading: recipeLoading } = useSelector(state => state.recipes);
  
  // Fetch measurementUnits khi component mount
  useEffect(() => {
    dispatch(fetchMeasurementUnits());
  }, [dispatch]);
  
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
          unit: ing.unit || 'g', // Giữ nguyên unit key, không convert ở đây
          image: ingredientInfo?.ingredientImage || ''
        };
      });
      setIngredientDetails(details);
    }
  }, [meal, allIngredients]); // Bỏ measurementUnits khỏi dependency

  // Tính toán tổng dinh dưỡng từ nutritional_components của meal
  const calculateTotalNutrition = () => {
    if (!meal || !meal.nutritional_components || meal.nutritional_components.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    meal.nutritional_components.forEach(nutrient => {
      const nameEn = (nutrient.nameEn || nutrient.name).toLowerCase();
      const amount = parseFloat(nutrient.amount) || 0;
      
      if (nameEn.includes('energy') || nameEn.includes('năng lượng')) {
        totals.calories += amount;
      } else if (nameEn.includes('protein') || nameEn.includes('đạm')) {
        totals.protein += amount;
      } else if (nameEn.includes('carbohydrate') || nameEn.includes('glucid')) {
        totals.carbs += amount;
      } else if (nameEn.includes('fat') || nameEn.includes('lipid')) {
        totals.fat += amount;
      }
    });
    
    return totals;
  };

  // Sử dụng total_energy trực tiếp từ meal
  const finalNutrition = {
    calories: meal?.total_energy || calculateTotalNutrition().calories || 0,
    protein: calculateTotalNutrition().protein,
    carbs: calculateTotalNutrition().carbs,
    fat: calculateTotalNutrition().fat
  };

  // Tính dinh dưỡng sau khi áp dụng cooking effect từ recipe nutrition
  const calculateFinalNutrition = () => {
    const totalNutrition = calculateTotalNutrition();
    // Sử dụng nutrition từ selectedRecipe thay vì cookingEffect
    const nutritionEffect = selectedRecipe?.data?.nutrition || { calories: 100, protein: 100, carbs: 100, fat: 100 };
    
    return {
      calories: (totalNutrition.calories * (nutritionEffect.calories / 100)).toFixed(1),
      protein: (totalNutrition.protein * (nutritionEffect.protein / 100)).toFixed(1),
      carbs: (totalNutrition.carbs * (nutritionEffect.carbs / 100)).toFixed(1),
      fat: (totalNutrition.fat * (nutritionEffect.fat / 100)).toFixed(1)
    };
  };
  
  // Chuẩn bị dữ liệu đầy đủ cho form chỉnh sửa
  const prepareEditData = () => {
    if (!meal) return null;

    // Tạo dữ liệu hoàn chỉnh cho form
    const fullMealData = {
      ...meal,
      // Thông tin cơ bản
      nameMeal: meal.nameMeal,
      name_en: meal.name_en,
      description: meal.description || '',
      mealCategory: meal.category_id || meal.mealCategory,
      mealImage: meal.image || meal.mealImage || '',
      popularity: meal.popularity || 1,
      
      // Thông tin nguyên liệu với chi tiết đầy đủ
      ingredients: ingredientDetails.map(detail => ({
        ingredient_id: detail.id,
        quantity: detail.quantity,
        unit: detail.unit,
        ingredientInfo: {
          _id: detail.id,
          nameIngredient: detail.name,
          ingredientImage: detail.image
        }
      })),
      
      // Thông tin công thức nấu ăn từ meal.steps
      recipe: {
        nameRecipe: meal.nameMeal || meal.name_vi,
        description: meal.description || '',
        prepTimeMinutes: meal.prepTimeMinutes || 0,
        cookTimeMinutes: meal.cookTimeMinutes || 0,
        difficulty: meal.difficulty || 'easy',
        steps: meal.steps || [],
        nutrition: {
          calories: finalNutrition.calories,
          protein: finalNutrition.protein,
          carbs: finalNutrition.carbs,
          fat: finalNutrition.fat
        }
      }
    };

    console.log('Prepared edit data:', fullMealData);
    return fullMealData;
  };

  const handleEditClick = () => {
    const editData = prepareEditData();
    form.setFieldsValue(editData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSaveEdit = async (submitData) => {
    try {
      console.log('Saving edited values:', submitData);
      
      // CHỈ DISPATCH updateMeal ở đây - DishForm không dispatch nữa
      const resultAction = await dispatch(updateMeal({
        id: meal._id,
        mealData: submitData
      }));
      
      if (updateMeal.fulfilled.match(resultAction)) {
        // Cập nhật thành công
        setIsEditing(false);
        
        // QUAN TRỌNG: Fetch lại meal detail để cập nhật ảnh mới
        await dispatch(fetchMealById(meal._id));
        
        // Gọi callback để refresh data nếu cần
        if (onEdit) {
          onEdit(resultAction.payload);
        }
        
        // Đóng modal sau khi cập nhật thành công
        onClose();
      } else {
        // Xử lý lỗi nếu cần
        console.error('Update failed:', resultAction.error);
      }
    } catch (error) {
      console.error('Error updating meal:', error);
    }
  };

  // Xóa món ăn (hiện modal confirm)
  const handleDelete = () => {
    if (!meal) return;

    modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa món ăn "${meal?.nameMeal || 'món ăn này'}" không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          // Dispatch deleteMeal thunk thay vì gọi callback
          const resultAction = await dispatch(deleteMeal(meal._id));
          
          if (deleteMeal.fulfilled.match(resultAction)) {
            // Xóa thành công, đóng modal
            onClose();
            // Có thể gọi callback để refresh data nếu cần
            if (onDelete) {
              onDelete(meal._id);
            }
          } else {
            // Xử lý lỗi nếu cần
            console.error('Delete failed:', resultAction.error);
          }
        } catch (error) {
          console.error('Error deleting meal:', error);
        }
      }
    });
  };

  const getCategoryTitle = (categoryId) => {
    if (!meal) return 'Chưa phân loại';
    
    // Tìm theo category_id hoặc mealCategory
    const found = mealCategories.find(cat => 
      cat._id === categoryId || 
      cat._id === meal?.category_id || 
      cat._id === meal?.mealCategory
    );
    return found ? found.title || found.nameCategory : meal?.category_name || 'Chưa phân loại';
  };

  const showImagePreview = (image, title) => {
    setPreviewImage(image);
    setPreviewTitle(title || 'Hình ảnh');
    setImagePreviewVisible(true);
  };

  // Hàm render sao cho popularity
  const renderPopularityStars = (popularity) => {
    const stars = [];
    const actualPopularity = popularity || 1; // Sử dụng giá trị thực từ dữ liệu
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= actualPopularity ? '#FFD700' : '#E0E0E0', fontSize: '16px' }}>
          ⭐
        </span>
      );
    }
    return stars;
  };

  // Hàm lấy text mô tả popularity
  const getPopularityText = (popularity) => {
    const actualPopularity = popularity || 1;
    switch (actualPopularity) {
      case 1: return 'Ít phổ biến';
      case 2: return 'Khá phổ biến';
      case 3: return 'Phổ biến';
      case 4: return 'Rất phổ biến';
      case 5: return 'Cực kỳ phổ biến';
      default: return 'Chưa đánh giá';
    }
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
        destroyOnClose={false} // Không destroy để giữ lại dữ liệu form
      >
        <DishForm
          form={form}
          initialValues={meal} // Truyền meal gốc
          editData={prepareEditData()} // Truyền thêm editData đã chuẩn bị
          onFinish={handleSaveEdit}
          onCancel={handleCancelEdit}
          allIngredients={allIngredients || []}
          mealCategories={mealCategories || []}
          isEdit={true}
          // Truyền thêm các prop cần thiết cho việc edit
          selectedRecipe={selectedRecipe}
          ingredientDetails={ingredientDetails}
        />
      </Modal>
    );
  }

  // Hiển thị thông tin chi tiết món ăn
  return (
    <>
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
          <Col span={14}>
            <Card
              title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin cơ bản</span>}
              variant="bordered"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={10}>
                  <div className="dish-image-container">
                    {(meal?.image || meal?.mealImage) ? (
                      <Image
                        src={meal.image || meal.mealImage}
                        alt={meal?.nameMeal || meal?.name_vi || 'Món ăn'}
                        className="dish-image"
                        style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '300px', 
                        backgroundColor: '#f0f0f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: '8px'
                      }}>
                        <Text type="secondary">Không có ảnh</Text>
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={14}>
                  <Title level={3}>{meal?.nameMeal || meal?.name_vi || 'Không có tên'}</Title>
                  <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                    {getCategoryTitle(meal?.category_id || meal?.mealCategory)}
                  </Tag>
                  <Paragraph>{meal?.description || 'Không có mô tả'}</Paragraph>

                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={<strong>Thời gian chuẩn bị</strong>}>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      {meal?.prepTimeMinutes || 0} phút
                    </Descriptions.Item>
                    <Descriptions.Item label={<strong>Thời gian nấu</strong>}>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      {meal?.cookTimeMinutes || 0} phút
                    </Descriptions.Item>
                    <Descriptions.Item label={<strong>Tổng thời gian</strong>}>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      {(meal?.prepTimeMinutes || 0) + (meal?.cookTimeMinutes || 0)} phút
                    </Descriptions.Item>
                    <Descriptions.Item label={<strong>Số thành phần</strong>}>
                      {ingredientDetails?.length || 0} nguyên liệu
                    </Descriptions.Item>
                    <Descriptions.Item label={<strong>Độ khó</strong>}>
                      <StarOutlined style={{ marginRight: 8 }} />
                      {meal?.difficulty === 'easy' ? 'Dễ' :
                      meal?.difficulty === 'medium' ? 'Trung bình' :
                      meal?.difficulty === 'hard' ? 'Khó' : 'Không xác định'}
                    </Descriptions.Item>
                    <Descriptions.Item label={<strong>Calories</strong>}>
                      <FireOutlined style={{ marginRight: 8 }} />~{finalNutrition?.calories || 0} kcal/khẩu phần
                    </Descriptions.Item>
                    <Descriptions.Item label={<strong>Độ phổ biến</strong>}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                          ({meal?.popularity || 1}/5)
                        </span>
                        <Text type="secondary">- {getPopularityText(meal?.popularity)}</Text>
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Component NutritionChart */}
            <NutritionChart 
              nutrition={finalNutrition}
              nutritionalComponents={meal?.nutritional_components || []}
            />

            <Card
              title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Nguyên liệu</span>}
              variant="bordered"
            >
              <List
                bordered
                dataSource={ingredientDetails || []}
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
                        <Text strong>{item.quantity} {getMeasureUnitLabel(item.unit)}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: 'Không có nguyên liệu nào' }}
              />
            </Card>
          </Col>

          {/* Phần bên phải - Công thức nấu ăn */}
          <Col span={10}>
            <Card
              title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Công thức nấu ăn</span>}
              variant="bordered"
            >
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: '15px', marginBottom: 16, display: 'block' }}>
                  Các bước thực hiện
                </Text>
                
                {meal?.steps && Array.isArray(meal.steps) && meal.steps.length > 0 ? (
                  <Steps
                    direction="vertical"
                    size="small"
                    current={meal.steps.length}
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
                        {meal.steps[index]?.stepNumber || (index + 1)}
                      </div>
                    )}
                  >
                    {meal.steps.map((step, index) => (
                      <Step
                        key={index}
                        title={<Text strong>{step?.title || `Bước ${step?.stepNumber || (index+1)}`}</Text>}
                        description={(
                          <>
                            <Paragraph>{step?.description || ''}</Paragraph>
                            {step?.image && (
                              <Button 
                                type="default" 
                                icon={<FileImageOutlined />}
                                onClick={() => showImagePreview(step.image, step.title || `Bước ${step?.stepNumber || (index+1)}`)}
                              >
                                Xem ảnh
                              </Button>
                            )}
                          </>
                        )}
                      />
                    ))}
                  </Steps>
                ) : (
                  <Text type="secondary">Không có thông tin về các bước thực hiện</Text>
                )}
              </div>
            </Card>
          </Col>
        </Row>
        {contextHolder}
      </Modal>

      {/* Modal hiển thị ảnh khi nhấp vào "Xem ảnh" */}
      <Modal
        open={imagePreviewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setImagePreviewVisible(false)}
        centered
      >
        <img alt={previewTitle} style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default DishDetailModal;