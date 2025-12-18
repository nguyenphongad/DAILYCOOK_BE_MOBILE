import React, { useState, useEffect } from 'react';
import {
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
  Space,
  Upload,
  Image,
  message,
  Modal,
  Table,
  Tag,
  Descriptions,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  LoadingOutlined,
  SearchOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';
import { searchMealData } from '../../redux/thunks/mealSearchThunk';
import { clearMealSearchResults } from '../../redux/slices/mealSearchSlice';
import IngredientSection from './IngredientSection';
import RecipeSection from './RecipeSection';

const { Option } = Select;
const { TextArea } = Input;

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
  
  const mealSearchState = useSelector((state) => state.mealSearch);
  const { searchResults: mealSearchResults = [], loading: searchingMeal = false } = mealSearchState || {};

  const { measurementUnits = [] } = measurementUnitsState || {};

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipeSteps, setRecipeSteps] = useState([]);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingStepImages, setUploadingStepImages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastedMainImage, setPastedMainImage] = useState(null);
  const [mainImageFileList, setMainImageFileList] = useState([]);
  const [pastedStepImages, setPastedStepImages] = useState({});
  const [stepImageFileLists, setStepImageFileLists] = useState({});
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [mealSearchKeyword, setMealSearchKeyword] = useState('');
  const [nutritionalComponents, setNutritionalComponents] = useState([]);

  const [formData, setFormData] = useState({
    code: '', // ✅ Thêm code vào state
    nameMeal: '',
    name_en: '', // ✅ Thêm name_en vào state
    description: '',
    mealCategory: '',
    mealImage: '',
    popularity: 1,
    dietaryCompatibility: [],
    recipe: {
      nameRecipe: '',
      description: '',
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
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

  useEffect(() => {
    if (isEdit && editData) {
      if (editData.ingredients && editData.ingredients.length > 0) {
        const ingredientsForForm = editData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredientInfo: ing.ingredientInfo || allIngredients.find(item => item._id === ing.ingredient_id)
        }));
        setSelectedIngredients(ingredientsForForm);
      }

      if (editData.recipe && editData.recipe.steps) {
        setRecipeSteps(editData.recipe.steps.map(step => ({
          stepNumber: step.stepNumber,
          title: step.title || '',
          description: step.description || '',
          recipeImage: step.recipeImage || step.image || ''
        })));
      }

      setFormData({
        code: editData.code || '', // ✅ Load code khi edit
        nameMeal: editData.nameMeal || editData.name_vi || '',
        name_en: editData.name_en || '', // ✅ Load name_en khi edit
        description: editData.description || '',
        mealCategory: editData.mealCategory || '',
        mealImage: editData.mealImage || editData.image || '',
        popularity: editData.popularity || 1,
        dietaryCompatibility: editData.dietaryCompatibility || [],
        recipe: {
          nameRecipe: editData.recipe?.nameRecipe || editData.nameMeal || editData.name_vi || '',
          description: editData.recipe?.description || '',
          prepTimeMinutes: editData.recipe?.prepTimeMinutes || editData.prepTimeMinutes || 15,
          cookTimeMinutes: editData.recipe?.cookTimeMinutes || editData.cookTimeMinutes || 30,
          difficulty: editData.recipe?.difficulty || editData.difficulty || 'easy',
          steps: editData.recipe?.steps || editData.steps || [],
          nutrition: editData.recipe?.nutrition || {
            calories: 100,
            protein: 100,
            carbs: 100,
            fat: 100
          }
        }
      });

      if (editData.nutritional_components && Array.isArray(editData.nutritional_components)) {
        const mappedNutrients = editData.nutritional_components.map(comp => ({
          name: comp.name || '',
          nameEn: comp.nameEn || '',
          amount: parseFloat(comp.amount) || 0,
          unit: comp.unit_name || ''
        }));
        setNutritionalComponents(mappedNutrients);
      }
    }
  }, [isEdit, editData, allIngredients]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateRecipeData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        [field]: value
      }
    }));
  };

  const getMeasureUnitLabel = (unitKey) => {
    const found = measurementUnits.find(unit => unit.key === unitKey);
    return found ? found.label : unitKey;
  };

  const handleMainImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            updateFormData('mealImage', event.target.result);
            setPastedMainImage(file);
            setMainImageFileList([]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const clearPastedMainImage = () => {
    setPastedMainImage(null);
    updateFormData('mealImage', '');
  };

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

  const handleMainImageChange = ({ fileList: newFileList }) => {
    setMainImageFileList(newFileList);
    if (newFileList.length > 0) {
      setPastedMainImage(null);
    }
  };

  const uploadButton = (loading) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const validateFormData = () => {
    const errors = [];
    if (!formData.nameMeal?.trim()) errors.push('Tên món ăn không được để trống');
    if (!formData.mealCategory) errors.push('Vui lòng chọn danh mục');
    if (selectedIngredients.length === 0) errors.push('Vui lòng thêm ít nhất một nguyên liệu');
    if (recipeSteps.length === 0) errors.push('Vui lòng thêm ít nhất một bước nấu ăn');

    for (let i = 0; i < recipeSteps.length; i++) {
      const step = recipeSteps[i];
      if (!step.title?.trim() || !step.description?.trim()) {
        errors.push(`Bước ${i + 1}: Vui lòng điền đầy đủ tiêu đề và mô tả`);
      }
    }
    return errors;
  };

  const handleSearchMeal = async () => {
    if (!mealSearchKeyword.trim()) {
      message.warning('Vui lòng nhập tên món ăn để tìm kiếm');
      return;
    }

    try {
      const result = await dispatch(searchMealData({
        keyword: mealSearchKeyword.trim(),
        page: 1,
        pageSize: 15,
        energy: 0
      })).unwrap();
      
      if (result && result.length > 0) {
        message.success(`Tìm thấy ${result.length} kết quả`);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSelectMealData = (mealData) => {
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    if (mealData.nutritional_components && Array.isArray(mealData.nutritional_components)) {
      const mappedNutrients = mealData.nutritional_components.map(comp => ({
        name: comp.name || '',
        nameEn: comp.nameEn || '',
        amount: parseFloat(comp.amount) || 0,
        unit: comp.unit_name || ''
      }));

      setNutritionalComponents(mappedNutrients);

      mealData.nutritional_components.forEach(comp => {
        const nameEn = comp.nameEn?.toLowerCase() || '';
        const amount = parseFloat(comp.amount) || 0;

        if (nameEn === 'protein') protein = amount;
        else if (nameEn === 'carbohydrate') carbs = amount;
        else if (nameEn === 'fat') fat = amount;
      });
    }

    setFormData(prev => ({
      ...prev,
      code: mealData.code || '', // ✅ Lấy code từ API
      nameMeal: mealData.name_vi || '',
      name_en: mealData.name_en || '',
      description: mealData.description || '',
      mealImage: mealData.image || '',
      // popularity giữ nguyên (không lấy từ viendinhduong vì họ không có field này)
      recipe: {
        ...prev.recipe,
        nameRecipe: mealData.name_vi || '',
        prepTimeMinutes: mealData.prepTimeMinutes || 15,
        cookTimeMinutes: mealData.cookTimeMinutes || 30,
        difficulty: mealData.difficulty || 'easy',
        nutrition: {
          calories: parseFloat(mealData.total_energy) || 0,
          protein,
          carbs,
          fat
        }
      }
    }));

    if (mealData.dish_components && mealData.dish_components.length > 0) {
      const ingredientsFromMeal = mealData.dish_components.map(comp => ({
        ingredient_id: null,
        quantity: comp.amount || 0,
        unit: comp.unit || 'gram',
        ingredientInfo: {
          nameIngredient: comp.name,
          defaultUnit: comp.unit || 'gram'
        }
      }));
      setSelectedIngredients(ingredientsFromMeal);
    }

    if (mealData.steps && mealData.steps.length > 0) {
      const stepsFromMeal = mealData.steps.map(step => ({
        stepNumber: step.stepNumber,
        title: step.title || '',
        description: step.description || '',
        recipeImage: step.image || ''
      }));
      setRecipeSteps(stepsFromMeal);
    }

    setMealModalVisible(false);
    dispatch(clearMealSearchResults());
    setMealSearchKeyword('');
    message.success('Đã tự động điền thông tin món ăn!');
  };

  const handleCloseMealModal = () => {
    setMealModalVisible(false);
    dispatch(clearMealSearchResults());
    setMealSearchKeyword('');
  };

  const mealSearchColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Tên món ăn', dataIndex: 'name_vi', key: 'name_vi', width: 250 },
    { title: 'Danh mục', dataIndex: 'category_name', key: 'category_name', width: 150 },
    { title: 'Năng lượng', dataIndex: 'total_energy', key: 'total_energy', width: 100, render: (val) => `${val || 0} kcal` },
    { title: 'Nguyên liệu', dataIndex: 'dish_components', key: 'dish_components', width: 100, render: (c) => <Tag color="blue">{c?.length || 0}</Tag> },
    { title: 'Bước nấu', dataIndex: 'steps', key: 'steps', width: 100, render: (s) => <Tag color="green">{s?.length || 0}</Tag> },
    { title: 'Dinh dưỡng', dataIndex: 'nutritional_components', key: 'nutritional_components', width: 100, render: (c) => <Tag color="orange">{c?.length || 0}</Tag> },
    { title: 'Hành động', key: 'action', width: 120, fixed: 'right', render: (_, record) => <Button type="primary" size="small" onClick={() => handleSelectMealData(record)}>Chọn</Button> }
  ];

  const addNutritionalComponent = () => {
    setNutritionalComponents([...nutritionalComponents, { name: '', nameEn: '', amount: 0, unit: '' }]);
  };

  const updateNutritionalComponent = (index, field, value) => {
    const updated = [...nutritionalComponents];
    updated[index][field] = value;
    setNutritionalComponents(updated);
  };

  const removeNutritionalComponent = (index) => {
    setNutritionalComponents(nutritionalComponents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (isSubmitting || loading) return;

    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      message.error(validationErrors[0]);
      return;
    }

    try {
      setIsSubmitting(true);

      // ============= UPLOAD ẢNH CHÍNH LÊN CLOUDINARY =============
      let uploadedMainImage = formData.mealImage;

      // Nếu có ảnh đã dán (paste)
      if (pastedMainImage) {
        message.info('Đang upload ảnh chính...');
        const uploadResult = await uploadImage(pastedMainImage, { folder: 'meals' });
        uploadedMainImage = uploadResult.secure_url;
        message.success('Upload ảnh chính thành công!');
      } 
      // Nếu có file upload từ device
      else if (mainImageFileList.length > 0) {
        const file = convertAntdUploadFileToFile(mainImageFileList[0]);
        if (file) {
          message.info('Đang upload ảnh chính...');
          const uploadResult = await uploadImage(file, { folder: 'meals' });
          uploadedMainImage = uploadResult.secure_url;
          message.success('Upload ảnh chính thành công!');
        }
      }
      // Nếu đang edit và giữ nguyên ảnh cũ
      else if (!uploadedMainImage && isEdit && editData?.mealImage) {
        uploadedMainImage = editData.mealImage;
      }

      // ============= UPLOAD ẢNH CÁC BƯỚC NẤU ĂN =============
      const stepsWithUploadedImages = [...recipeSteps];

      for (let i = 0; i < stepsWithUploadedImages.length; i++) {
        const step = stepsWithUploadedImages[i];
        
        // Kiểm tra nếu có ảnh đã dán cho bước này
        if (pastedStepImages[i]) {
          try {
            message.info(`Đang upload ảnh bước ${i + 1}...`);
            const uploadResult = await uploadImage(pastedStepImages[i], { folder: 'recipe-steps' });
            stepsWithUploadedImages[i].image = uploadResult.secure_url;
            stepsWithUploadedImages[i].recipeImage = uploadResult.secure_url;
            message.success(`Upload ảnh bước ${i + 1} thành công!`);
          } catch (error) {
            message.error(`Lỗi upload ảnh bước ${i + 1}: ${error.message}`);
          }
        }
        // Kiểm tra nếu có file upload từ device cho bước này
        else if (stepImageFileLists[i] && stepImageFileLists[i].length > 0) {
          try {
            const file = convertAntdUploadFileToFile(stepImageFileLists[i][0]);
            if (file) {
              message.info(`Đang upload ảnh bước ${i + 1}...`);
              const uploadResult = await uploadImage(file, { folder: 'recipe-steps' });
              stepsWithUploadedImages[i].image = uploadResult.secure_url;
              stepsWithUploadedImages[i].recipeImage = uploadResult.secure_url;
              message.success(`Upload ảnh bước ${i + 1} thành công!`);
            }
          } catch (error) {
            message.error(`Lỗi upload ảnh bước ${i + 1}: ${error.message}`);
          }
        }
      }

      // ============= CHUẨN BỊ DỮ LIỆU SUBMIT =============
      const submitData = {
        code: formData.code || undefined, // ✅ Gửi code (nếu có)
        nameMeal: formData.nameMeal,
        name_en: formData.name_en,
        description: formData.description,
        image: uploadedMainImage, // Sử dụng URL đã upload
        category_id: formData.mealCategory,
        total_energy: formData.recipe?.nutrition?.calories || 0,
        ingredients: selectedIngredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        nutritional_components: nutritionalComponents.map(nutrient => ({
          name: nutrient.name,
          nameEn: nutrient.nameEn,
          amount: nutrient.amount,
          unit_name: nutrient.unit
        })),
        prepTimeMinutes: formData.recipe.prepTimeMinutes,
        cookTimeMinutes: formData.recipe.cookTimeMinutes,
        difficulty: formData.recipe.difficulty,
        steps: stepsWithUploadedImages.map((step, index) => ({
          stepNumber: step.stepNumber || (index + 1),
          title: step.title,
          description: step.description,
          image: step.image || step.recipeImage || ''
        })),
        popularity: formData.popularity, // ✅ Gửi popularity
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };

      console.log('📤 Submit data:', submitData);

      // Gọi callback onFinish
      if (onFinish) {
        await onFinish(submitData);
      }

      // Reset form nếu là chế độ thêm mới
      if (!isEdit) {
        setFormData({
          nameMeal: '',
          name_en: '',
          description: '',
          mealCategory: '',
          mealImage: '',
          popularity: 1,
          dietaryCompatibility: [],
          recipe: {
            nameRecipe: '',
            description: '',
            prepTimeMinutes: 15,
            cookTimeMinutes: 30,
            difficulty: 'easy',
            steps: [],
            nutrition: { calories: 100, protein: 100, carbs: 100, fat: 100 }
          }
        });
        setSelectedIngredients([]);
        setRecipeSteps([]);
        setNutritionalComponents([]);
        setPastedMainImage(null);
        setMainImageFileList([]);
        setPastedStepImages({});
        setStepImageFileLists({});
      }
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      message.error(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dish-form-container">
      {/* Nút tìm kiếm món ăn */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="dashed"
          icon={<SearchOutlined />}
          onClick={() => setMealModalVisible(true)}
        >
          Lấy thông tin món ăn từ viendinhduong.vn
        </Button>
      </div>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
            {/* Mã món ăn */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Mã món ăn
              </label>
              <Input
                placeholder="Nhập mã món ăn (tùy chọn)"
                value={formData.code}
                onChange={(e) => updateFormData('code', e.target.value)}
              />
            </div>

            {/* Tên món ăn tiếng Việt */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tên món ăn (VI) <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                placeholder="Nhập tên món ăn tiếng Việt"
                value={formData.nameMeal}
                onChange={(e) => updateFormData('nameMeal', e.target.value)}
              />
            </div>

            {/* Tên món ăn tiếng Anh */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tên món ăn (EN)
              </label>
              <Input
                placeholder="Nhập tên món ăn tiếng Anh"
                value={formData.name_en}
                onChange={(e) => updateFormData('name_en', e.target.value)}
              />
            </div>

            {/* Mô tả */}
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
              
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ 
                  flex: 1,
                  border: "2px dashed #d9d9d9", 
                  borderRadius: 8, 
                  padding: 12,
                  textAlign: "center",
                  backgroundColor: pastedMainImage ? "#f6ffed" : "#fafafa",
                  borderColor: pastedMainImage ? "#52c41a" : "#d9d9d9"
                }}>
                  <div style={{ marginBottom: 8, color: "#666", fontSize: 12 }}>
                    📋 Dán ảnh (Ctrl+V)
                  </div>
                  <input
                    type="text"
                    placeholder="Click và nhấn Ctrl+V"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                      outline: "none",
                      fontSize: 12
                    }}
                    onPaste={handleMainImagePaste}
                    readOnly
                  />
                  {pastedMainImage && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ color: "#52c41a", fontSize: 11 }}>
                        ✅ Đã dán! 
                      </span>
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={clearPastedMainImage}
                        style={{ padding: 0, marginLeft: 4, fontSize: 11 }}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>

                <div style={{ 
                  fontSize: 14, 
                  color: "#999", 
                  fontWeight: 500,
                  textAlign: "center",
                  minWidth: 40
                }}>
                  hoặc
                </div>

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
                    <Image
                      src={formData.mealImage}
                      alt="meal"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      preview={true}
                    />
                  ) : (
                    uploadButton(uploadingMainImage)
                  )}
                </Upload>
              </div>
            </div>
          </Card>

          {/* Component nguyên liệu */}
          <IngredientSection
            selectedIngredients={selectedIngredients}
            setSelectedIngredients={setSelectedIngredients}
            allIngredients={allIngredients}
            measurementUnits={measurementUnits}
            getMeasureUnitLabel={getMeasureUnitLabel}
          />
        </Col>

        {/* Cột phải - Component công thức nấu ăn */}
        <Col span={12}>
          {/* Thông tin dinh dưỡng chi tiết */}
          <Card 
            title={<strong>Thông tin dinh dưỡng chi tiết</strong>} 
            style={{ marginBottom: 16 }}
          >
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 12 }}>
              {nutritionalComponents.map((nutrient, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Row gutter={8}>
                    <Col span={11}>
                      <Input
                        placeholder="Tên (VI)"
                        size="small"
                        value={nutrient.name}
                        onChange={(e) => updateNutritionalComponent(index, 'name', e.target.value)}
                      />
                    </Col>
                    <Col span={11}>
                      <Input
                        placeholder="Tên (EN)"
                        size="small"
                        value={nutrient.nameEn}
                        onChange={(e) => updateNutritionalComponent(index, 'nameEn', e.target.value)}
                      />
                    </Col>
                    <Col span={2}>
                      <MinusCircleOutlined
                        onClick={() => removeNutritionalComponent(index)}
                        style={{ color: 'red', fontSize: 16, cursor: 'pointer' }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={8} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <InputNumber
                        placeholder="Giá trị"
                        style={{ width: '100%' }}
                        size="small"
                        min={0}
                        value={nutrient.amount}
                        onChange={(value) => updateNutritionalComponent(index, 'amount', value)}
                      />
                    </Col>
                    <Col span={12}>
                      <Input
                        placeholder="Đơn vị (g, mg, μg)"
                        size="small"
                        value={nutrient.unit}
                        onChange={(e) => updateNutritionalComponent(index, 'unit', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
            <Button
              type="dashed"
              onClick={addNutritionalComponent}
              block
              icon={<PlusOutlined />}
            >
              Thêm thành phần dinh dưỡng
            </Button>
          </Card>

          {/* Component công thức nấu ăn */}
          <RecipeSection
            formData={formData}
            updateRecipeData={updateRecipeData}
            recipeSteps={recipeSteps}
            setRecipeSteps={setRecipeSteps}
            pastedStepImages={pastedStepImages}
            setPastedStepImages={setPastedStepImages}
            stepImageFileLists={stepImageFileLists}
            setStepImageFileLists={setStepImageFileLists}
            uploadingStepImages={uploadingStepImages}
            setUploadingStepImages={setUploadingStepImages}
          />
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

      {/* Modal tìm kiếm món ăn */}
      <Modal
        title="Tìm kiếm món ăn từ viendinhduong.vn"
        open={mealModalVisible}
        onCancel={handleCloseMealModal}
        width={1400}
        footer={null}
      >
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="Nhập tên món ăn để tìm kiếm..."
            value={mealSearchKeyword}
            onChange={(e) => setMealSearchKeyword(e.target.value)}
            onPressEnter={handleSearchMeal}
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={handleSearchMeal}
            loading={searchingMeal}
          >
            Tìm kiếm
          </Button>
        </Space.Compact>

        <Table
          columns={mealSearchColumns}
          dataSource={Array.isArray(mealSearchResults) ? mealSearchResults : []}
          rowKey={(record) => record._id || record.code}
          loading={searchingMeal}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300, y: 400 }}
          locale={{ emptyText: mealSearchKeyword ? 'Không tìm thấy kết quả phù hợp' : 'Nhập từ khóa để tìm kiếm' }}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Mô tả" span={2}>{record.description || 'Không có'}</Descriptions.Item>
                  <Descriptions.Item label="Tên tiếng Anh">{record.name_en || 'Không có'}</Descriptions.Item>
                  <Descriptions.Item label="Danh mục (EN)">{record.category_name_en || 'Không có'}</Descriptions.Item>
                  <Descriptions.Item label="Thời gian chuẩn bị">{record.prepTimeMinutes || 0} phút</Descriptions.Item>
                  <Descriptions.Item label="Thời gian nấu">{record.cookTimeMinutes || 0} phút</Descriptions.Item>
                  <Descriptions.Item label="Độ khó">{record.difficulty || 'Không rõ'}</Descriptions.Item>
                  <Descriptions.Item label="Khu vực ẩm thực">{record.food_area_id || 'Không rõ'}</Descriptions.Item>
                </Descriptions>

                {record.nutritional_components && record.nutritional_components.length > 0 && (
                  <Card title={<strong>Thành phần dinh dưỡng chi tiết</strong>} size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 8]}>
                      {record.nutritional_components.map((nutrient, index) => (
                        <Col span={6} key={index}>
                          <Card size="small" hoverable>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                {nutrient.name}
                                {nutrient.nameEn && nutrient.nameEn !== nutrient.name && <div style={{ fontSize: 11, fontStyle: 'italic' }}>({nutrient.nameEn})</div>}
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>{nutrient.amount || 0} {nutrient.unit_name || ''}</div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                )}

                {record.dish_components && record.dish_components.length > 0 && (
                  <Card title={<strong>Nguyên liệu ({record.dish_components.length})</strong>} size="small">
                    <Row gutter={[8, 8]}>
                      {record.dish_components.map((ingredient, index) => (
                        <Col span={12} key={index}>
                          <Tag color="blue" style={{ width: '100%', textAlign: 'left', padding: '4px 8px' }}>• {ingredient.name}: {ingredient.amount || 0} {ingredient.unit || ''}</Tag>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                )}
              </div>
            )
          }}
        />
      </Modal>
    </div>
  );
};

export default DishForm;
