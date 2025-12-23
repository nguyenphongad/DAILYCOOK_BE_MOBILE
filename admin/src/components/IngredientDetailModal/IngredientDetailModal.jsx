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
    Form,
    Empty
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
    isVisible,
    onClose,
    ingredient,
    onEdit,
    onDelete,
    allIngredientCategories,
    allMeasureUnits
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

    // Lấy tên đơn vị đo lường
    const getMeasureUnitLabel = (unitKey) => {
        const found = allMeasureUnits?.find(unit => unit.key === unitKey);
        return found ? found.label : unitKey;
    };

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
                            {ingredient?.name_en && (
                                <Paragraph italic style={{ color: '#666' }}>
                                    {ingredient.name_en}
                                </Paragraph>
                            )}
                            <Tag color="#4CAF50" style={{ marginBottom: 16 }}>
                                {category ? category.title : 'Không rõ danh mục'}
                            </Tag>
                            {ingredient?.code && (
                                <Paragraph>
                                    <strong>Mã:</strong> {ingredient.code}
                                </Paragraph>
                            )}
                            <Paragraph>{ingredient?.description || 'Không có mô tả'}</Paragraph>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label={<strong>Khối lượng mặc định</strong>}>
                                    {ingredient?.defaultAmount || 0} {getMeasureUnitLabel(ingredient?.defaultUnit)}
                                </Descriptions.Item>
                                {ingredient?.energy && (
                                    <Descriptions.Item label={<strong>Năng lượng</strong>}>
                                        {ingredient.energy} kcal
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Col>

                        {/* Cột phải: thông tin dinh dưỡng chi tiết + công dụng */}
                        <Col span={14}>
                            <Divider>
                                Thông tin dinh dưỡng chi tiết
                            </Divider>

                            {Array.isArray(ingredient?.nutrition) && ingredient.nutrition.length > 0 ? (
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <List
                                        dataSource={ingredient.nutrition}
                                        renderItem={item => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={
                                                        <span>
                                                            {item.name}
                                                            {item.name_en && item.name_en !== item.name && (
                                                                <span style={{ color: '#999', fontSize: '12px', marginLeft: 8 }}>
                                                                    ({item.name_en})
                                                                </span>
                                                            )}
                                                        </span>
                                                    }
                                                />
                                                <div style={{ fontWeight: 'bold' }}>
                                                    {item.value} {item.unit}
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            ) : (
                                <Empty description="Chưa có thông tin dinh dưỡng chi tiết" />
                            )}

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

            {contextHolder}
        </Modal>
    );
};

export default IngredientDetailModal;
