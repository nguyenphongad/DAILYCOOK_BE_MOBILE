import React, { useState, useEffect } from 'react';
import {
    Modal,
    Row,
    Col,
    Image,
    Typography,
    Divider,
    Descriptions,
    Tag,
    Card,
    List,
    Button,
    Form
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import IngredientForm from '../IngredientForm/IngredientForm';

const { Title, Paragraph } = Typography;

/**
 * Modal hiển thị chi tiết nguyên liệu
 * Bao gồm 2 chế độ:
 * 1. Xem chi tiết
 * 2. Chỉnh sửa (edit)
 */
const IngredientDetailModal = ({
    isVisible,                  // Trạng thái mở/đóng modal
    onClose,                    // Hàm đóng modal
    ingredient,                 // Nguyên liệu được chọn
    onEdit,                     // Hàm cập nhật nguyên liệu
    onDelete,                   // Hàm xóa nguyên liệu
    allIngredientCategories,    // Danh sách tất cả danh mục
    allMeasureUnits             // Danh sách đơn vị đo lường
}) => {
    const [isEditing, setIsEditing] = useState(false); // Chế độ edit
    const [form] = Form.useForm();
    const [modal, contextHolder] = Modal.useModal(); // Modal confirm xóa

    // Khi bật chế độ edit, đồng bộ form với ingredient hiện tại
    useEffect(() => {
        if (isEditing && ingredient) {
            form.setFieldsValue({
                ...ingredient,
                nutrition: ingredient.nutrition || {}
            });
        }
    }, [isEditing, ingredient, form]);

    /** Mở chế độ edit */
    const handleEditClick = () => setIsEditing(true);

    /** Hủy edit, reset form và trở về chế độ xem chi tiết */
    const handleCancelEdit = () => {
        setIsEditing(false);
        form.resetFields();
    };

    /** Lưu thông tin edit, gọi onEdit từ parent */
    const handleSaveEdit = async (values) => {
        await onEdit(values);
        setIsEditing(false);
    };

    /** Xóa nguyên liệu với confirm */
    const handleDelete = () => {
        if (!ingredient) return;

        modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa nguyên liệu "${ingredient?.nameIngredient || ''}" không?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            centered: true,
            onOk: () => {
                if (onDelete) onDelete(ingredient._id);
                onClose();
            }
        });
    };

    // Nếu chưa có nguyên liệu được chọn, không render modal
    if (!ingredient) return null;

    // Lấy danh mục của nguyên liệu
    const category = allIngredientCategories?.find(
        cat => cat._id === ingredient.ingredientCategory
    );

    return (
        <Modal
            title={
                <span style={{ fontWeight: 700, fontSize: '18px' }}>
                    {isEditing ? 'Chỉnh sửa nguyên liệu' : 'Chi tiết nguyên liệu'}
                </span>
            }
            open={isVisible}
            onCancel={isEditing ? handleCancelEdit : onClose}
            width={1600}
            style={{ top: 20, maxWidth: '90%', margin: '0 auto' }}
            footer={isEditing ? null : (
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
            )}
            className="ingredient-detail-modal"
        >
            {isEditing ? (
                // ================== Chế độ chỉnh sửa ==================
                <IngredientForm
                    form={form}
                    onFinish={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    initialValues={{
                        ...ingredient,
                        nutrition: ingredient.nutrition || {}
                    }}
                    allIngredientCategories={allIngredientCategories || []}
                    allMeasureUnits={allMeasureUnits || []}
                    isEdit={true}
                />
            ) : (
                // ================== Chế độ xem chi tiết ==================
                <Card variant="bordered">
                    <Row gutter={24}>
                        {/* Cột trái: hình ảnh, tên, danh mục, mô tả, khối lượng */}
                        <Col span={10}>
                            <Image
                                src={ingredient?.ingredientImage || '/default-image.png'}
                                alt={ingredient?.nameIngredient || ''}
                                style={{
                                    width: '100%',
                                    height: 280,
                                    objectFit: 'cover',
                                    borderRadius: 8
                                }}
                            />
                            <Title level={4} style={{ marginTop: 16 }}>
                                {ingredient?.nameIngredient || 'Không rõ'}
                            </Title>
                            <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                                {category ? category.title : 'Không rõ danh mục'}
                            </Tag>
                            <Paragraph>{ingredient?.description || 'Không có mô tả'}</Paragraph>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label={<strong>Khối lượng mặc định</strong>}>
                                    {ingredient?.defaultAmount || 0} {ingredient?.defaultUnit || ''}
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>

                        {/* Cột phải: thông tin dinh dưỡng + công dụng */}
                        <Col span={14}>
                            <Divider>
                                Thông tin dinh dưỡng trên {ingredient?.defaultAmount || 0}/{ingredient?.defaultUnit || ''}
                            </Divider>

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

                            <Divider>Công dụng phổ biến</Divider>
                            <List
                                dataSource={ingredient?.commonUses || []}
                                renderItem={use => (
                                    <List.Item>
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                        {use}
                                    </List.Item>
                                )}
                                locale={{ emptyText: 'Không có công dụng phổ biến' }}
                            />
                        </Col>
                    </Row>
                </Card>
            )}

            {contextHolder} {/* Dùng để hiển thị confirm modal */}
        </Modal>
    );
};

export default IngredientDetailModal;
