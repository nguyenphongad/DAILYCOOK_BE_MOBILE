import React, { useState } from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Upload,
    InputNumber,
    Divider,
    Card,
    message
} from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const IngredientForm = ({
    form,
    onFinish,
    onCancel,
    initialValues = {},
    allIngredientCategories = [],
    allMeasureUnits = [],
    isEdit = false
}) => {
    // State công dụng phổ biến
    const [commonUses, setCommonUses] = useState(initialValues?.commonUses || []);
    const [newUse, setNewUse] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Upload ảnh
    const [fileList, setFileList] = useState([]);
    const [imageUrl, setImageUrl] = useState(initialValues?.ingredientImage || '');

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Chỉ được upload file ảnh!');
            return Upload.LIST_IGNORE;
        }
        return false; // chặn upload tự động
    };

    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            const previewUrl = URL.createObjectURL(file);
            setImageUrl(previewUrl);
        }
    };

    const uploadButton = (
        <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh</div>
        </div>
    );

    // Thêm công dụng
    const addCommonUse = () => {
        if (newUse.trim()) {
            setCommonUses([...commonUses, newUse.trim()]);
            setNewUse('');
        }
    };

    // Xóa công dụng
    const removeCommonUse = (index) => {
        setCommonUses(commonUses.filter((_, i) => i !== index));
    };

    // Xử lý submit
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const ingredientData = {
                ...values,
                nameIngredient: values.nameIngredient.trim(),
                description: values.description?.trim() || '',
                ingredientCategory: values.ingredientCategory,
                defaultAmount: values.defaultAmount,
                defaultUnit: values.defaultUnit,
                nutrition: values.nutrition || {},
                commonUses,
                ingredientImage: fileList[0]?.originFileObj || imageUrl || null
            };

            await onFinish(ingredientData);
        } catch (error) {
            message.error(`Đã xảy ra lỗi: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
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
                {/* ================== CỘT TRÁI: Thông tin nguyên liệu ================== */}
                <Col span={14}>
                    <Card
                        title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin nguyên liệu</span>}
                        variant="bordered"
                    >
                        {/* Tên nguyên liệu */}
                        <Form.Item
                            name="nameIngredient"
                            label="Tên nguyên liệu"
                            rules={[{ required: true, message: 'Vui lòng nhập tên nguyên liệu' }]}
                        >
                            <Input placeholder="Nhập tên nguyên liệu" />
                        </Form.Item>

                        {/* Danh mục nguyên liệu */}
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

                        {/* Số lượng + đơn vị */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="defaultAmount"
                                    label="Số lượng mặc định"
                                    rules={[{ required: true, message: 'Vui lòng nhập số lượng mặc định' }]}
                                >
                                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Nhập số lượng mặc định" />
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
                                            <Option key={unit.key} value={unit.key}>
                                                {unit.label} ({unit.key})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Mô tả */}
                        <Form.Item name="description" label="Mô tả">
                            <TextArea rows={3} placeholder="Mô tả ngắn gọn về nguyên liệu" />
                        </Form.Item>

                        {/* Ảnh */}
                        <Form.Item label="Ảnh đại diện">
                            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                                {/* Upload */}
                                <div style={{ textAlign: "center" }}>
                                    <Upload
                                        name="dietTypeImage"
                                        listType="picture-card"
                                        showUploadList={true}
                                        fileList={fileList}
                                        beforeUpload={beforeUpload}
                                        onChange={handleChange}
                                        maxCount={1}
                                        accept="image/*"
                                        style={{
                                            width: 120,
                                            height: 120,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                                        }}
                                    >
                                        {fileList.length >= 1 ? null : uploadButton}
                                    </Upload>
                                </div>

                                {/* Ảnh hiện tại */}
                                {!fileList.length && imageUrl && (
                                    <div style={{ textAlign: "center" }}>
                                        <img
                                            src={imageUrl}
                                            alt="Current"
                                            style={{
                                                width: 120,
                                                height: 120,
                                                objectFit: "cover",
                                                borderRadius: 8,
                                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                                            }}
                                        />
                                        <p style={{ marginTop: 8, fontSize: 13, color: "#888" }}>Ảnh hiện tại</p>
                                    </div>
                                )}
                            </div>
                        </Form.Item>
                    </Card>
                </Col>

                {/* ================== CỘT PHẢI: Dinh dưỡng + Công dụng ================== */}
                <Col span={10}>
                    {/* Thông tin dinh dưỡng */}
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

                    <Divider />

                    {/* Công dụng phổ biến */}
                    <Card
                        title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Công dụng phổ biến</span>}
                        variant="bordered"
                    >
                        {/* Input thêm công dụng */}
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
                                <Button
                                    type="primary"
                                    onClick={addCommonUse}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Thêm
                                </Button>
                            </Col>
                        </Row>

                        {/* Danh sách công dụng */}
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
            </Row>

            {/* ================== FOOTER FORM ================== */}
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                    {isEdit ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
                </Button>
            </div>
        </Form>
    );
};

export default IngredientForm;
