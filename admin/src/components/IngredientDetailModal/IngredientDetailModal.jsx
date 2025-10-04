import React, { useState } from 'react';
import {
    Modal, Row, Col, Image, Typography, Divider,
    Descriptions, Tag, Card, List, Button, Form
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import IngredientForm from '../IngredientForm/IngredientForm';

const { Title, Paragraph } = Typography;

const IngredientDetailModal = ({
    isVisible,                 // Trạng thái hiển thị modal
    onClose,                   // Hàm đóng modal
    ingredient,                // Nguyên liệu được chọn
    onEdit,                    // Callback chỉnh sửa
    onDelete,                  // Callback xóa
    allIngredientCategories,   // Danh mục nguyên liệu
    allMeasureUnits            // Đơn vị đo lường
}) => {
    // State quản lý chế độ chỉnh sửa
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [modal, contextHolder] = Modal.useModal();

    // Nếu chưa có nguyên liệu → không render
    if (!ingredient) return null;

    // Lookup category theo id
    const category = allIngredientCategories?.find(
        cat => cat._id === ingredient.ingredientCategory
    );

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
            onEdit({ ...values, _id: ingredient._id });
        }
        setIsEditing(false);
    };

    // Xóa nguyên liệu (hiện modal confirm)
    const handleDelete = () => {
        if (!ingredient) return;

        modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa nguyên liệu "${ingredient.nameIngredient}" không?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            centered: true,
            onOk: () => {
                if (onDelete) {
                    onDelete(ingredient._id);
                }
                onClose();
            }
        });
    };

    // --- RENDER ---

    // Nếu đang ở chế độ chỉnh sửa → render form
    if (isEditing) {
        return (
            <Modal
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chỉnh sửa nguyên liệu</span>}
                open={isVisible}
                onCancel={handleCancelEdit}
                width={1600}
                style={{
                    top: 10,
                    maxWidth: '90%',
                    margin: '0 auto'
                }}
                footer={null}
                className="ingredient-detail-modal editing"
            >
                <IngredientForm
                    form={form}
                    onFinish={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    initialValues={ingredient}
                    allIngredientCategories={allIngredientCategories || []}
                    allMeasureUnits={allMeasureUnits || []}
                    isEdit={true}
                />
            </Modal>
        );
    }

    // Nếu đang xem chi tiết → render thông tin nguyên liệu
    return (
        <Modal
            title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chi tiết nguyên liệu</span>}
            open={isVisible}
            onCancel={onClose}
            width={1600}
            style={{
                top: 20,
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
                <Row gutter={24}>
                    {/*  ================== BÊN TRÁI: Hình ảnh + thông tin cơ bản  ================== */}
                    <Col span={10}>
                        <Image
                            src={ingredient.ingredientImage}
                            alt={ingredient.nameIngredient}
                            style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <Title level={4} style={{ marginTop: 16 }}>{ingredient.nameIngredient}</Title>
                        <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                            {category ? category.title : 'Không rõ danh mục'}
                        </Tag>
                        <Paragraph>{ingredient.description}</Paragraph>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={<strong>Khối lượng mặc định</strong>}>
                                {ingredient.defaultAmount} {ingredient.defaultUnit}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>

                    {/*  ================== BÊN PHẢI: Thông tin dinh dưỡng + công dụng  ================== */}
                    <Col span={14}>
                        <Divider>
                            Thông tin dinh dưỡng trên {ingredient.defaultAmount}/{ingredient.defaultUnit}
                        </Divider>

                        {/* Nutrition cards */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Card size="small" title="Calories">
                                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {ingredient.nutrition?.calories || 0} kcal
                                    </div>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Protein">
                                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {ingredient.nutrition?.protein || 0} g
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={12}>
                                <Card size="small" title="Carbs">
                                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {ingredient.nutrition?.carbs || 0} g
                                    </div>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Fat">
                                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {ingredient.nutrition?.fat || 0} g
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        {/* Common uses */}
                        <Divider>Công dụng phổ biến</Divider>
                        <List
                            dataSource={ingredient.commonUses || []}
                            renderItem={use => (
                                <List.Item>
                                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                    {use}
                                </List.Item>
                            )}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Quan trọng: phải render contextHolder để confirm modal hoạt động */}
            {contextHolder}
        </Modal>
    );
};

export default IngredientDetailModal;
