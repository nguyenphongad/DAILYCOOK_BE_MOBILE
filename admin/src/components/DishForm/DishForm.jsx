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
  message
} from 'antd';
import {
  PlusOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';
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

  // Form data states
  const [formData, setFormData] = useState({
    nameMeal: '',
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

  // Khởi tạo dữ liệu khi component mount hoặc khi editData thay đổi
  useEffect(() => {
    if (isEdit && editData) {
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
          recipeImage: step.recipeImage || step.image || ''
        })));
      }

      // Set form data
      setFormData({
        nameMeal: editData.nameMeal || '',
        description: editData.description || '',
        mealCategory: editData.mealCategory || '',
        mealImage: editData.mealImage || '',
        popularity: editData.popularity || 1,
        dietaryCompatibility: editData.dietaryCompatibility || [],
        recipe: {
          nameRecipe: editData.recipe?.nameRecipe || editData.nameMeal || '',
          description: editData.recipe?.description || '',
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

  // Helper function để lấy tên đơn vị
  const getMeasureUnitLabel = (unitKey) => {
    const found = measurementUnits.find(unit => unit.key === unitKey);
    return found ? found.label : unitKey;
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

    for (let i = 0; i < recipeSteps.length; i++) {
      const step = recipeSteps[i];
      if (!step.title?.trim() || !step.description?.trim()) {
        errors.push(`Bước ${i + 1}: Vui lòng điền đầy đủ tiêu đề và mô tả`);
      }
    }

    return errors;
  };

  // Xử lý submit
  const handleSubmit = async () => {
    if (isSubmitting || loading) {
      return;
    }

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
          nameRecipe: formData.recipe.nameRecipe,
          description: formData.recipe.description,
          prepTimeMinutes: formData.recipe.prepTimeMinutes,
          cookTimeMinutes: formData.recipe.cookTimeMinutes,
          difficulty: formData.recipe.difficulty,
          steps: recipeSteps,
          nutrition: formData.recipe.nutrition
        }
      };

      if (pastedMainImage) {
        const uploadResult = await uploadImage(pastedMainImage, { folder: 'meals' });
        submitData.mealImage = uploadResult.secure_url;
      }

      for (const stepIndex in pastedStepImages) {
        const file = pastedStepImages[stepIndex];
        if (file) {
          const uploadResult = await uploadImage(file, { folder: 'recipe-steps' });
          const stepIdx = parseInt(stepIndex);
          if (submitData.recipe.steps[stepIdx]) {
            submitData.recipe.steps[stepIdx].recipeImage = uploadResult.secure_url;
          }
        }
      }

      if (submitData.mealCategory && mealCategories.length > 0) {
        const selectedCategory = mealCategories.find(cat => cat._id === submitData.mealCategory);
        if (selectedCategory) {
          submitData.mealCategory = selectedCategory.keyword || selectedCategory.nameCategory || selectedCategory.title || submitData.mealCategory;
        }
      }

      if (onFinish) {
        onFinish(submitData);
      }

      if (!isEdit) {
        setFormData({
          nameMeal: '',
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
        setPastedMainImage(null);
        setMainImageFileList([]);
        setPastedStepImages({});
        setStepImageFileLists({});
      }

    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dish-form-container">
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
    </div>
  );
};

export default DishForm;