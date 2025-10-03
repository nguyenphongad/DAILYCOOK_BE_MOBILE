import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Row, Col, Upload, InputNumber, Divider, Tag, List, Card, Typography } from 'antd';
import { PlusOutlined, CloseOutlined, UploadOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons';


const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const DishForm = ({ form, onFinish, onCancel, initialValues, allIngredients, isEdit = false }) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [steps, setSteps] = useState([{ stepNumber: 1, title: '', description: '', image: '' }]);
  
  // Khởi tạo form dựa trên initialValues nếu có
  useEffect(() => {
    if (initialValues) {
      // Set giá trị form từ initialValues
      form.setFieldsValue({
        nameRecipe: initialValues.name,
        difficulty: initialValues.difficulty || 'medium',
        servings: initialValues.servings || 4,
        prepTimeMinutes: initialValues.prepTimeMinutes || 15,
        cookTimeMinutes: initialValues.cookTimeMinutes || 30,
        description: initialValues.description,
        // Các giá trị khác...
      });
      
      // Set ingredients nếu có
      if (initialValues.ingredients && initialValues.ingredients.length > 0) {
        setSelectedIngredients(initialValues.ingredients);
      }
      
      // Set steps nếu có
      if (initialValues.steps && initialValues.steps.length > 0) {
        setSteps(initialValues.steps);
      } else {
        setSteps([{ stepNumber: 1, title: '', description: '', image: '' }]);
      }
    }
  }, [initialValues, form]);
  
  const handleSubmit = (values) => {
    const recipeData = {
      ...values,
      ingredients: selectedIngredients,
      steps: steps
    };
    
    onFinish(recipeData);
  };
  
  const addIngredient = (ingredient) => {
    const newIngredient = {
      ...ingredient,
      amount: ingredient.defaultAmount
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
  const filteredIngredients = allIngredients.filter(
    ingredient => !selectedIngredients.some(item => item.id === ingredient.id)
  );
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
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
                  name="nameRecipe"
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
                >
                  <Select placeholder="Chọn độ khó">
                    <Option value="easy">Dễ</Option>
                    <Option value="medium">Trung bình</Option>
                    <Option value="hard">Khó</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="servings"
                  label="Khẩu phần"
                  rules={[{ required: true, message: 'Vui lòng nhập khẩu phần' }]}
                >
                  <InputNumber min={1} placeholder="Số người ăn" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="prepTimeMinutes"
                  label="Thời gian chuẩn bị (phút)"
                  rules={[{ required: true, message: 'Vui lòng nhập thời gian chuẩn bị' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cookTimeMinutes"
                  label="Thời gian nấu (phút)"
                  rules={[{ required: true, message: 'Vui lòng nhập thời gian nấu' }]}
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
                defaultFileList={initialValues?.image ? [
                  {
                    uid: '-1',
                    name: 'image.png',
                    status: 'done',
                    url: initialValues.image,
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
              <Text strong style={{ fontSize: '15px' }}>Chọn nguyên liệu:</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {filteredIngredients.map(ingredient => (
                  <Tag
                    key={ingredient.id}
                    color="blue"
                    style={{ cursor: 'pointer', margin: '4px' }}
                    onClick={() => addIngredient(ingredient)}
                  >
                    {ingredient.name} <PlusOutlined />
                  </Tag>
                ))}
              </div>
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
              <span style={{ fontWeight: 600 }}>Thông tin dinh dưỡng giảm/tăng sau khi có áp dụng công thức nấu</span>
            </Divider>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name={['nutrition', 'calories']} 
                  label="Calories (%)"
                  rules={[
                    { type: 'number', min: 0, max: 100, message: 'Giá trị phải từ 0-100%' }
                  ]}
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
                  rules={[
                    { type: 'number', min: 0, max: 100, message: 'Giá trị phải từ 0-100%' }
                  ]}
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
                  rules={[
                    { type: 'number', min: 0, max: 100, message: 'Giá trị phải từ 0-100%' }
                  ]}
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
                  rules={[
                    { type: 'number', min: 0, max: 100, message: 'Giá trị phải từ 0-100%' }
                  ]}
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
        <Button style={{ marginRight: 8 }} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="primary" htmlType="submit">
          {isEdit ? 'Lưu thay đổi' : 'Thêm món ăn'}
        </Button>
      </div>
    </Form>
  );
};

export default DishForm;
