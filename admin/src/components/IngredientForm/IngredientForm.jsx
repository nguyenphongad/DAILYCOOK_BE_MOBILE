import React, { useState } from 'react';
import { Form, Input, Select, Button, Row, Col, Upload, InputNumber, Divider, Card, Typography } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const IngredientForm = ({
    form,
    onFinish,
    onCancel,
    initialValues,
    allIngredientCategories,
    allMeasureUnits,
    isEdit = false
}) => {
    const [commonUses, setCommonUses] = useState(initialValues?.commonUses || []);
    const [newUse, setNewUse] = useState('');

    const addCommonUse = () => {
        if (newUse.trim()) {
            setCommonUses([...commonUses, newUse.trim()]);
            setNewUse('');
        }
    };

    const removeCommonUse = (index) => {
        setCommonUses(commonUses.filter((_, i) => i !== index));
    };

    const handleSubmit = (values) => {
        const ingredientData = {
            ...values,
            commonUses,
        };
        onFinish(ingredientData);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            className="ingredient-form"
        >
            <Row gutter={24}>
                {/* Bên trái */}
                <Col span={14}>
                    <Card
                        title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin nguyên liệu</span>}
                        variant="bordered"
                    >
                        <Form.Item
                            name="nameIngredient"
                            label="Tên nguyên liệu"
                            rules={[{ required: true, message: 'Vui lòng nhập tên nguyên liệu' }]}
                        >
                            <Input placeholder="Nhập tên nguyên liệu" />
                        </Form.Item>

                        <Form.Item
                            name="ingredientCategory"
                            label="Danh mục"
                            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                        >
                            <Select placeholder="Chọn danh mục nguyên liệu">
                                {allIngredientCategories.map((cat) => (
                                    <Option key={cat._id} value={cat._id}>
                                        {cat.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>


                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="defaultAmount"
                                    label="Số lượng mặc định"
                                    rules={[{ required: true, message: 'Vui lòng nhập số lượng mặc định' }]}
                                >
                                    <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng mặc định" />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="defaultUnit"
                                    label="Đơn vị đo lường"
                                    rules={[{ required: true, message: 'Vui lòng chọn đơn vị đo lường' }]}
                                >
                                    <Select placeholder="Chọn đơn vị">
                                        {allMeasureUnits.map((unit) => (
                                            <Option key={unit.key} value={unit.value}>
                                                {unit.title} ({unit.value})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="description" label="Mô tả">
                            <TextArea rows={3} placeholder="Mô tả ngắn gọn về nguyên liệu" />
                        </Form.Item>

                        <Form.Item name="ingredientImage" label="Hình ảnh">
                            <Upload
                                listType="picture"
                                maxCount={1}
                                beforeUpload={() => false}
                                defaultFileList={
                                    initialValues?.image
                                        ? [
                                            {
                                                uid: '-1',
                                                name: 'image.png',
                                                status: 'done',
                                                url: initialValues.image,
                                            },
                                        ]
                                        : []
                                }
                            >
                                <Button icon={<UploadOutlined />}>Tải lên ảnh</Button>
                            </Upload>
                        </Form.Item>
                    </Card>

                    <Divider />

                    <Card
                        title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Công dụng phổ biến</span>}
                        variant="bordered"
                    >
                        <Row gutter={8} style={{ marginBottom: 12 }}>
                            <Col span={18}>
                                <Input
                                    value={newUse}
                                    placeholder="Thêm công dụng"
                                    onChange={(e) => setNewUse(e.target.value)}
                                    onPressEnter={addCommonUse}
                                />
                            </Col>
                            <Col span={6}>
                                <Button type="primary" onClick={addCommonUse} block icon={<PlusOutlined />}>
                                    Thêm
                                </Button>
                            </Col>
                        </Row>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {commonUses.map((use, index) => (
                                <Button
                                    key={index}
                                    size="small"
                                    style={{ borderRadius: 20 }}
                                    onClick={() => removeCommonUse(index)}
                                    icon={<DeleteOutlined />}
                                >
                                    {use}
                                </Button>
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* Bên phải */}
                <Col span={10}>
                    <Card
                        title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin dinh dưỡng (tùy chọn)</span>}
                        variant="bordered"
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name={['nutrition', 'calories']} label="Calories">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name={['nutrition', 'protein']} label="Protein (g)">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name={['nutrition', 'carbs']} label="Carbs (g)">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name={['nutrition', 'fat']} label="Fat (g)">
                                    <InputNumber min={0} style={{ width: '100%' }} />
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
                    {isEdit ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
                </Button>
            </div>
        </Form>
    );
};

export default IngredientForm;
