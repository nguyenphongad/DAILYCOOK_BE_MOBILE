import React from 'react';
import { Card, Input, Row, Col, InputNumber, Select, Divider, Button, Upload, Image, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';

const { TextArea } = Input;
const { Option } = Select;

const RecipeSection = ({
  formData,
  updateRecipeData,
  recipeSteps,
  setRecipeSteps,
  pastedStepImages,
  setPastedStepImages,
  stepImageFileLists,
  setStepImageFileLists,
  uploadingStepImages,
  setUploadingStepImages
}) => {

  // Helper function để render icon dinh dưỡng
  const renderNutritionIcon = (value) => {
    if (value > 100) {
      return <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: 8 }} />;
    } else if (value < 100) {
      return <ArrowDownOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />;
    }
    return null;
  };

  // Component upload button tùy chỉnh
  const uploadButton = (loading) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  // Xử lý thêm bước nấu ăn
  const handleAddStep = () => {
    const newStep = {
      stepNumber: recipeSteps.length + 1,
      title: '',
      description: '',
      recipeImage: ''
    };
    setRecipeSteps([...recipeSteps, newStep]);
  };

  // Xử lý xóa bước nấu ăn
  const handleRemoveStep = (index) => {
    const newSteps = recipeSteps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setRecipeSteps(newSteps);
  };

  // Xử lý thay đổi bước nấu ăn
  const handleStepChange = (index, field, value) => {
    const newSteps = [...recipeSteps];
    newSteps[index][field] = value;
    setRecipeSteps(newSteps);
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
          const reader = new FileReader();
          reader.onload = (event) => {
            handleStepChange(stepIndex, 'recipeImage', event.target.result);
            setPastedStepImages(prev => ({
              ...prev,
              [stepIndex]: file
            }));
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
    handleStepChange(stepIndex, 'recipeImage', '');
  };

  // Clear ảnh bước đã upload
  const clearStepImage = (stepIndex) => {
    handleStepChange(stepIndex, 'recipeImage', '');
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
        handleStepChange(stepIndex, 'recipeImage', result.secure_url);
        message.success('Upload ảnh bước thực hiện thành công!');
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
    if (newFileList.length > 0) {
      setPastedStepImages(prev => {
        const newState = { ...prev };
        delete newState[stepIndex];
        return newState;
      });
    }
  };

  return (
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

              {/* Chữ "hoặc" */}
              <div style={{ 
                fontSize: 14, 
                color: "#999", 
                fontWeight: 500,
                textAlign: "center",
                minWidth: 40
              }}>
                hoặc
              </div>

              <div style={{ flex: 1 }}>
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
                  {step.recipeImage ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image
                        src={step.recipeImage}
                        alt={`step-${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        preview={false}
                      />
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
          </div>
        </Card>
      ))}
    </Card>
  );
};

export default RecipeSection;
