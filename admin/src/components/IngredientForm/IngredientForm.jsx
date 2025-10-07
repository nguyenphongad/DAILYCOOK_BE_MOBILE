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
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';

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
    // ==================== STATE ====================
    const [commonUses, setCommonUses] = useState(initialValues?.commonUses || []); // danh sách công dụng
    const [newUse, setNewUse] = useState(''); // công dụng mới
    const [submitting, setSubmitting] = useState(false); // trạng thái submit
    const [fileList, setFileList] = useState([]); // danh sách file upload
    const [imageUrl, setImageUrl] = useState(initialValues?.ingredientImage || ''); // URL ảnh hiện tại

    // ==================== HÀM XỬ LÝ ====================

    // Thêm công dụng mới
    const addCommonUse = () => {
        if (newUse.trim()) {
            setCommonUses([...commonUses, newUse.trim()]);
            setNewUse('');
        }
    };

    // Xóa công dụng theo index
    const removeCommonUse = (index) => {
        setCommonUses(commonUses.filter((_, i) => i !== index));
    };

    // Xử lý submit form
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            // Upload ảnh nếu có file mới
            if (fileList.length > 0) {
                const file = convertAntdUploadFileToFile(fileList[0]);
                if (file) {
                    const uploadResult = await uploadImage(file, { folder: 'ingredient' });
                    values.ingredientImage = uploadResult.secure_url;
                }
            } else if (imageUrl) {
                // giữ nguyên ảnh cũ nếu không upload file mới
                values.ingredientImage = imageUrl;
            }

            // Chuẩn hóa dữ liệu trước khi gửi
            const ingredientData = {
                ...values,
                nameIngredient: values.nameIngredient.trim(),
                description: values.description?.trim() || 'Không có mô tả',
                ingredientCategory: values.ingredientCategory,
                defaultAmount: values.defaultAmount,
                defaultUnit: values.defaultUnit,
                nutrition: values.nutrition || {},
                commonUses,
                ingredientImage: values.ingredientImage || null
            };

            await onFinish(ingredientData); // gọi callback từ parent
        } catch (error) {
            message.error(`Đã xảy ra lỗi: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== XỬ LÝ UPLOAD ====================

    // Khi file thay đổi
    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    // Trước khi upload (check type & size)
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Bạn chỉ có thể tải lên file ảnh!');
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Kích thước ảnh phải nhỏ hơn 2MB!');
            return false;
        }

        // Preview ảnh
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setImageUrl(reader.result);
        };

        return false; // prevent default upload
    };

    const uploadButton = (
        <div>
            {submitting ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Tải lên</div>
        </div>
    );

    // ==================== RENDER ====================
    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            className="ingredient-form"
        >
            <Row gutter={24}>
                {/* ================== CỘT TRÁI: Thông tin cơ bản ================== */}
                <Col span={14}>
                    <Card title={<strong>Thông tin nguyên liệu</strong>} variant="bordered">
                        {/* Tên nguyên liệu */}
                        <Form.Item
                            name="nameIngredient"
                            label="Tên nguyên liệu"
                            rules={[{ required: true, message: 'Vui lòng nhập tên nguyên liệu' }]}
                        >
                            <Input placeholder="Nhập tên nguyên liệu" />
                        </Form.Item>

                        {/* Danh mục */}
                        <Form.Item
                            name="ingredientCategory"
                            label="Danh mục"
                            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                        >
                            <Select placeholder="Chọn danh mục nguyên liệu">
                                {allIngredientCategories.map(cat => (
                                    <Option key={cat._id} value={cat._id}>
                                        {cat.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Số lượng & đơn vị */}
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
                                        {allMeasureUnits.map(unit => (
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

                        {/* Upload ảnh */}
                        <Form.Item label="Ảnh đại diện">
                            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                                {/* Upload mới */}
                                <Upload
                                    name="ingredientImage"
                                    listType="picture-card"
                                    showUploadList={true}
                                    fileList={fileList}
                                    beforeUpload={beforeUpload}
                                    onChange={handleChange}
                                    maxCount={1}
                                    accept="image/*"
                                    style={{ width: 120, height: 120, borderRadius: 8 }}
                                >
                                    {fileList.length >= 1 ? null : uploadButton}
                                </Upload>

                                {/* Preview ảnh hiện tại */}
                                {!fileList.length && imageUrl && (
                                    <div style={{ textAlign: "center" }}>
                                        <img
                                            src={imageUrl}
                                            alt="Current"
                                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
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
                    <Card title={<strong>Thông tin dinh dưỡng (tùy chọn)</strong>} variant="bordered">
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
                    <Card title={<strong>Công dụng phổ biến</strong>} variant="bordered">
                        {/* Thêm công dụng */}
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
