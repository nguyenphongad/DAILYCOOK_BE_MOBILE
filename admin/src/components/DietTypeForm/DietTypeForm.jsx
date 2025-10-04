import React from 'react';
import { Form, Input, Button, Card, Row, Col, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
const { TextArea } = Input;

const DietTypeForm = ({
    form,
    onFinish,
    onCancel,
    initialValues,
    isEdit = false
}) => {
    // Xử lý submit form
    const handleSubmit = (values) => {
        const dietType = { ...values };
        onFinish(dietType);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
            style={{ '--form-label-font-weight': 500 }}
        >
            <Row gutter={16}>
                <Col span={24}>
                    <Card variant="bordered" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                {/* Keyword */}
                                <Form.Item
                                    name="keyword"
                                    label="Từ khóa (unique)"
                                    rules={[{ required: true, message: 'Vui lòng nhập keyword duy nhất cho danh mục' }]}
                                >
                                    <Input placeholder="Ví dụ: vegetable, fruit, meat..." />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {/* Title */}
                                <Form.Item
                                    name="title"
                                    label="Tên chế độ ăn"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên chế độ ăn' }]}
                                >
                                    <Input placeholder="Ví dụ: chế độ cân bằng, ...." />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                {/* Description */}
                                <Form.Item name="description" label="Mô tả">
                                    <TextArea rows={3} placeholder="Mô tả ngắn gọn về chế độ ăn" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {/* descriptionDetail */}
                                <Form.Item name="descriptionDetail" label="Mô tả chi tiết">
                                    <TextArea rows={3} placeholder="Mô tả thêm về chế độ ăn" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* researchSource */}
                        <Form.Item name="researchSource" label="Trích nguồn">
                            <Input placeholder="Tên bài báo/tác giả năm" />
                        </Form.Item>

                        {/* Ảnh chế độ ăn */}
                        <Form.Item name="dietTypeImage" label="Hình ảnh">
                            <Upload
                                listType="picture"
                                maxCount={1}
                                beforeUpload={() => false} // không upload ngay mà giữ file local
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
                </Col>
            </Row>

            {/* FOOTER FORM */}
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                    {isEdit ? 'Lưu thay đổi' : 'Thêm chế độ ăn'}
                </Button>
            </div>
        </Form>
    );
};

export default DietTypeForm;