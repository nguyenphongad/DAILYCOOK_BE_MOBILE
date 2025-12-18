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

      {/* Các bước thực hiện */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '14px' }}>
          Các bước thực hiện
        </label>
        
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {recipeSteps.map((step, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <span style={{ fontWeight: 500, fontSize: '13px' }}>
                  Bước {step.stepNumber}
                </span>
              }
              extra={
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveStep(index)}
                />
              }
            >
              {/* Tiêu đề bước */}
              <div style={{ marginBottom: 8 }}>
                <Input
                  placeholder="Tiêu đề bước"
                  value={step.title}
                  onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                  size="small"
                />
              </div>

              {/* Mô tả bước */}
              <div style={{ marginBottom: 8 }}>
                <TextArea
                  rows={2}
                  placeholder="Mô tả chi tiết"
                  value={step.description}
                  onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                  size="small"
                />
              </div>

              {/* Upload ảnh cho bước */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Khu vực dán ảnh */}
                <div style={{ 
                  flex: 1,
                  border: '2px dashed #d9d9d9', 
                  borderRadius: 6, 
                  padding: 8,
                  textAlign: 'center',
                  backgroundColor: pastedStepImages[index] ? '#f6ffed' : '#fafafa',
                  borderColor: pastedStepImages[index] ? '#52c41a' : '#d9d9d9'
                }}>
                  <div style={{ marginBottom: 6, color: '#666', fontSize: 11 }}>
                    📋 Dán ảnh (Ctrl+V)
                  </div>
                  <input
                    type="text"
                    placeholder="Click và Ctrl+V"
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      outline: 'none',
                      fontSize: 11
                    }}
                    onPaste={(e) => handleStepImagePaste(e, index)}
                    readOnly
                  />
                  {pastedStepImages[index] && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: '#52c41a', fontSize: 10 }}>✅ Đã dán!</span>
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => clearPastedStepImage(index)}
                        style={{ padding: 0, marginLeft: 4, fontSize: 10 }}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 11, color: '#999' }}>hoặc</div>

                {/* Upload từ device */}
                <Upload
                  listType="picture-card"
                  fileList={stepImageFileLists[index] || []}
                  beforeUpload={(file) => handleStepImageUpload(file, index)}
                  onChange={({ fileList }) => handleStepImageChange({ fileList }, index)}
                  maxCount={1}
                  accept="image/*"
                  disabled={pastedStepImages[index] !== undefined}
                  style={{ width: 80, height: 80 }}
                >
                  {((stepImageFileLists[index] || []).length >= 1 || pastedStepImages[index]) ? null : uploadButton(uploadingStepImages[index])}
                </Upload>

                {/* Preview ảnh hiện tại */}
                {!pastedStepImages[index] && !(stepImageFileLists[index] || []).length && step.recipeImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={step.recipeImage}
                      alt={`Step ${index + 1}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <p style={{ marginTop: 4, fontSize: 10, color: '#888' }}>Ảnh hiện tại</p>
                  </div>
                )}

                {/* Preview ảnh đã dán */}
                {pastedStepImages[index] && step.recipeImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={step.recipeImage}
                      alt={`Pasted ${index + 1}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <p style={{ marginTop: 4, fontSize: 10, color: '#52c41a' }}>Ảnh đã dán</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Button
          type="dashed"
          onClick={handleAddStep}
          block
          icon={<PlusOutlined />}
          style={{ marginTop: 12 }}
        >
          Thêm bước
        </Button>
      </div>
    </Card>
  );
};

export default RecipeSection;
