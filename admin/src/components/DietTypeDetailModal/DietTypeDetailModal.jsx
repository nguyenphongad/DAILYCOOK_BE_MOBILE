import React, { useState } from 'react';
import {
    Modal, Row, Col, Image, Typography, Tag, Card, Button, Form, Statistic
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import DietTypeForm from '../DietTypeForm/DietTypeForm';
import NutritionPieChart from './NutritionPieChart';

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

    // Nếu chưa có chế độ ăn → không render
    if (!dietType) return null;

    // --- HANDLER FUNCTIONS ---

    // Mở form chỉnh sửa
    const handleEditClick = () => {
        form.setFieldsValue({
            keyword: dietType?.keyword || '',
            title: dietType?.title || '',
            dietTypeImage: dietType?.dietTypeImage || '',
            description: dietType?.description || '',
            descriptionDetail: dietType?.descriptionDetail || '',
            researchSource: dietType?.researchSource || '',
            nutrition: {
                calories: dietType?.nutrition?.calories || 0,
                protein: dietType?.nutrition?.protein || 0,
                carbs: dietType?.nutrition?.carbs || 0,
                fat: dietType?.nutrition?.fat || 0
            }
        });
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
            onEdit({ 
                ...dietType, 
                ...values,
                _id: dietType._id 
            });
        }
        setIsEditing(false);
        onClose();
    };

    // Xóa chế độ ăn (hiện modal confirm)
    const handleDelete = () => {
        if (!dietType) return;

        modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa chế độ ăn "${dietType.title}" không?`,
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
                centered
                style={{
                    maxWidth: '90%',
                    margin: '0 auto'
                }}
                footer={null}
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

    // Nếu đang xem chi tiết → render thông tin chế độ ăn với layout mới
    return (
        <Modal
            title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chi tiết chế độ ăn</span>}
            open={isVisible}
            onCancel={onClose}
            width={1600}
            centered
            style={{
                maxWidth: '90%',
                margin: '0 auto'
            }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {/* Nút xóa chế độ ăn */}
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        Xóa chế độ ăn
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
            className="diet-type-detail-modal"
        >
            <Row gutter={24}>
                {/* Cột bên trái: Thông tin chế độ ăn */}
                <Col span={14}>
                    <Card variant="bordered" style={{ height: '100%' }}>
                        <Row gutter={16}>
                            {/* Hình ảnh chế độ ăn */}
                            <Col span={10}>
                                <Image
                                    src={dietType.dietTypeImage || 'https://media.istockphoto.com/id/1433432507/vi/anh/%C4%83n-u%E1%BB%91ng-l%C3%A0nh-m%E1%BA%A1nh-%C4%91%C4%A9a-v%E1%BB%9Bi-th%E1%BB%B1c-ph%E1%BA%A9m-thu%E1%BA%A7n-chay-ho%E1%BA%B7c-chay-trong-tay-ph%E1%BB%A5-n%E1%BB%83-ch%E1%BA%BF-%C4%91%E1%BB%99-%C4%83n-u%E1%BB%91ng-d%E1%BB%B1a.jpg?s=612x612&w=0&k=20&c=Z0BVb_z-mLjup_3f4Kvto5q0A0z8CqBjsHS7DSMaQ1k='}
                                    alt={dietType.title}
                                    style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }}
                                    fallback="https://media.istockphoto.com/id/1433432507/vi/anh/%C4%83n-u%E1%BB%91ng-l%C3%A0nh-m%E1%BA%A1nh-%C4%91%C4%A9a-v%E1%BB%9Bi-th%E1%BB%B1c-ph%E1%BA%A9m-thu%E1%BA%A7n-chay-ho%E1%BA%B7c-chay-trong-tay-ph%E1%BB%A5-n%E1%BB%83-ch%E1%BA%BF-%C4%91%E1%BB%99-%C4%83n-u%E1%BB%91ng-d%E1%BB%B1a.jpg?s=612x612&w=0&k=20&c=Z0BVb_z-mLjup_3f4Kvto5q0A0z8CqBjsHS7DSMaQ1k="
                                />
                            </Col>
                            
                            {/* Thông tin cơ bản */}
                            <Col span={14}>
                                <Title level={4} style={{ marginTop: 0 }}>{dietType.title}</Title>
                                <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                                    {dietType.keyword || 'Không rõ'}
                                </Tag>
                                <Paragraph strong>Mô tả:</Paragraph>
                                <Paragraph>{dietType.description || 'Không có mô tả'}</Paragraph>

                                
                            </Col>
                        </Row>
                        
                        {/* Thông tin chi tiết và nguồn nghiên cứu */}
                        <div style={{ marginTop: 24 }}>
                            <Paragraph strong>Chi tiết chế độ ăn:</Paragraph>
                            <Paragraph style={{ maxHeight: '150px', overflowY: 'auto' }}>{dietType.descriptionDetail || 'Không có mô tả chi tiết'}</Paragraph>
                            
                            <Paragraph strong style={{ marginTop: 16 }}>Nguồn nghiên cứu:</Paragraph>
                            <Paragraph>{dietType.researchSource || 'Không có thông tin'}</Paragraph>
                        </div>
                    </Card>
                </Col>
                
                {/* Cột bên phải: Biểu đồ dinh dưỡng */}
                <Col span={10}>
                    <NutritionPieChart nutrition={dietType.nutrition} />
                </Col>
            </Row>

            {/* Quan trọng: phải render contextHolder để confirm modal hoạt động */}
            {contextHolder}
        </Modal>
    );
};

export default DietTypeDetailModal;
