import React from 'react';
import { Form, Input, Button, Card, Row, Col } from 'antd';

const { TextArea } = Input;

const IngredientCategoryForm = ({
    form,
    onFinish,
    onCancel,
    initialValues,
    isEdit = false
}) => {
    // Xử lý submit form
    const handleSubmit = (values) => {
        const categoryData = {
            ...values,
        };
        onFinish(categoryData);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            style={{
                '--form-label-font-weight': 500, 
            }}
        >
            <Row gutter={24}>
                <Col span={24}>
                    <Card
                        variant="bordered"
                        style={{ marginBottom: 16 }}
                    >
                        {/* Keyword */}
                        <Form.Item
                            name="keyword"
                            label="Từ khóa (unique)"
                            rules={[{ required: true, message: 'Vui lòng nhập keyword duy nhất cho danh mục' }]}
                        >
                            <Input placeholder="Ví dụ: vegetable, fruit, meat..." />
                        </Form.Item>

                        {/* Title */}
                        <Form.Item
                            name="title"
                            label="Tên danh mục"
                            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                        >
                            <Input placeholder="Ví dụ: Rau, Trái cây, Thịt..." />
                        </Form.Item>

                        {/* Description */}
                        <Form.Item name="description" label="Mô tả">
                            <TextArea rows={3} placeholder="Mô tả ngắn gọn về danh mục" />
                        </Form.Item>
                    </Card>
                </Col>
            </Row>

            {/* FOOTER FORM */}
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                    {isEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </Button>
            </div>
        </Form>
    );
};

export default IngredientCategoryForm;
