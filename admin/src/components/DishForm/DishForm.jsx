import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Button, Row, Col, Upload, InputNumber, Divider, List, Card, Typography, Avatar, message, Spin } from 'antd';
import { PlusOutlined, CloseOutlined, UploadOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addMeal } from '../../redux/thunks/mealThunk';
import { fetchIngredients } from '../../redux/thunks/ingredientThunk';
import { fetchMealCategories } from '../../redux/thunks/mealCategoryThunk';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';
import { clearError, setSuccess } from '../../redux/slices/mealSlice';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// Component hiển thị từng bước công thức
const StepCard = React.memo(({ step, index, updateStep, removeStep }) => {
  const handleTitleChange = (e) => updateStep(index, 'title', e.target.value);
  const handleDescriptionChange = (e) => updateStep(index, 'description', e.target.value);
  const handleImageChange = (info) => {
    if (info.fileList.length > 0) {
      updateStep(index, 'image', info.fileList[0]);
    }
  };
  
  return (
    <Card
      key={index}
      size="small"
      title={<span style={{ fontWeight: 600 }}>{`Bước ${step.stepNumber}`}</span>}
      style={{ marginBottom: 16 }}
      variant="bordered"
      extra={
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => removeStep(index)}
        />
      }
    >
      <Input
        placeholder="Tiêu đề bước"
        value={step.title}
        style={{ marginBottom: 8 }}
        onChange={handleTitleChange}
      />
      <TextArea
        rows={3}
        placeholder="Mô tả chi tiết các thao tác"
        value={step.description}
        style={{ marginBottom: 8 }}
        onChange={handleDescriptionChange}
      />
      <Upload
        listType="picture-card"
        maxCount={1}
        beforeUpload={() => false}
        onChange={handleImageChange}
        defaultFileList={step.image ? [
          {
            uid: `-${index}`,
            name: `step${index}.png`,
            status: 'done',
            url: step.image,
          }
        ] : []}
      >
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Ảnh bước thực hiện</div>
        </div>
      </Upload>
    </Card>
  );
});

const DishForm = ({ form = Form.useForm()[0], initialValues = null, isEdit = false, onCancel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // ----------- REDUX STATE -----------
  const { loading, error, success } = useSelector(state => state.meals);
  const { ingredients: allIngredients } = useSelector(state => state.ingredients);
  const mealCategoriesState = useSelector(state => state.mealCategories);
  const mealCategories = mealCategoriesState?.mealCategories || [];
  
  // ----------- LOCAL STATE -----------
  // Quản lý thành phần
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [steps, setSteps] = useState([{ stepNumber: 1, title: '', description: '', image: '' }]);
  const [ingredientTypeFilter, setIngredientTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  
  // Quản lý UI
  const [submitting, setSubmitting] = useState(false);
  
  // Quản lý ảnh
  const [fileList, setFileList] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  
  // ----------- EFFECTS -----------
  // Fetch dữ liệu nguyên liệu và danh mục khi component mount
  useEffect(() => {
    dispatch(fetchIngredients());
    dispatch(fetchMealCategories({ page: 1, limit: 100 }));
  }, [dispatch]);
  
  // Xử lý thành công/lỗi từ Redux
  useEffect(() => {
    if (success) {
      message.success('Thêm món ăn thành công!');
      dispatch(setSuccess(false));
      
      // Đóng modal nếu có hàm onCancel được truyền vào
      if (typeof onCancel === 'function') {
        onCancel();
      } else {
        navigate('/manage_meal');
      }
    }
    
    if (error) {
      message.error('Lỗi: ' + error);
      dispatch(clearError());
    }
  }, [success, error, dispatch, navigate, onCancel]);
  
  // Khởi tạo form và ảnh dựa trên initialValues nếu có
  useEffect(() => {
    if (initialValues) {
      // Set giá trị form từ initialValues
      form.setFieldsValue({
        nameMeal: initialValues.nameMeal || '',
        mealCategory: initialValues.mealCategory || '',
        difficulty: initialValues.difficulty || 'medium',
        servings: initialValues.portionSize || 4,
        prepTimeMinutes: initialValues.recipe?.prepTimeMinutes || 15,
        cookTimeMinutes: initialValues.recipe?.cookTimeMinutes || 30,
        description: initialValues.description || '',
        nutrition: {
          calories: initialValues.recipe?.cookingEffect?.calo || 0,
          protein: initialValues.recipe?.cookingEffect?.protein || 0,
          carbs: initialValues.recipe?.cookingEffect?.carb || 0,
          fat: initialValues.recipe?.cookingEffect?.fat || 0
        }
      });
      
      // Set ingredients nếu có
      if (initialValues.ingredients && initialValues.ingredients.length > 0) {
        setSelectedIngredients(initialValues.ingredients.map(ing => ({
          id: ing.ingredient_id,
          name: ing.name || '',
          amount: ing.quantity || 0,
          unit: ing.unit || 'g',
          originalData: ing
        })));
      }
      
      // Set steps nếu có
      if (initialValues.recipe && initialValues.recipe.steps && initialValues.recipe.steps.length > 0) {
        setSteps(initialValues.recipe.steps.map(step => ({
          stepNumber: step.stepNumber || 1,
          title: step.title || '',
          description: step.description || '',
          image: step.image || ''
        })));
      } else {
        setSteps([{ stepNumber: 1, title: '', description: '', image: '' }]);
      }
      
      // Thiết lập ảnh ban đầu nếu có
      if (initialValues.mealImage) {
        setImageUrl(initialValues.mealImage);
        setFileList([
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: initialValues.mealImage,
          }
        ]);
      }
    }
  }, [initialValues, form]);
  
  // ----------- TÍNH TOÁN -----------
  // Tính toán tổng dinh dưỡng từ tất cả nguyên liệu đã chọn
  const calculateTotalNutrition = () => {
    if (!Array.isArray(selectedIngredients) || selectedIngredients.length === 0 || !Array.isArray(allIngredients)) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    selectedIngredients.forEach(ingredient => {
      const ingredientDetail = allIngredients.find(i => i._id === ingredient.id);
      if (!ingredientDetail || !ingredientDetail.nutrition) return;
      
      const ratio = ingredient.amount / (ingredientDetail.defaultAmount || 100);
      
      totals.calories += (ingredientDetail.nutrition.calories || 0) * ratio;
      totals.protein += (ingredientDetail.nutrition.protein || 0) * ratio;
      totals.carbs += (ingredientDetail.nutrition.carbs || 0) * ratio;
      totals.fat += (ingredientDetail.nutrition.fat || 0) * ratio;
    });
    
    return totals;
  };
  
  // Hàm tính tỉ lệ giảm dinh dưỡng sau khi nấu
  const calculateCookingEffect = (totalNutrition, effectPercentages) => {
    return {
      calo: Math.max(0, totalNutrition.calories * (effectPercentages.calories / 100)),
      protein: Math.max(0, totalNutrition.protein * (effectPercentages.protein / 100)),
      carb: Math.max(0, totalNutrition.carbs * (effectPercentages.carbs / 100)),
      fat: Math.max(0, totalNutrition.fat * (effectPercentages.fat / 100))
    };
  };
  
  // ----------- HANDLERS -----------
  // Xử lý khi nhấn nút "Hủy"
  const handleCancel = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    } else {
      navigate('/manage_meal');
    }
  };
  
  // Xử lý khi thay đổi ảnh
  const handleImageChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    if (newFileList.length === 0) {
      setImageUrl("");
    } else if (newFileList[0].url) {
      setImageUrl(newFileList[0].url);
    }
  };
  
  // Xử lý thêm món ăn
  const handleAddMeal = async () => {
    try {
      // Lấy giá trị hiện tại của form trước khi validate
      const currentValues = form.getFieldsValue();
      
      // Kiểm tra dữ liệu form trước khi xử lý
      const formValues = await form.validateFields()
        .catch(error => {
          // Lấy tất cả các trường lỗi và hiển thị message
          const fieldErrors = error.errorFields || [];
          if (fieldErrors.length > 0) {
            // Lấy thông báo lỗi đầu tiên để hiển thị
            const firstError = fieldErrors[0];
            const errorMsg = firstError.errors[0] || 'Vui lòng kiểm tra lại các trường bắt buộc';
            message.error(errorMsg);
          } else {
            message.error('Vui lòng kiểm tra lại các trường bắt buộc');
          }
          return null;
        });
      
      if (!formValues) return; // Dừng nếu form không hợp lệ
      
      // Sửa kiểm tra dựa trên giá trị hiện tại của form, không phải dựa trên formValues
      if (!currentValues.nameMeal || currentValues.nameMeal.trim() === '') {
        message.error('Vui lòng nhập tên món ăn');
        return;
      }
      
      if (!currentValues.mealCategory) {
        message.error('Vui lòng chọn danh mục món ăn');
        return;
      }
      
      // Với InputNumber, kiểm tra theo kiểu khác để đảm bảo nhận ra cả 0
      if (currentValues.prepTimeMinutes === undefined || currentValues.prepTimeMinutes === null) {
        message.error('Vui lòng nhập thời gian chuẩn bị');
        return;
      }
      
      if (currentValues.cookTimeMinutes === undefined || currentValues.cookTimeMinutes === null) {
        message.error('Vui lòng nhập thời gian nấu');
        return;
      }
      
      if (!currentValues.difficulty) {
        message.error('Vui lòng chọn độ khó');
        return;
      }
      
      // Kiểm tra xem có ảnh món ăn không
      if (fileList.length === 0 && !imageUrl) {
        message.error('Vui lòng tải lên ảnh món ăn');
        return;
      }
      
      setSubmitting(true);
      
      // Kiểm tra xem các bước có đủ tiêu đề và mô tả không
      const invalidSteps = steps.filter(step => !step.title || !step.description);
      if (invalidSteps.length > 0) {
        message.error('Vui lòng nhập đầy đủ tiêu đề và mô tả cho tất cả các bước.');
        setSubmitting(false);
        return;
      }
      
      // Kiểm tra xem có nguyên liệu nào được chọn không
      if (selectedIngredients.length === 0) {
        message.error('Vui lòng chọn ít nhất một nguyên liệu.');
        setSubmitting(false);
        return;
      }
      
      // Upload hình ảnh món ăn lên Cloudinary
      let mealImageUrl = "";
      
      // Nếu có file ảnh mới, upload lên Cloudinary
      if (fileList.length > 0) {
        const imageFile = fileList[0];
        
        if (imageFile.originFileObj) {
          try {
            const file = convertAntdUploadFileToFile(imageFile.originFileObj);
            
            if (file) {
              const uploadResult = await uploadImage(file, { folder: 'meals' });
              mealImageUrl = uploadResult.secure_url;
            }
          } catch (uploadError) {
            message.error('Không thể tải lên hình ảnh món ăn: ' + uploadError.message);
            setSubmitting(false);
            return;
          }
        } else if (imageFile.url) {
          mealImageUrl = imageFile.url;
        }
      } else if (imageUrl) {
        // Giữ nguyên URL ảnh cũ nếu không có ảnh mới
        mealImageUrl = imageUrl;
      }
      
      // Upload hình ảnh các bước
      const processedSteps = await Promise.all(
        steps.map(async (step, index) => {
          let stepImageUrl = "";
          
          if (step.image && typeof step.image === 'object') {
            if (step.image.originFileObj) {
              try {
                const file = convertAntdUploadFileToFile(step.image.originFileObj);
                if (file) {
                  const uploadResult = await uploadImage(file, { folder: 'steps' });
                  stepImageUrl = uploadResult.secure_url;
                }
              } catch (error) {
                // Bỏ qua lỗi upload ảnh bước
              }
            } else if (step.image.url) {
              stepImageUrl = step.image.url;
            }
          } else if (typeof step.image === 'string') {
            stepImageUrl = step.image;
          }
          
          return {
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            image: stepImageUrl
          };
        })
      );
      
      // Chuẩn bị dữ liệu nguyên liệu
      const ingredientsData = selectedIngredients.map(ingredient => ({
        ingredient_id: ingredient.id,
        quantity: ingredient.amount || 0,
        unit: ingredient.unit || ""
      }));
      
      // Lấy tỉ lệ giảm dinh dưỡng từ form
      const nutritionEffectPercentages = {
        calories: formValues.nutrition?.calories || 100,
        protein: formValues.nutrition?.protein || 100, 
        carbs: formValues.nutrition?.carbs || 100,
        fat: formValues.nutrition?.fat || 100
      };
      
      // Chuẩn bị dữ liệu món ăn
      const mealData = {
        nameMeal: currentValues.nameMeal,
        description: currentValues.description || '',
        mealCategory: currentValues.mealCategory || "main_course",
        mealImage: mealImageUrl,
        portionSize: currentValues.servings || 4, 
        dietaryCompatibility: [],
        ingredients: ingredientsData,
        recipe: {
          nameRecipe: currentValues.nameMeal,
          description: currentValues.description || '',
          recipeImage: mealImageUrl,
          prepTimeMinutes: currentValues.prepTimeMinutes || 0,
          cookTimeMinutes: currentValues.cookTimeMinutes || 0,
          difficulty: currentValues.difficulty || 'medium',
          steps: processedSteps,
          cookingEffect: {
            calo: nutritionEffectPercentages.calories,
            protein: nutritionEffectPercentages.protein, 
            carb: nutritionEffectPercentages.carbs,
            fat: nutritionEffectPercentages.fat
          }
        },
        popularity: 0,
        isActive: true
      };
      
      // Gọi API thêm món ăn thông qua Redux thunk
      const resultAction = await dispatch(addMeal(mealData));
      
      // Kiểm tra kết quả từ API
      if (resultAction.meta && resultAction.meta.requestStatus === 'fulfilled') {
        message.success('Thêm món ăn thành công!');
        
        // Đóng modal nếu có hàm onCancel được truyền vào
        if (typeof onCancel === 'function') {
          onCancel();
        } else {
          // Chuyển hướng sau khi thêm thành công nếu không có onCancel
          navigate('/manage_meal');
        }
      } else {
        // Xử lý lỗi
        const errorMsg = resultAction.error?.message || 'Đã xảy ra lỗi';
        message.error('Không thể thêm món ăn: ' + errorMsg);
      }
    } catch (error) {
      message.error('Có lỗi xảy ra: ' + (error.message || 'Vui lòng kiểm tra lại các trường bắt buộc'));
    } finally {
      setSubmitting(false);
    }
  };
  
  // ----------- INGREDIENT HANDLERS -----------
  const addIngredient = (ingredient) => {
    const newIngredient = {
      id: ingredient._id,
      name: ingredient.nameIngredient,
      amount: ingredient.defaultAmount || 1,
      unit: ingredient.defaultUnit || 'g',
      originalData: ingredient
    };
    setSelectedIngredients([...selectedIngredients, newIngredient]);
  };
  
  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.id !== ingredientId));
  };
  
  const updateIngredientAmount = (id, amount) => {
    setSelectedIngredients(selectedIngredients.map(item => 
      item.id === id ? { ...item, amount } : item
    ));
  };
  
  // ----------- STEP HANDLERS -----------
  const addStep = useCallback(() => {
    setSteps(prevSteps => [
      ...prevSteps, 
      {
        stepNumber: prevSteps.length + 1,
        title: '',
        description: '',
        image: ''
      }
    ]);
  }, []);

  const updateStep = useCallback((index, field, value) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return newSteps;
    });
  }, []);

  const removeStep = useCallback((index) => {
    if (steps.length <= 1) return;
    
    setSteps(prevSteps => {
      const newSteps = prevSteps
        .filter((_, i) => i !== index)
        .map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
      
      return newSteps;
    });
  }, [steps.length]);

  // ----------- DERIVED DATA -----------
  // Lọc ra các nguyên liệu chưa được chọn
  const filteredIngredients = Array.isArray(allIngredients) ? 
    allIngredients.filter(
      ingredient => 
        !selectedIngredients.some(item => item.id === ingredient._id) &&
        (ingredientTypeFilter === 'all' || ingredient.type === ingredientTypeFilter) &&
        (searchText === '' || ingredient.nameIngredient.toLowerCase().includes(searchText.toLowerCase()))
    ) : [];

  // Lấy danh sách loại nguyên liệu độc nhất
  const ingredientTypes = Array.isArray(allIngredients) ? 
    ['all', ...new Set(allIngredients.map(ingredient => ingredient.type).filter(Boolean))] : 
    ['all'];
  
  // Hiển thị loading nếu đang tải dữ liệu
  if (!allIngredients || !mealCategories) {
    return <Spin tip="Đang tải dữ liệu..." />;
  }
  
  // ----------- RENDER -----------
  return (
    <Spin spinning={loading || submitting}>
      <Card title={isEdit ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}>
        <Form
          form={form}
          layout="vertical"
          className="dish-form"
          requiredMark={true} // Hiển thị dấu * cho các trường bắt buộc
        >
          <Row gutter={24}>
            {/* Phần bên trái (60%) */}
            <Col span={14}>
              <Card 
                title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin cơ bản</span>} 
                variant="bordered"
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="nameMeal"
                      label="Tên món ăn"
                      rules={[{ 
                        required: true, 
                        message: 'Vui lòng nhập tên món ăn',
                        validateTrigger: [] // Không hiển thị lỗi trên UI
                      }]}
                    >
                      <Input placeholder="Nhập tên món ăn" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="difficulty"
                      label="Độ khó"
                      rules={[{ required: true, message: 'Vui lòng chọn độ khó' }]}
                      initialValue="medium"
                    >
                      <Select placeholder="Chọn độ khó">
                        <Option value="easy">Dễ</Option>
                        <Option value="medium">Trung bình</Option>
                        <Option value="hard">Khó</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="mealCategory"
                  label="Danh mục món ăn"
                  rules={[{ 
                    required: true, 
                    message: 'Vui lòng chọn danh mục món ăn',
                    validateTrigger: [] // Không hiển thị lỗi trên UI
                  }]}
                  initialValue="main_course"
                >
                  <Select placeholder="Chọn danh mục món ăn">
                    {Array.isArray(mealCategories) && mealCategories.length > 0 ? (
                      mealCategories.map(category => (
                        <Option key={category._id} value={category.keyword || category._id}>
                          {category.title}
                        </Option>
                      ))
                    ) : (
                      <Option value="main_course">Món chính</Option>
                    )}
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="prepTimeMinutes"
                      label="Thời gian chuẩn bị (phút)"
                      initialValue={15}
                      rules={[{ 
                        required: true, 
                        message: 'Vui lòng nhập thời gian chuẩn bị',
                        validateTrigger: [], // Không hiển thị lỗi trên UI
                        // Thêm validator tùy chỉnh để tránh lỗi validate sai với InputNumber
                        validator: (_, value) => {
                          if (value !== undefined && value !== null) {
                            return Promise.resolve();
                          }
                          return Promise.reject('Vui lòng nhập thời gian chuẩn bị');
                        }
                      }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="cookTimeMinutes"
                      label="Thời gian nấu (phút)"
                      initialValue={30}
                      rules={[{ 
                        required: true, 
                        message: 'Vui lòng nhập thời gian nấu',
                        validateTrigger: [], // Không hiển thị lỗi trên UI
                        // Thêm validator tùy chỉnh để tránh lỗi validate sai với InputNumber
                        validator: (_, value) => {
                          if (value !== undefined && value !== null) {
                            return Promise.resolve();
                          }
                          return Promise.reject('Vui lòng nhập thời gian nấu');
                        }
                      }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="description"
                  label="Mô tả món ăn"
                >
                  <TextArea rows={3} placeholder="Mô tả ngắn gọn về món ăn" />
                </Form.Item>

                <Form.Item
                  label="Hình ảnh món ăn"
                  required={true} // Thêm required để hiển thị dấu *
                  rules={[{ required: true, message: 'Vui lòng tải lên ảnh món ăn' }]}
                >
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    fileList={fileList}
                    onChange={handleImageChange}
                    beforeUpload={() => false}
                  >
                    {fileList.length >= 1 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Tải lên ảnh</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Card>

              <Divider />

              <Card 
                title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Nguyên liệu <span style={{ color: '#ff4d4f' }}>*</span></span>} 
                variant="bordered"
              >
                <div style={{ marginBottom: 16 }}>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={16}>
                      <Input 
                        placeholder="Tìm kiếm nguyên liệu..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </Col>
                    <Col span={8}>
                      <Select 
                        style={{ width: '100%' }}
                        placeholder="Lọc loại nguyên liệu"
                        value={ingredientTypeFilter}
                        onChange={setIngredientTypeFilter}
                      >
                        {ingredientTypes.map(type => (
                          <Option key={type} value={type}>
                            {type === 'all' ? 'Tất cả loại' : type}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>
                  
                  <Text strong style={{ fontSize: '15px' }}>Chọn nguyên liệu:</Text>
                  <List
                    bordered
                    dataSource={filteredIngredients}
                    renderItem={ingredient => (
                      <List.Item
                        key={ingredient._id}
                        style={{ cursor: 'pointer', padding: '8px 16px' }}
                        onClick={() => addIngredient(ingredient)}
                        actions={[
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              addIngredient(ingredient);
                            }}
                          >
                            Thêm
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              size={40} 
                              src={ingredient.ingredientImage} 
                              shape="square"
                              style={{ marginRight: 8 }}
                            >
                              {!ingredient.ingredientImage && ingredient.nameIngredient?.charAt(0)}
                            </Avatar>
                          }
                          title={ingredient.nameIngredient}
                        />
                      </List.Item>
                    )}
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                    locale={{ emptyText: 'Không tìm thấy nguyên liệu phù hợp' }}
                  />
                </div>

                <Divider orientation="left">
                  <span style={{ fontWeight: 600 }}>Nguyên liệu đã chọn</span>
                </Divider>
                
                <List
                  size="small"
                  bordered
                  dataSource={selectedIngredients}
                  renderItem={item => (
                    <List.Item 
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<CloseOutlined />} 
                          onClick={() => removeIngredient(item.id)}
                        />
                      ]}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Avatar 
                          size={32} 
                          src={item.originalData?.ingredientImage}
                          shape="square"
                          style={{ marginRight: 8 }}
                        >
                          {!item.originalData?.ingredientImage && item.name?.charAt(0)}
                        </Avatar>
                        <div style={{ flex: 1 }}>{item.name}</div>
                        <div style={{ width: 120 }}>
                          <InputNumber 
                            min={1} 
                            value={item.amount} 
                            onChange={(value) => updateIngredientAmount(item.id, value)}
                            style={{ width: 70 }}
                          /> {item.unit}
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'Chưa có nguyên liệu nào được chọn' }}
                />
              </Card>
            </Col>

            {/* Phần bên phải (40%) */}
            <Col span={10}>
              <Card 
                title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Công thức nấu ăn</span>} 
                variant="bordered"
              >
                <Form.Item 
                  label={<span style={{ fontWeight: 600 }}>Các bước thực hiện <span style={{ color: '#ff4d4f' }}>*</span></span>}
                  required={true} // Thêm required để hiển thị dấu *
                >
                  {steps.map((step, index) => (
                    <StepCard 
                      key={`step-${index}-${step.stepNumber}`}
                      step={step}
                      index={index}
                      updateStep={updateStep}
                      removeStep={removeStep}
                    />
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={addStep} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Thêm bước
                  </Button>
                </Form.Item>

                <Divider>
                  <span style={{ fontWeight: 600 }}>Phần trăm dinh dưỡng giữ lại sau khi nấu:</span>
                </Divider>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name={['nutrition', 'calories']} 
                      label="Calories (%)"
                      initialValue={100}
                      help="Phần trăm dinh dưỡng giữ lại sau khi nấu"
                    >
                      <InputNumber 
                        min={0} 
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name={['nutrition', 'protein']} 
                      label="Protein (%)"
                      initialValue={100}
                      help="Phần trăm dinh dưỡng giữ lại sau khi nấu"
                    >
                      <InputNumber 
                        min={0} 
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name={['nutrition', 'carbs']} 
                      label="Carbs (%)"
                      initialValue={100}
                      help="Phần trăm dinh dưỡng giữ lại sau khi nấu"
                    >
                      <InputNumber 
                        min={0} 
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name={['nutrition', 'fat']} 
                      label="Fat (%)"
                      initialValue={100}
                      help="Phần trăm dinh dưỡng giữ lại sau khi nấu"
                    >
                      <InputNumber 
                        min={0} 
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button style={{ marginRight: 8 }} onClick={handleCancel} disabled={submitting || loading}>
              Hủy
            </Button>
            <Button 
              type="primary"
              loading={submitting || loading}
              onClick={handleAddMeal}
            >
              {isEdit ? 'Lưu thay đổi' : 'Thêm món ăn'}
            </Button>
          </div>
        </Form>
      </Card>
    </Spin>
  );
};

// Wrap component with memo để tránh re-render không cần thiết
export default React.memo(DishForm);