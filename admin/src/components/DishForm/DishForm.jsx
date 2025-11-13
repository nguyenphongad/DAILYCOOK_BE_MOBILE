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
  LoadingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
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
  const measurementUnitsState = useSelector((state) => state.measurementUnits);

  const { measurementUnits = [] } = measurementUnitsState || {};

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipeSteps, setRecipeSteps] = useState([]);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingRecipeImage, setUploadingRecipeImage] = useState(false);
  const [uploadingStepImages, setUploadingStepImages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastedMainImage, setPastedMainImage] = useState(null); // ảnh món ăn được dán từ clipboard
  const [mainImageFileList, setMainImageFileList] = useState([]); // file list cho ảnh món ăn
  const [pastedRecipeImage, setPastedRecipeImage] = useState(null); // ảnh công thức được dán từ clipboard
  const [recipeImageFileList, setRecipeImageFileList] = useState([]); // file list cho ảnh công thức
  const [pastedStepImages, setPastedStepImages] = useState({}); // ảnh bước được dán từ clipboard
  const [stepImageFileLists, setStepImageFileLists] = useState({}); // file lists cho ảnh bước

  // Form data states thay vì dùng form
  const [formData, setFormData] = useState({
    nameMeal: '',
    description: '',
    mealCategory: '',
    mealImage: '',
    popularity: 1, // Thêm trường popularity với giá trị mặc định
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
        calories: 100,
        protein: 100,
        carbs: 100,
        fat: 100
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
        popularity: editData.popularity || 1, // Thêm popularity từ editData
        dietaryCompatibility: editData.dietaryCompatibility || [],
        recipe: {
          nameRecipe: editData.recipe?.nameRecipe || editData.nameMeal || '',
          description: editData.recipe?.description || '',
          recipeImage: editData.recipe?.recipeImage || '', // Bỏ fallback sang mealImage
          prepTimeMinutes: editData.recipe?.prepTimeMinutes || 15,
          cookTimeMinutes: editData.recipe?.cookTimeMinutes || 30,
          difficulty: editData.recipe?.difficulty || 'easy',
          steps: editData.recipe?.steps || [],
          nutrition: editData.recipe?.nutrition || {
            calories: 100,
            protein: 100,
            carbs: 100,
            fat: 100
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
        unit: selectedIngredient?.defaultUnit || 'GRAM', // Lấy đơn vị mặc định từ nguyên liệu
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

  // Xử lý dán ảnh món ăn từ clipboard
  const handleMainImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Tạo preview
          const reader = new FileReader();
          reader.onload = (event) => {
            updateFormData('mealImage', event.target.result);
            setPastedMainImage(file);
            // Clear file list khi dán ảnh mới
            setMainImageFileList([]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Clear ảnh món ăn đã dán
  const clearPastedMainImage = () => {
    setPastedMainImage(null);
    updateFormData('mealImage', '');
  };

  // Clear ảnh món ăn đã upload
  const clearMainImage = () => {
    updateFormData('mealImage', '');
    setMainImageFileList([]);
    setPastedMainImage(null);
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
        // Clear ảnh đã dán khi upload file mới
        setPastedMainImage(null);
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

  // Xử lý thay đổi file list ảnh món ăn
  const handleMainImageChange = ({ fileList: newFileList }) => {
    setMainImageFileList(newFileList);
    // Clear ảnh đã dán khi chọn file mới
    if (newFileList.length > 0) {
      setPastedMainImage(null);
    }
  };

  // Xử lý dán ảnh công thức từ clipboard
  const handleRecipeImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Tạo preview
          const reader = new FileReader();
          reader.onload = (event) => {
            updateRecipeData('recipeImage', event.target.result);
            setPastedRecipeImage(file);
            // Clear file list khi dán ảnh mới
            setRecipeImageFileList([]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Clear ảnh công thức đã dán
  const clearPastedRecipeImage = () => {
    setPastedRecipeImage(null);
    updateRecipeData('recipeImage', '');
  };

  // Clear ảnh công thức đã upload
  const clearRecipeImage = () => {
    updateRecipeData('recipeImage', '');
    setRecipeImageFileList([]);
    setPastedRecipeImage(null);
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
        // Clear ảnh đã dán khi upload file mới
        setPastedRecipeImage(null);
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

  // Xử lý thay đổi file list ảnh công thức
  const handleRecipeImageChange = ({ fileList: newFileList }) => {
    setRecipeImageFileList(newFileList);
    // Clear ảnh đã dán khi chọn file mới
    if (newFileList.length > 0) {
      setPastedRecipeImage(null);
    }
  };

  // Component upload button tùy chỉnh
  const uploadButton = (loading) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  // Lấy danh sách nguyên liệu chưa được chọn
  const getAvailableIngredients = (currentIndex = -1) => {
    const selectedIds = selectedIngredients
      .map((ing, index) => index !== currentIndex ? ing.ingredient_id : null)
      .filter(id => id && id !== '');

    return allIngredients.filter(ingredient =>
      !selectedIds.includes(ingredient._id)
    );
  };

  // Helper function để lấy tên đơn vị
  const getMeasureUnitLabel = (unitKey) => {
    const found = measurementUnits.find(unit => unit.key === unitKey);
    return found ? found.label : unitKey;
  };

  // Helper function để render icon dinh dưỡng
  const renderNutritionIcon = (value) => {
    if (value > 100) {
      return <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: 8 }} />;
    } else if (value < 100) {
      return <ArrowDownOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />;
    }
    return null;
  };

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

      // Upload ảnh món ăn nếu có ảnh được dán
      if (pastedMainImage) {
        const uploadResult = await uploadImage(pastedMainImage, { folder: 'meals' });
        submitData.mealImage = uploadResult.secure_url;
      }

      // Upload ảnh công thức nếu có ảnh được dán
      if (pastedRecipeImage) {
        const uploadResult = await uploadImage(pastedRecipeImage, { folder: 'recipes' });
        submitData.recipe.recipeImage = uploadResult.secure_url;
      }

      // Upload ảnh các bước nếu có ảnh được dán
      for (const stepIndex in pastedStepImages) {
        const file = pastedStepImages[stepIndex];
        if (file) {
          const uploadResult = await uploadImage(file, { folder: 'recipe-steps' });
          // Cập nhật URL ảnh cho bước tương ứng
          const stepIdx = parseInt(stepIndex);
          if (submitData.recipe.steps[stepIdx]) {
            submitData.recipe.steps[stepIdx].image = uploadResult.secure_url;
          }
        }
      }

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
          popularity: 1, // Reset popularity về 1
          dietaryCompatibility: [],
          recipe: {
            nameRecipe: '',
            description: '',
            recipeImage: '',
            prepTimeMinutes: 15,
            cookTimeMinutes: 30,
            difficulty: 'easy',
            steps: [],
            nutrition: { calories: 100, protein: 100, carbs: 100, fat: 100 }
          }
        });
        setSelectedIngredients([]);
        setRecipeSteps([]);
        setPastedMainImage(null);
        setMainImageFileList([]);
        setPastedRecipeImage(null);
        setRecipeImageFileList([]);
        setPastedStepImages({});
        setStepImageFileLists({});
      }

    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        recipeImage: selectedRecipe.data.recipeImage || '', // Không fallback sang mealImage nữa
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

  // Xử lý dán ảnh bước từ clipboard
  const handleStepImagePaste = (e, stepIndex) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Tạo preview
          const reader = new FileReader();
          reader.onload = (event) => {
            handleStepChange(stepIndex, 'image', event.target.result);
            setPastedStepImages(prev => ({
              ...prev,
              [stepIndex]: file
            }));
            // Clear file list khi dán ảnh mới
            setStepImageFileLists(prev => ({
              ...prev,
              [stepIndex]: []
            }));
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Clear ảnh bước đã dán
  const clearPastedStepImage = (stepIndex) => {
    setPastedStepImages(prev => {
      const newState = { ...prev };
      delete newState[stepIndex];
      return newState;
    });
    handleStepChange(stepIndex, 'image', '');
  };

  // Clear ảnh bước đã upload
  const clearStepImage = (stepIndex) => {
    handleStepChange(stepIndex, 'image', '');
    setStepImageFileLists(prev => ({
      ...prev,
      [stepIndex]: []
    }));
    setPastedStepImages(prev => {
      const newState = { ...prev };
      delete newState[stepIndex];
      return newState;
    });
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
        // Clear ảnh đã dán khi upload file mới
        setPastedStepImages(prev => {
          const newState = { ...prev };
          delete newState[stepIndex];
          return newState;
        });
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

  // Xử lý thay đổi file list ảnh bước
  const handleStepImageChange = ({ fileList: newFileList }, stepIndex) => {
    setStepImageFileLists(prev => ({
      ...prev,
      [stepIndex]: newFileList
    }));
    // Clear ảnh đã dán khi chọn file mới
    if (newFileList.length > 0) {
      setPastedStepImages(prev => {
        const newState = { ...prev };
        delete newState[stepIndex];
        return newState;
      });
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

            {/* Thêm trường Độ phổ biến */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Độ phổ biến <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                placeholder="Chọn độ phổ biến"
                value={formData.popularity}
                onChange={(value) => updateFormData('popularity', value)}
                style={{ width: '100%' }}
              >
                <Option value={1}>⭐ Ít phổ biến (1 sao)</Option>
                <Option value={2}>⭐⭐ Khá phổ biến (2 sao)</Option>
                <Option value={3}>⭐⭐⭐ Phổ biến (3 sao)</Option>
                <Option value={4}>⭐⭐⭐⭐ Rất phổ biến (4 sao)</Option>
                <Option value={5}>⭐⭐⭐⭐⭐ Cực kỳ phổ biến (5 sao)</Option>
              </Select>
            </div>

            {/* Upload ảnh món ăn */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Hình ảnh món ăn</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Khu vực dán ảnh */}
                <div style={{ 
                  border: "2px dashed #d9d9d9", 
                  borderRadius: 8, 
                  padding: 16,
                  textAlign: "center",
                  backgroundColor: pastedMainImage ? "#f6ffed" : "#fafafa",
                  borderColor: pastedMainImage ? "#52c41a" : "#d9d9d9"
                }}>
                  <div style={{ marginBottom: 8, color: "#666", fontSize: 14 }}>
                    Dán ảnh từ clipboard (Ctrl+V)
                  </div>
                  <input
                    type="text"
                    placeholder="Click vào đây và nhấn Ctrl+V để dán ảnh"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                      outline: "none"
                    }}
                    onPaste={handleMainImagePaste}
                    readOnly
                  />
                  {pastedMainImage && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ color: "#52c41a", fontSize: 12 }}>
                        Đã dán ảnh thành công! 
                      </span>
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={clearPastedMainImage}
                        style={{ padding: 0, marginLeft: 8 }}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "center", color: "#999", fontSize: 12 }}>
                  hoặc
                </div>

                {/* Upload từ thiết bị */}
                {isEdit ? (
                  // =============== CHẾ ĐỘ CHỈNH SỬA ===============
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Hiển thị ảnh hiện tại */}
                    {formData.mealImage && !pastedMainImage && (
                      <div style={{ textAlign: "center" }}>
                        <Image
                          src={formData.mealImage}
                          alt="Ảnh hiện tại"
                          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                          preview={true} // Preview mặc định của Ant Design
                        />
                        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                          Ảnh hiện tại
                        </div>
                      </div>
                    )}
                    
                    {/* Upload component */}
                    <Upload
                      name="mealImage"
                      listType="picture-card"
                      className="meal-image-uploader"
                      showUploadList={false}
                      beforeUpload={handleMainImageUpload}
                      onChange={handleMainImageChange}
                      fileList={mainImageFileList}
                      accept="image/*"
                      disabled={pastedMainImage !== null}
                    >
                      {pastedMainImage ? (
                        // Nếu đã dán ảnh - hiển thị ảnh đã dán
                        <Image
                          src={formData.mealImage}
                          alt="meal"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          preview={true}
                        />
                      ) : (
                        // Nút upload mới
                        uploadButton(uploadingMainImage)
                      )}
                    </Upload>
                  </div>
                ) : (
                  // =============== CHẾ ĐỘ THÊM MỚI ===============
                  <Upload
                    name="mealImage"
                    listType="picture-card"
                    className="meal-image-uploader"
                    showUploadList={false}
                    beforeUpload={handleMainImageUpload}
                    onChange={handleMainImageChange}
                    fileList={mainImageFileList}
                    accept="image/*"
                    disabled={pastedMainImage !== null}
                  >
                    {formData.mealImage ? (
                      pastedMainImage ? (
                        // Nếu là ảnh được dán - chỉ hiển thị preview đơn giản
                        <Image
                          src={formData.mealImage}
                          alt="meal"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          preview={true}
                        />
                      ) : (
                        // Nếu là ảnh upload từ máy - hiển thị với preview mặc định
                        <Image
                          src={formData.mealImage}
                          alt="meal"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          preview={true} // Sử dụng preview mặc định của Ant Design
                        />
                      )
                    ) : (
                      uploadButton(uploadingMainImage)
                    )}
                  </Upload>
                )}
              </div>
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
                  <Col span={2}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      border: '1px solid #d9d9d9'
                    }}>
                      {ingredient.ingredientInfo ? (
                        <Image
                          src={ingredient.ingredientInfo.ingredientImage}
                          width={38}
                          height={38}
                          style={{ borderRadius: '4px', objectFit: 'cover' }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          backgroundColor: '#e8e8e8', 
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#999'
                        }}>
                          Ảnh
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col span={10}>
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
                      {getAvailableIngredients(index).map(ing => (
                        <Option key={ing._id} value={ing._id}>
                          {ing.nameIngredient}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={5}>
                    <InputNumber
                      placeholder="Số lượng"
                      value={ingredient.quantity}
                      onChange={(value) => handleIngredientChange(index, 'quantity', value)}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={5}>
                    <div style={{ 
                      padding: '4px 8px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '6px',
                      backgroundColor: '#f5f5f5',
                      textAlign: 'center',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {ingredient.ingredientInfo ? 
                        getMeasureUnitLabel(ingredient.unit) : 
                        'Chọn nguyên liệu trước'
                      }
                    </div>
                  </Col>
                  <Col span={2}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveIngredient(index)}
                    />
                  </Col>
                </Row>
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

            {/* Thông tin dinh dưỡng */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tỉ lệ dinh dưỡng sau chế biến (%)
              </label>
              <Row gutter={12}>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                      Calories (%)
                      {renderNutritionIcon(formData.recipe.nutrition.calories)}
                    </label>
                    <InputNumber
                      min={0}
                      max={999}
                      value={formData.recipe.nutrition.calories}
                      onChange={(value) => updateRecipeData('nutrition', {
                        ...formData.recipe.nutrition,
                        calories: value || 100
                      })}
                      style={{ 
                        width: '100%',
                        borderColor: formData.recipe.nutrition.calories > 100 ? '#52c41a' : 
                                   formData.recipe.nutrition.calories < 100 ? '#ff4d4f' : '#d9d9d9'
                      }}
                      placeholder="100"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                      Protein (%)
                      {renderNutritionIcon(formData.recipe.nutrition.protein)}
                    </label>
                    <InputNumber
                      min={0}
                      max={999}
                      value={formData.recipe.nutrition.protein}
                      onChange={(value) => updateRecipeData('nutrition', {
                        ...formData.recipe.nutrition,
                        protein: value || 100
                      })}
                      style={{ 
                        width: '100%',
                        borderColor: formData.recipe.nutrition.protein > 100 ? '#52c41a' : 
                                   formData.recipe.nutrition.protein < 100 ? '#ff4d4f' : '#d9d9d9'
                      }}
                      placeholder="100"
                    />
                  </div>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                      Carbs (%)
                      {renderNutritionIcon(formData.recipe.nutrition.carbs)}
                    </label>
                    <InputNumber
                      min={0}
                      max={999}
                      value={formData.recipe.nutrition.carbs}
                      onChange={(value) => updateRecipeData('nutrition', {
                        ...formData.recipe.nutrition,
                        carbs: value || 100
                      })}
                      style={{ 
                        width: '100%',
                        borderColor: formData.recipe.nutrition.carbs > 100 ? '#52c41a' : 
                                   formData.recipe.nutrition.carbs < 100 ? '#ff4d4f' : '#d9d9d9'
                      }}
                      placeholder="100"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                      Fat (%)
                      {renderNutritionIcon(formData.recipe.nutrition.fat)}
                    </label>
                    <InputNumber
                      min={0}
                      max={999}
                      value={formData.recipe.nutrition.fat}
                      onChange={(value) => updateRecipeData('nutrition', {
                        ...formData.recipe.nutrition,
                        fat: value || 100
                      })}
                      style={{ 
                        width: '100%',
                        borderColor: formData.recipe.nutrition.fat > 100 ? '#52c41a' : 
                                   formData.recipe.nutrition.fat < 100 ? '#ff4d4f' : '#d9d9d9'
                      }}
                      placeholder="100"
                    />
                  </div>
                </Col>
              </Row>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Khu vực dán ảnh */}
                    <div style={{ 
                      flex: 1,
                      border: "2px dashed #d9d9d9", 
                      borderRadius: 6, 
                      padding: 8,
                      textAlign: "center",
                      backgroundColor: pastedStepImages[index] ? "#f6ffed" : "#fafafa",
                      borderColor: pastedStepImages[index] ? "#52c41a" : "#d9d9d9"
                    }}>
                      <div style={{ marginBottom: 4, color: "#666", fontSize: 10 }}>
                        📋 Dán (Ctrl+V)
                      </div>
                      <input
                        type="text"
                        placeholder="Click và Ctrl+V"
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          border: "1px solid #d9d9d9",
                          borderRadius: 3,
                          outline: "none",
                          fontSize: 10
                        }}
                        onPaste={(e) => handleStepImagePaste(e, index)}
                        readOnly
                      />
                      {pastedStepImages[index] && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{ color: "#52c41a", fontSize: 9 }}>
                            ✅ Đã dán! 
                          </span>
                          <Button 
                            type="link" 
                            size="small" 
                            onClick={() => clearPastedStepImage(index)}
                            style={{ padding: 0, marginLeft: 2, fontSize: 9 }}
                          >
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>

                    <div style={{ color: "#999", fontSize: 10, fontWeight: 500 }}>
                      hoặc
                    </div>

                    {/* Upload từ thiết bị */}
                    <Upload
                      name={`stepImage${index}`}
                      listType="picture-card"
                      className="step-image-uploader"
                      showUploadList={false}
                      beforeUpload={(file) => handleStepImageUpload(file, index)}
                      onChange={(info) => handleStepImageChange(info, index)}
                      fileList={stepImageFileLists[index] || []}
                      accept="image/*"
                      disabled={pastedStepImages[index] !== undefined}
                    >
                      {step.image ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <Image
                            src={step.image}
                            alt={`step-${index}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                          {/* Overlay với nút xóa */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s',
                            borderRadius: '8px'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = 1}
                          onMouseLeave={(e) => e.target.style.opacity = 0}
                          >
                            <Button 
                              type="primary" 
                              danger 
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                clearStepImage(index);
                              }}
                              style={{ marginBottom: 2 }}
                              size="small"
                            >
                              Xóa
                            </Button>
                            <Button 
                              type="primary" 
                              icon={<UploadOutlined />}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                            >
                              Đổi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        uploadButton(uploadingStepImages[index])
                      )}
                    </Upload>
                  </div>
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