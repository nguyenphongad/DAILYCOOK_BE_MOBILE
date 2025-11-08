import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Row, 
  Col, 
  Card, 
  InputNumber, 
  Space,
  Upload,
  Image,
  Divider,
  Steps,
  Typography,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  CameraOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { addMeal, updateMeal } from '../../redux/thunks/mealThunk';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

const DishForm = ({ 
  form, 
  initialValues, 
  editData,
  onFinish,
  onCancel, 
  allIngredients = [], 
  mealCategories = [],
  isEdit = false,
  selectedRecipe,
  ingredientDetails = []
}) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.meals);
  
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipeSteps, setRecipeSteps] = useState([]);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingRecipeImage, setUploadingRecipeImage] = useState(false);
  const [uploadingStepImages, setUploadingStepImages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data states thay vì dùng form
  const [formData, setFormData] = useState({
    nameMeal: '',
    description: '',
    mealCategory: '',
    mealImage: '',
    dietaryCompatibility: [],
    recipe: {
      nameRecipe: '',
      description: '',
      recipeImage: '',
      prepTimeMinutes: 15, // Thay đổi từ 0 thành 15
      cookTimeMinutes: 30, // Thay đổi từ 0 thành 30
      difficulty: 'easy',
      steps: [],
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    }
  });

  // Khởi tạo dữ liệu khi component mount hoặc khi editData thay đổi
  useEffect(() => {
    if (isEdit && editData) {
      console.log('Setting up edit data:', editData);
      
      // Set up ingredients
      if (editData.ingredients && editData.ingredients.length > 0) {
        const ingredientsForForm = editData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredientInfo: ing.ingredientInfo || allIngredients.find(item => item._id === ing.ingredient_id)
        }));
        setSelectedIngredients(ingredientsForForm);
      }

      // Set up recipe steps
      if (editData.recipe && editData.recipe.steps) {
        setRecipeSteps(editData.recipe.steps.map(step => ({
          stepNumber: step.stepNumber,
          title: step.title || '',
          description: step.description || '',
          image: step.image || ''
        })));
      }

      // Set form data
      setFormData({
        nameMeal: editData.nameMeal || '',
        description: editData.description || '',
        mealCategory: editData.mealCategory || '',
        mealImage: editData.mealImage || '',
        dietaryCompatibility: editData.dietaryCompatibility || [],
        recipe: {
          nameRecipe: editData.recipe?.nameRecipe || editData.nameMeal || '',
          description: editData.recipe?.description || '',
          recipeImage: editData.recipe?.recipeImage || editData.mealImage || '',
          prepTimeMinutes: editData.recipe?.prepTimeMinutes || 15, // Thay đổi từ 0 thành 15
          cookTimeMinutes: editData.recipe?.cookTimeMinutes || 30, // Thay đổi từ 0 thành 30
          difficulty: editData.recipe?.difficulty || 'easy',
          steps: editData.recipe?.steps || [],
          nutrition: editData.recipe?.nutrition || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }
        }
      });
    }
  }, [isEdit, editData, allIngredients]);

  // Hàm cập nhật form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Hàm cập nhật nested form data (cho recipe)
  const updateRecipeData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        [field]: value
      }
    }));
  };

  // Xử lý thêm nguyên liệu
  const handleAddIngredient = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredient_id: '', quantity: 0, unit: 'GRAM', ingredientInfo: null }
    ]);
  };

  // Xử lý xóa nguyên liệu
  const handleRemoveIngredient = (index) => {
    const newIngredients = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(newIngredients);
    form.setFieldsValue({ ingredients: newIngredients });
  };

  // Xử lý thay đổi nguyên liệu
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...selectedIngredients];
    
    if (field === 'ingredient_id') {
      const selectedIngredient = allIngredients.find(ing => ing._id === value);
      newIngredients[index] = {
        ...newIngredients[index],
        ingredient_id: value,
        ingredientInfo: selectedIngredient
      };
    } else {
      newIngredients[index][field] = value;
    }
    
    setSelectedIngredients(newIngredients);
    form.setFieldsValue({ ingredients: newIngredients });
  };

  // Xử lý thêm bước nấu ăn
  const handleAddStep = () => {
    const newStep = {
      stepNumber: recipeSteps.length + 1,
      title: '',
      description: '',
      image: ''
    };
    const newSteps = [...recipeSteps, newStep];
    setRecipeSteps(newSteps);
    
    const currentRecipe = form.getFieldValue('recipe') || {};
    form.setFieldsValue({
      recipe: { ...currentRecipe, steps: newSteps }
    });
  };

  // Xử lý xóa bước nấu ăn
  const handleRemoveStep = (index) => {
    const newSteps = recipeSteps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setRecipeSteps(newSteps);
    
    const currentRecipe = form.getFieldValue('recipe') || {};
    form.setFieldsValue({
      recipe: { ...currentRecipe, steps: newSteps }
    });
  };

  // Xử lý thay đổi bước nấu ăn
  const handleStepChange = (index, field, value) => {
    const newSteps = [...recipeSteps];
    newSteps[index][field] = value;
    setRecipeSteps(newSteps);
    
    const currentRecipe = form.getFieldValue('recipe') || {};
    form.setFieldsValue({
      recipe: { ...currentRecipe, steps: newSteps }
    });
  };

  // Xử lý upload ảnh món ăn chính
  const handleMainImageUpload = async (file) => {
    try {
      setUploadingMainImage(true);
      const realFile = convertAntdUploadFileToFile(file);
      
      if (!realFile) {
        message.error('Không thể đọc file ảnh');
        return false;
      }

      const result = await uploadImage(realFile, { folder: 'meals' });
      
      if (result && result.secure_url) {
        updateFormData('mealImage', result.secure_url);
        message.success('Upload ảnh thành công!');
      }
      
      setUploadingMainImage(false);
      return false;
    } catch (error) {
      console.error('Upload main image error:', error);
      message.error('Upload ảnh thất bại: ' + error.message);
      setUploadingMainImage(false);
      return false;
    }
  };

  // Xử lý upload ảnh công thức
  const handleRecipeImageUpload = async (file) => {
    try {
      setUploadingRecipeImage(true);
      const realFile = convertAntdUploadFileToFile(file);
      
      if (!realFile) {
        message.error('Không thể đọc file ảnh');
        return false;
      }

      const result = await uploadImage(realFile, { folder: 'recipes' });
      
      if (result && result.secure_url) {
        updateRecipeData('recipeImage', result.secure_url);
        message.success('Upload ảnh công thức thành công!');
      }
      
      setUploadingRecipeImage(false);
      return false;
    } catch (error) {
      console.error('Upload recipe image error:', error);
      message.error('Upload ảnh thất bại: ' + error.message);
      setUploadingRecipeImage(false);
      return false;
    }
  };

  // Xử lý upload ảnh bước nấu ăn
  const handleStepImageUpload = async (file, stepIndex) => {
    try {
      setUploadingStepImages(prev => ({ ...prev, [stepIndex]: true }));
      const realFile = convertAntdUploadFileToFile(file);
      
      if (!realFile) {
        message.error('Không thể đọc file ảnh');
        return false;
      }

      const result = await uploadImage(realFile, { folder: 'recipe-steps' });
      
      if (result && result.secure_url) {
        handleStepChange(stepIndex, 'image', result.secure_url);
        message.success('Upload ảnh bước thực hiện thành công!');
      }
      
      setUploadingStepImages(prev => ({ ...prev, [stepIndex]: false }));
      return false;
    } catch (error) {
      console.error('Upload step image error:', error);
      message.error('Upload ảnh thất bại: ' + error.message);
      setUploadingStepImages(prev => ({ ...prev, [stepIndex]: false }));
      return false;
    }
  };

  // Component upload button tùy chỉnh
  const uploadButton = (loading) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  // Validate form data
  const validateFormData = () => {
    const errors = [];
    
    if (!formData.nameMeal?.trim()) {
      errors.push('Tên món ăn không được để trống');
    }
    
    if (!formData.mealCategory) {
      errors.push('Vui lòng chọn danh mục');
    }
    
    if (selectedIngredients.length === 0) {
      errors.push('Vui lòng thêm ít nhất một nguyên liệu');
    }
    
    if (recipeSteps.length === 0) {
      errors.push('Vui lòng thêm ít nhất một bước nấu ăn');
    }
    
    // Validate recipe steps
    for (let i = 0; i < recipeSteps.length; i++) {
      const step = recipeSteps[i];
      if (!step.title?.trim() || !step.description?.trim()) {
        errors.push(`Bước ${i + 1}: Vui lòng điền đầy đủ tiêu đề và mô tả`);
      }
    }
    
    return errors;
  };

  // Xử lý submit bằng onClick - KHÔNG dispatch updateMeal/addMeal nữa
  const handleSubmit = async () => {
    if (isSubmitting || loading) {
      console.log('Already submitting, ignoring duplicate request');
      return;
    }

    // Validate form
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      message.error(validationErrors[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = {
        ...formData,
        ingredients: selectedIngredients,
        recipe: {
          ...formData.recipe,
          steps: recipeSteps
        }
      };
      
      // Chuyển đổi mealCategory từ ID sang keyword
      if (submitData.mealCategory && mealCategories.length > 0) {
        const selectedCategory = mealCategories.find(cat => cat._id === submitData.mealCategory);
        if (selectedCategory) {
          submitData.mealCategory = selectedCategory.keyword || selectedCategory.nameCategory || selectedCategory.title || submitData.mealCategory;
        }
      }
      
      console.log('Form submitted with data:', submitData);
      
      // CHỈ GỌI CALLBACK - không dispatch Redux action
      if (onFinish) {
        onFinish(submitData); // Trả về data để parent component xử lý
      }
      
      // Reset form nếu là thêm mới
      if (!isEdit) {
        setFormData({
          nameMeal: '',
          description: '',
          mealCategory: '',
          mealImage: '',
          dietaryCompatibility: [],
          recipe: {
            nameRecipe: '',
            description: '',
            recipeImage: '',
            prepTimeMinutes: 15, // Thay đổi từ 0 thành 15
            cookTimeMinutes: 30, // Thay đổi từ 0 thành 30
            difficulty: 'easy',
            steps: [],
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
          }
        });
        setSelectedIngredients([]);
        setRecipeSteps([]);
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dish-form-container">
      {/* Không dùng Form component, chỉ dùng layout */}
      <Row gutter={24}>
        {/* Cột trái - Thông tin cơ bản */}
        <Col span={12}>
          <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tên món ăn <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                placeholder="Nhập tên món ăn"
                value={formData.nameMeal}
                onChange={(e) => updateFormData('nameMeal', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mô tả</label>
              <TextArea
                rows={3}
                placeholder="Mô tả món ăn"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Danh mục <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                placeholder="Chọn danh mục"
                value={formData.mealCategory}
                onChange={(value) => updateFormData('mealCategory', value)}
                style={{ width: '100%' }}
              >
                {mealCategories.map(category => (
                  <Option key={category._id} value={category._id}>
                    {category.title || category.nameCategory}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Upload ảnh món ăn */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Hình ảnh món ăn</label>
              <Upload
                name="mealImage"
                listType="picture-card"
                className="meal-image-uploader"
                showUploadList={false}
                beforeUpload={handleMainImageUpload}
                accept="image/*"
              >
                {formData.mealImage ? (
                  <Image
                    src={formData.mealImage}
                    alt="meal"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    preview={false}
                  />
                ) : (
                  uploadButton(uploadingMainImage)
                )}
              </Upload>
            </div>
          </Card>

          {/* Nguyên liệu đã chọn */}
          <Card 
            title="Nguyên liệu đã chọn" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddIngredient}
              >
                Thêm nguyên liệu
              </Button>
            }
          >
            {selectedIngredients.map((ingredient, index) => (
              <div key={index} style={{ marginBottom: 16, padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                <Row gutter={8} align="middle">
                  <Col span={8}>
                    <Select
                      placeholder="Chọn nguyên liệu"
                      value={ingredient.ingredient_id}
                      onChange={(value) => handleIngredientChange(index, 'ingredient_id', value)}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                    >
                      {allIngredients.map(ing => (
                        <Option key={ing._id} value={ing._id}>
                          {ing.nameIngredient}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      placeholder="Số lượng"
                      value={ingredient.quantity}
                      onChange={(value) => handleIngredientChange(index, 'quantity', value)}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Select
                      value={ingredient.unit}
                      onChange={(value) => handleIngredientChange(index, 'unit', value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="GRAM">Gram</Option>
                      <Option value="KG">Kg</Option>
                      <Option value="ML">ML</Option>
                      <Option value="LITER">Liter</Option>
                      <Option value="PIECE">Cái</Option>
                      <Option value="PORTION">Phần</Option>
                    </Select>
                  </Col>
                  <Col span={4}>
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleRemoveIngredient(index)}
                    />
                  </Col>
                </Row>
                {ingredient.ingredientInfo && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    <Image 
                      src={ingredient.ingredientInfo.ingredientImage} 
                      width={30} 
                      height={30} 
                      style={{ marginRight: 8 }}
                    />
                    {ingredient.ingredientInfo.nameIngredient}
                  </div>
                )}
              </div>
            ))}
            
            {selectedIngredients.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                Chưa có nguyên liệu nào được chọn
              </div>
            )}
          </Card>
        </Col>

        {/* Cột phải - Công thức nấu ăn */}
        <Col span={12}>
          <Card title="Công thức nấu ăn" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Tên công thức</label>
              <Input
                placeholder="Tên công thức"
                value={formData.recipe.nameRecipe}
                onChange={(e) => updateRecipeData('nameRecipe', e.target.value)}
              />
            </div>

            {/* Upload ảnh công thức */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Hình ảnh công thức</label>
              <Upload
                name="recipeImage"
                listType="picture-card"
                className="recipe-image-uploader"
                showUploadList={false}
                beforeUpload={handleRecipeImageUpload}
                accept="image/*"
              >
                {formData.recipe.recipeImage ? (
                  <Image
                    src={formData.recipe.recipeImage}
                    alt="recipe"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    preview={false}
                  />
                ) : (
                  uploadButton(uploadingRecipeImage)
                )}
              </Upload>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Thời gian chuẩn bị (phút)
                  </label>
                  <InputNumber
                    min={0}
                    value={formData.recipe.prepTimeMinutes}
                    onChange={(value) => updateRecipeData('prepTimeMinutes', value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Thời gian nấu (phút)
                  </label>
                  <InputNumber
                    min={0}
                    value={formData.recipe.cookTimeMinutes}
                    onChange={(value) => updateRecipeData('cookTimeMinutes', value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Độ khó</label>
              <Select
                value={formData.recipe.difficulty}
                onChange={(value) => updateRecipeData('difficulty', value)}
                style={{ width: '100%' }}
              >
                <Option value="easy">Dễ</Option>
                <Option value="medium">Trung bình</Option>
                <Option value="hard">Khó</Option>
              </Select>
            </div>

            <Divider>Các bước thực hiện</Divider>
            
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={handleAddStep}
                block
              >
                Thêm bước mới
              </Button>
            </div>

            {recipeSteps.map((step, index) => (
              <Card 
                key={index}
                size="small"
                title={`Bước ${step.stepNumber}`}
                extra={
                  <Button 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />} 
                    onClick={() => handleRemoveStep(index)}
                  />
                }
                style={{ marginBottom: 12 }}
              >
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Tiêu đề bước</label>
                  <Input
                    placeholder="Tiêu đề bước"
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                  />
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Mô tả</label>
                  <TextArea
                    rows={3}
                    placeholder="Mô tả chi tiết bước thực hiện"
                    value={step.description}
                    onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Hình ảnh minh họa</label>
                  <Upload
                    name={`stepImage${index}`}
                    listType="picture-card"
                    className="step-image-uploader"
                    showUploadList={false}
                    beforeUpload={(file) => handleStepImageUpload(file, index)}
                    accept="image/*"
                  >
                    {step.image ? (
                      <Image
                        src={step.image}
                        alt={`step-${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        preview={false}
                      />
                    ) : (
                      uploadButton(uploadingStepImages[index])
                    )}
                  </Upload>
                </div>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Footer buttons */}
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={onCancel} disabled={loading || isSubmitting}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={loading || isSubmitting}
            disabled={loading || isSubmitting}
          >
            {isEdit ? 'Cập nhật' : 'Thêm món ăn'}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default DishForm;