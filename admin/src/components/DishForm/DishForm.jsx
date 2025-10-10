import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Row, Col, Upload, InputNumber, Divider, List, Card, Typography, Avatar, message, Spin } from 'antd';
import { PlusOutlined, CloseOutlined, UploadOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addMeal } from '../../redux/thunks/mealThunk';
import { fetchIngredients } from '../../redux/thunks/ingredientThunk';
import { fetchMealCategories } from '../../redux/thunks/mealCategoryThunk'; // Import fetchMealCategories
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';
import { clearError, setSuccess } from '../../redux/slices/mealSlice';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const DishForm = ({ form = Form.useForm()[0], initialValues = null, isEdit = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ Redux store
  const { loading, error, success } = useSelector(state => state.meals);
  const { ingredients: allIngredients } = useSelector(state => state.ingredients);
  const mealCategoriesState = useSelector(state => state.mealCategories);
  
  // Debug selector
  console.log("MealCategories state:", mealCategoriesState);
  
  // Lấy ra mealCategories một cách an toàn
  const mealCategories = mealCategoriesState?.mealCategories || [];
  console.log("Extracted mealCategories:", mealCategories);
  
  // State nội bộ
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [steps, setSteps] = useState([{ stepNumber: 1, title: '', description: '', image: '' }]);
  const [ingredientTypeFilter, setIngredientTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch dữ liệu nguyên liệu và danh mục khi component mount
  useEffect(() => {
    dispatch(fetchIngredients());
    dispatch(fetchMealCategories({ page: 1, limit: 100 })); // Fetch tất cả danh mục món ăn
  }, [dispatch]);
  
  // Xử lý thành công/lỗi từ Redux
  useEffect(() => {
    if (success) {
      message.success('Thêm món ăn thành công!');
      dispatch(setSuccess(false));
      navigate('/meal-management');
    }
    
    if (error) {
      message.error('Lỗi: ' + error);
      dispatch(clearError());
    }
  }, [success, error, dispatch, navigate]);
  
  // Khởi tạo form dựa trên initialValues nếu có
  useEffect(() => {
    if (initialValues) {
      // Set giá trị form từ initialValues - hiển thị tất cả các trường
      form.setFieldsValue({
        nameMeal: initialValues.nameMeal || '',
        mealCategory: initialValues.mealCategory || '', // Thêm mealCategory
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
    }
  }, [initialValues, form]);
  
  const handleCancel = () => {
    navigate('/manage_meal');
  };
  
  const handleAddMeal = async () => {
    try {
      // Kiểm tra dữ liệu form trước khi xử lý
      const formValues = await form.validateFields()
        .catch(error => {
          console.log("Form validation errors:", error);
          message.error('Vui lòng kiểm tra lại các trường bắt buộc');
          return null;
        });
      
      if (!formValues) return; // Dừng nếu form không hợp lệ
      
      console.log("Form validated with values:", formValues);
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
      console.log("Starting image uploads...");
      let mealImageUrl = "";
      if (formValues.recipeImage && formValues.recipeImage.fileList && formValues.recipeImage.fileList.length > 0) {
        const imageFile = formValues.recipeImage.fileList[0];
        if (imageFile.originFileObj) {
          try {
            console.log("Uploading meal image...");
            const file = convertAntdUploadFileToFile(imageFile.originFileObj);
            if (file) {
              const uploadResult = await uploadImage(file, { folder: 'meals' });
              mealImageUrl = uploadResult.secure_url;
              console.log('Uploaded meal image successfully:', mealImageUrl);
            }
          } catch (uploadError) {
            console.error('Error uploading meal image:', uploadError);
            message.error('Không thể tải lên hình ảnh món ăn');
            setSubmitting(false);
            return;
          }
        } else if (imageFile.url) {
          mealImageUrl = imageFile.url;
        }
      }
      
      // Upload hình ảnh các bước
      console.log("Processing steps images...");
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
                  console.log(`Uploaded step ${index+1} image:`, stepImageUrl);
                }
              } catch (error) {
                console.error(`Error uploading step ${index+1} image:`, error);
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
      
      // Chuẩn bị dữ liệu dinh dưỡng chính xác theo model
      const cookingEffect = {
        calo: formValues.nutrition?.calories || 0,
        protein: formValues.nutrition?.protein || 0, 
        carb: formValues.nutrition?.carbs || 0,
        fat: formValues.nutrition?.fat || 0
      };
      
      // ĐẢM BẢO CÁC TRƯỜNG BẮT BUỘC THEO YÊU CẦU API
      const mealData = {
        nameMeal: formValues.nameMeal,
        description: formValues.description || '',
        mealCategory: formValues.mealCategory || "main_course", // Sử dụng giá trị đã chọn
        mealImage: mealImageUrl,
        portionSize: formValues.servings || 4, 
        dietaryCompatibility: [],
        ingredients: ingredientsData,
        recipe: {
          nameRecipe: formValues.nameMeal,
          description: formValues.description || '',
          recipeImage: mealImageUrl,
          prepTimeMinutes: formValues.prepTimeMinutes || 0,
          cookTimeMinutes: formValues.cookTimeMinutes || 0,
          difficulty: formValues.difficulty || 'medium',
          steps: processedSteps,
          cookingEffect: cookingEffect
        },
        popularity: 0,
        isActive: true
      };
      
      console.log('Calling API with data:', JSON.stringify(mealData, null, 2));
      
      // Gọi API thêm món ăn thông qua Redux thunk
      const resultAction = await dispatch(addMeal(mealData));
      console.log('API result:', resultAction);
      
      // Kiểm tra kết quả từ API
      if (resultAction.meta && resultAction.meta.requestStatus === 'fulfilled') {
        console.log('Meal added successfully!');
        message.success('Thêm món ăn thành công!');
        // Chuyển hướng sau khi thêm thành công
        navigate('/manage_meal');
      } else {
        // Xử lý lỗi
        const errorMsg = resultAction.error?.message || 'Đã xảy ra lỗi';
        console.error('Error adding meal:', errorMsg);
        message.error('Không thể thêm món ăn: ' + errorMsg);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      message.error('Có lỗi xảy ra khi thêm món ăn');
    } finally {
      setSubmitting(false);
    }
  };
  
  const addIngredient = (ingredient) => {
    const newIngredient = {
      id: ingredient._id, // Sử dụng _id từ API response
      name: ingredient.nameIngredient, // Sử dụng nameIngredient thay vì name
      amount: ingredient.defaultAmount || 1,
      unit: ingredient.defaultUnit || 'g',
      originalData: ingredient // Lưu trữ dữ liệu gốc nếu cần
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
  
  const addStep = () => {
    setSteps([...steps, { 
      stepNumber: steps.length + 1, 
      title: '', 
      description: '', 
      image: ''
    }]);
  };
  
  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };
  
  const removeStep = (index) => {
    if (steps.length <= 1) return;
    
    const newSteps = steps.filter((_, i) => i !== index)
      .map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    
    setSteps(newSteps);
  };
  
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
  
  return (
    <Spin spinning={loading || submitting}>
      <Card title="Thêm món ăn mới">
        <Form
          form={form}
          layout="vertical"
          className="dish-form"
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
                      rules={[{ required: true, message: 'Vui lòng nhập tên món ăn' }]}
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

                {/* Thêm mục chọn danh mục món ăn */}
                <Form.Item
                  name="mealCategory"
                  label="Danh mục món ăn"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục món ăn' }]}
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
                      rules={[{ required: true, message: 'Vui lòng nhập thời gian chuẩn bị' }]}
                      initialValue={15}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="cookTimeMinutes"
                      label="Thời gian nấu (phút)"
                      rules={[{ required: true, message: 'Vui lòng nhập thời gian nấu' }]}
                      initialValue={30}
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
                  name="recipeImage"
                  label="Hình ảnh món ăn"
                >
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    defaultFileList={initialValues?.mealImage ? [
                      {
                        uid: '-1',
                        name: 'image.png',
                        status: 'done',
                        url: initialValues.mealImage,
                      }
                    ] : []}
                  >
                    <Button icon={<UploadOutlined />}>Tải lên ảnh</Button>
                  </Upload>
                </Form.Item>
              </Card>

              <Divider />

              <Card 
                title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Nguyên liệu</span>} 
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
                <Form.Item label={<span style={{ fontWeight: 600 }}>Các bước thực hiện</span>}>
                  {steps.map((step, index) => (
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
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                      />
                      <TextArea
                        rows={3}
                        placeholder="Mô tả chi tiết các thao tác"
                        value={step.description}
                        style={{ marginBottom: 8 }}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                      />
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={info => {
                          if (info.fileList.length > 0) {
                            updateStep(index, 'image', info.fileList[0])
                          }
                        }}
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
                  <span style={{ fontWeight: 600 }}>Phần trăm dinh dưỡng tăng/giảm sau khi nấu:</span>
                </Divider>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name={['nutrition', 'calories']} 
                      label="Calories (%)"
                      initialValue={0}
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
                      initialValue={0}
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
                      initialValue={0}
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
                      initialValue={0}
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

export default DishForm;
