import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const MealCategoryForm = ({
    form,
    onFinish,
    onCancel,
    onDelete,
    mealCategory,
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
        if (!mealCategory) return;

        modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa danh mục "${mealCategory.title}" không?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            centered: true,
            onOk: () => {
                if (onDelete) {
                    onDelete(mealCategory._id);
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
                            <Input placeholder="Ví dụ: main_dish, side_dish..." />
                        </Form.Item>

                        {/* Title */}
                        <Form.Item
                            name="title"
                            label="Tên danh mục"
                            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                        >
                            <Input placeholder="Ví dụ: Bữa chính, bữa phụ..." />
                        </Form.Item>

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
                        Xóa danh mục nguyên liệu
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

export default MealCategoryForm;