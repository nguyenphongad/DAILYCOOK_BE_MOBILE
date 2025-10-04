import React, { useState } from 'react';
import {
    Modal, Row, Col, Image, Typography, Tag, Card, Button, Form
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import DietTypeForm from '../DietTypeForm/DietTypeForm';

const { Title, Paragraph } = Typography;

const DietTypeDetailModal = ({
    isVisible,                 // Trạng thái hiển thị modal
    onClose,                   // Hàm đóng modal
    onEdit,                    // Callback chỉnh sửa
    onDelete,                  // Callback xóa
    dietType,
}) => {
    // State quản lý chế độ chỉnh sửa
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [modal, contextHolder] = Modal.useModal();

    // Nếu chưa có nguyên liệu → không render
    if (!dietType) return null;

    // --- HANDLER FUNCTIONS ---

    // Mở form chỉnh sửa
    const handleEditClick = () => {
        setIsEditing(true);
    };

    // Hủy chỉnh sửa
    const handleCancelEdit = () => {
        setIsEditing(false);
        form.resetFields();
    };

    // Lưu chỉnh sửa
    const handleSaveEdit = (values) => {
        if (onEdit) {
            onEdit({ ...values, _id: dietType._id });
        }
        setIsEditing(false);
    };

    // Xóa nguyên liệu (hiện modal confirm)
    const handleDelete = () => {
        if (!dietType) return;

        modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa danh mục "${dietType.title}" không?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            centered: true,
            onOk: () => {
                if (onDelete) {
                    onDelete(dietType._id);
                }
            }
        });
    };

    // --- RENDER ---
    // Nếu đang ở chế độ chỉnh sửa → render form
    if (isEditing) {
        return (
            <Modal
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chỉnh sửa chế độ ăn</span>}
                open={isVisible}
                onCancel={handleCancelEdit}
                width={1600}
                style={{
                    maxWidth: '90%',
                    margin: '0 auto'
                }}
                footer={null}
                className="ingredient-detail-modal editing"
            >
                <DietTypeForm
                    form={form}
                    onFinish={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    initialValues={dietType}
                    isEdit={true}
                />
            </Modal>
        );
    }

    // Nếu đang xem chi tiết → render thông tin nguyên liệu
    return (
        <Modal
            title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chi tiết chế độ ăn</span>}
            open={isVisible}
            onCancel={onClose}
            width={1600}
            style={{
                maxWidth: '90%',
                margin: '0 auto'
            }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {/* Nút xóa nguyên liệu */}
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        Xóa nguyên liệu
                    </Button>
                    <div>
                        {/* Nút đóng modal */}
                        <Button style={{ marginRight: 8 }} onClick={onClose}>
                            Đóng
                        </Button>
                        {/* Nút mở form chỉnh sửa */}
                        <Button type="primary" icon={<EditOutlined />} onClick={handleEditClick}>
                            Chỉnh sửa
                        </Button>
                    </div>
                </div>
            }
            className="ingredient-detail-modal"
        >
            <Card variant="bordered">
                <Row gutter={16}>
                    {/*  ================== BÊN TRÁI: Hình ảnh + thông tin cơ bản  ================== */}
                    <Col span={12}>
                        <Image
                            src={dietType.dietTypeImage}
                            alt={dietType.title}
                            style={{ width: '140%', height: 280, objectFit: 'cover', borderRadius: 8 }}
                        />

                    </Col>
                    <Col span={12}>
                        <Title level={4} style={{ marginTop: 16 }}>{dietType.title}</Title>
                        <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                            {dietType.keyword || 'Không rõ'}
                        </Tag>
                        <Paragraph>{dietType.description}</Paragraph>
                        <Paragraph>{dietType.descriptionDetail}</Paragraph>
                        <Paragraph>{dietType.researchSource}</Paragraph>
                    </Col>
                </Row>
            </Card>

            {/* Quan trọng: phải render contextHolder để confirm modal hoạt động */}
            {contextHolder}
        </Modal>
    );
};

export default DietTypeDetailModal;
