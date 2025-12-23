import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const IngredientCategoryForm = ({
    form,
    onFinish,
    onCancel,
    onDelete,
    ingredientCategory,
    initialValues,
    isEdit = false
}) => {
    const [modal, contextHolder] = Modal.useModal();
    const [submitting, setSubmitting] = useState(false);

    // Xử lý submit form
    const handleSubmit = (values) => {
        setSubmitting(true);
        try {
            const categoryData = {
                ...values,
                keyword: values.keyword.trim(),
                title: values.title.trim(),
                titleEn: values.titleEn?.trim() || "",
                description: values.description?.trim() || "",
            };
            onFinish(categoryData);
        } catch (error) {
            message.error(`Có lỗi xảy ra, vui lòng thử lại! ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Xóa nguyên liệu (hiện modal confirm)
    const handleDelete = () => {
        if (!ingredientCategory) return;

        modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa danh mục "${ingredientCategory.title}" không?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            centered: true,
            onOk: () => {
                if (onDelete) {
                    onDelete(ingredientCategory._id);
                }
            }
        });
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            style={{ '--form-label-font-weight': 500 }}
        >
            <Row gutter={24}>
                <Col span={24}>
                    <Card variant="bordered" style={{ marginBottom: 16 }}>
                        {/* Keyword */}
                        <Form.Item
                            name="keyword"
                            label="Từ khóa (unique)"
                            rules={[{ required: true, message: 'Vui lòng nhập keyword duy nhất cho danh mục' }]}
                        >
                            <Input placeholder="Ví dụ: vegetable, fruit, meat..." />
                        </Form.Item>

                        {/* Title */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="title"
                                    label="Tên danh mục (Tiếng Việt)"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                                >
                                    <Input placeholder="Ví dụ: Rau, Trái cây, Thịt..." />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="titleEn"
                                    label="Tên danh mục (Tiếng Anh)"
                                >
                                    <Input placeholder="Ví dụ: Vegetables, Fruits, Meat..." />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Description */}
                        <Form.Item name="description" label="Mô tả">
                            <TextArea rows={3} placeholder="Mô tả ngắn gọn về danh mục" />
                        </Form.Item>
                    </Card>
                </Col>
            </Row>

            {/* FOOTER FORM */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 24
                }}
            >
                {/* Trái: Xóa (chỉ khi edit) */}
                {isEdit ? (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        Xóa danh mục thực phẩm
                    </Button>
                ) : (
                    <div /> // giữ khoảng trống
                )}

                {/* Phải: Hủy + Thêm/Lưu */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={submitting}>
                        {isEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}
                    </Button>
                </div>
            </div>

            {contextHolder}
        </Form>
    );
};

export default IngredientCategoryForm;
