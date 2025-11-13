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
  
  const finalNutrition = calculateFinalNutrition();

  if (!meal) return null;

  // Chuẩn bị dữ liệu đầy đủ cho form chỉnh sửa
  const prepareEditData = () => {
    if (!meal || !selectedRecipe?.data) return meal;

    // Tạo dữ liệu hoàn chỉnh cho form
    const fullMealData = {
      ...meal,
      // Thông tin cơ bản
      nameMeal: meal.nameMeal,
      description: meal.description || '',
      mealCategory: meal.mealCategory,
      mealImage: meal.mealImage || '',
      dietaryCompatibility: meal.dietaryCompatibility || [],
      
      // Thông tin nguyên liệu với chi tiết đầy đủ
      ingredients: ingredientDetails.map(detail => ({
        ingredient_id: detail.id,
        quantity: detail.quantity,
        unit: detail.unit,
        // Thêm thông tin chi tiết để form hiển thị
        ingredientInfo: {
          _id: detail.id,
          nameIngredient: detail.name,
          ingredientImage: detail.image
        }
      })),
      
      // Thông tin công thức nấu ăn
      recipe: {
        ...meal.recipe,
        // Thông tin từ selectedRecipe
        nameRecipe: selectedRecipe.data.nameRecipe || meal.nameMeal,
        description: selectedRecipe.data.description || '',
        recipeImage: selectedRecipe.data.recipeImage || meal.mealImage || '',
        prepTimeMinutes: selectedRecipe.data.prepTimeMinutes || 0,
        cookTimeMinutes: selectedRecipe.data.cookTimeMinutes || 0,
        difficulty: selectedRecipe.data.difficulty || 'easy',
        
        // Các bước thực hiện
        steps: selectedRecipe.data.steps || [],
        
        // Thông tin dinh dưỡng từ recipe
        nutrition: selectedRecipe.data.nutrition || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      }
    };

    console.log('Prepared edit data:', fullMealData);
    return fullMealData;
  };

  const handleEditClick = () => {
    // Đảm bảo có dữ liệu recipe trước khi chuyển sang chế độ edit
    if (!selectedRecipe?.data && meal?.recipe?.recipe_id) {
      // Nếu chưa có recipe data, fetch trước
      setFetchingRecipe(true);
      dispatch(fetchRecipeById(meal.recipe.recipe_id))
        .then(() => {
          setFetchingRecipe(false);
          // Sau khi fetch xong, chuẩn bị dữ liệu và chuyển sang edit mode
          setTimeout(() => {
            const editData = prepareEditData();
            form.setFieldsValue(editData);
            setIsEditing(true);
          }, 100);
        })
        .catch(error => {
          setFetchingRecipe(false);
          console.error('Error fetching recipe for edit:', error);
          // Vẫn cho phép edit nhưng không có recipe data
          const editData = prepareEditData();
          form.setFieldsValue(editData);
          setIsEditing(true);
        });
    } else {
      // Đã có recipe data, chuẩn bị và chuyển sang edit mode
      const editData = prepareEditData();
      form.setFieldsValue(editData);
      setIsEditing(true);
    }
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
        // Có thể gọi callback để refresh data nếu cần
        if (onEdit) {
          onEdit(resultAction.payload);
        }
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
      content: `Bạn có chắc chắn muốn xóa món ăn "${meal.nameMeal}" không?`,
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
    const found = mealCategories.find(cat => cat._id === categoryId);
    return found ? found.title || found.nameCategory : 'Chưa phân loại';
  };

  const showImagePreview = (image, title) => {
    setPreviewImage(image);
    setPreviewTitle(title || 'Hình ảnh');
    setImagePreviewVisible(true);
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
          {/* Phần bên trái (60%) - Thông tin cơ bản, dinh dưỡng và nguyên liệu */}
          <Col span={14}>
            <Card
              title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin cơ bản</span>}
              variant="bordered"
              style={{ marginBottom: 16 }}
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
                      <FireOutlined style={{ marginRight: 8 }} />~{finalNutrition.calories} kcal/khẩu phần
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Thay thế Card Thông tin dinh dưỡng bằng component NutritionChart */}
            <NutritionChart 
              nutrition={finalNutrition} 
              nutritionEffect={selectedRecipe?.data?.nutrition}
            />

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
                        <Text strong>{item.quantity} {getMeasureUnitLabel(item.unit)}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: 'Không có nguyên liệu nào' }}
              />
            </Card>
          </Col>

          {/* Phần bên phải (40%) - Công thức nấu ăn */}
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
                                <Button 
                                  type="default" 
                                  icon={<FileImageOutlined />}
                                  onClick={() => showImagePreview(step.image, step.title || `Bước ${step.stepNumber || (index+1)}`)}
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
                  )
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