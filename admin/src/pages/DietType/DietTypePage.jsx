
import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Upload, message, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons'
import '../../../src/styles/pages/DietTypePage.scss'

const { TextArea } = Input;

// Dữ liệu mẫu cho chế độ ăn
const sampleDietTypes = [
    {
        _id: '1',
        key_word: 'ketogenic',
        title: 'Keto',
        description: 'Chế độ ăn ít carb, nhiều chất béo lành mạnh giúp cơ thể đốt cháy chất béo thay vì carbohydrate.',
        descriptionDetail: 'Chế độ ăn Keto (viết tắt của Ketogenic) là một phương pháp ăn uống tập trung vào việc giảm lượng carbohydrate và tăng cường chất béo để đưa cơ thể vào trạng thái ketosis - khi cơ thể đốt cháy chất béo thay vì glucose để lấy năng lượng. Chế độ ăn này thường bao gồm 70-80% chất béo, 15-25% protein và chỉ 5-10% carbohydrate.',
        researchSource: 'Journal of Nutrition and Metabolism, 2018',
        DietTypeImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061'
    },
    {
        _id: '2',
        key_word: 'plant-based',
        title: 'Thuần chay',
        description: 'Chế độ ăn dựa hoàn toàn vào thực vật mà không có thực phẩm có nguồn gốc động vật.',
        descriptionDetail: 'Chế độ ăn thuần chay loại bỏ tất cả các sản phẩm có nguồn gốc động vật, bao gồm thịt, cá, sữa, trứng và mật ong. Thay vào đó, nó tập trung vào rau, trái cây, đậu, hạt, ngũ cốc và các thực phẩm từ thực vật khác. Chế độ ăn này không chỉ là một lựa chọn dinh dưỡng mà còn là lối sống ủng hộ động vật và bảo vệ môi trường.',
        researchSource: 'American Journal of Clinical Nutrition, 2019',
        DietTypeImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
    },
    {
        _id: '3',
        key_word: 'mediterranean',
        title: 'Địa Trung Hải',
        description: 'Chế độ ăn dựa trên thói quen ăn uống truyền thống của các quốc gia quanh Địa Trung Hải.',
        descriptionDetail: 'Chế độ ăn Địa Trung Hải bao gồm nhiều rau, trái cây, ngũ cốc nguyên hạt, đậu, hạt và dầu ô liu. Nó cũng bao gồm một lượng vừa phải cá, gia cầm, trứng và các sản phẩm từ sữa, nhưng hạn chế thịt đỏ. Mô hình ăn uống này đã được chứng minh là có nhiều lợi ích cho sức khỏe tim mạch và tuổi thọ.',
        researchSource: 'New England Journal of Medicine, 2020',
        DietTypeImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352'
    }
];

const DietTypePage = () => {
    const [dietTypes, setDietTypes] = useState(sampleDietTypes)
    const [loading, setLoading] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingDietType, setEditingDietType] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
    const [form] = Form.useForm()

    const showModal = (record = null) => {
        setEditingDietType(record)
        setImagePreview(record?.DietTypeImage || null)
        form.resetFields()
        
        if (record) {
            form.setFieldsValue({
                key_word: record.key_word,
                title: record.title,
                description: record.description,
                descriptionDetail: record.descriptionDetail,
                researchSource: record.researchSource
            })
        }
        
        setIsModalVisible(true)
    }

    const handleCancel = () => {
        setIsModalVisible(false)
        setEditingDietType(null)
        setImagePreview(null)
        form.resetFields()
    }

    const handleSubmit = (values) => {
        try {
            // Tạo object mới từ dữ liệu form
            const newDietType = {
                _id: editingDietType ? editingDietType._id : Date.now().toString(),
                key_word: values.key_word,
                title: values.title,
                description: values.description || '',
                descriptionDetail: values.descriptionDetail || '',
                researchSource: values.researchSource || '',
                DietTypeImage: imagePreview
            };
            
            if (editingDietType) {
                // Cập nhật chế độ ăn hiện có
                setDietTypes(dietTypes.map(item => 
                    item._id === editingDietType._id ? newDietType : item
                ));
                message.success('Cập nhật chế độ ăn thành công');
            } else {
                // Thêm chế độ ăn mới
                setDietTypes([...dietTypes, newDietType]);
                message.success('Thêm chế độ ăn mới thành công');
            }
            
            setIsModalVisible(false);
            setImagePreview(null);
            form.resetFields();
        } catch (error) {
            console.error('Lỗi khi lưu chế độ ăn:', error);
            message.error('Không thể lưu chế độ ăn');
        }
    }

    const handleDelete = (id) => {
        setDietTypes(dietTypes.filter(item => item._id !== id));
        message.success('Xóa chế độ ăn thành công');
    }

    const handleImagePreview = (file) => {
        if (!file.url && !file.preview) {
            file.preview = URL.createObjectURL(file.originFileObj);
        }
        setImagePreview(file.url || file.preview)
        setImagePreviewVisible(true)
    }

    const uploadProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Bạn chỉ có thể tải lên tệp hình ảnh!');
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error('Kích thước hình ảnh phải nhỏ hơn 2MB!');
            }
            return isImage && isLt2M;
        },
        onChange: ({ fileList }) => {
            // Xem trước hình ảnh khi thay đổi
            if (fileList.length > 0) {
                const lastFile = fileList[fileList.length - 1];
                if (lastFile.originFileObj) {
                    lastFile.preview = URL.createObjectURL(lastFile.originFileObj);
                    setImagePreview(lastFile.preview);
                }
            } else {
                setImagePreview(null);
            }
        }
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'DietTypeImage',
            key: 'DietTypeImage',
            render: (text) => (
                text ? (
                    <img 
                        src={text} 
                        alt="Diet type" 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => {
                            setImagePreview(text);
                            setImagePreviewVisible(true);
                        }}
                    />
                ) : (
                    <span>Không có ảnh</span>
                )
            )
        },
        {
            title: 'Từ khóa',
            dataIndex: 'key_word',
            key: 'key_word',
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <div className="action-buttons">
                    <Tooltip title="Xem chi tiết">
                        <Button 
                            icon={<EyeOutlined />} 
                            size="small" 
                            onClick={() => showDetailModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button 
                            icon={<EditOutlined />} 
                            size="small" 
                            onClick={() => showModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Xóa chế độ ăn này?"
                            description="Bạn có chắc chắn muốn xóa chế độ ăn này không?"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button 
                                icon={<DeleteOutlined />} 
                                size="small" 
                                danger
                            />
                        </Popconfirm>
                    </Tooltip>
                </div>
            )
        },
    ]

    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedDietType, setSelectedDietType] = useState(null);

    const showDetailModal = (record) => {
        setSelectedDietType(record);
        setDetailModalVisible(true);
    }

    return (
        <div className="diet-type-page">
            <div className="diet-type-header">
                <h1>Quản lý chế độ ăn</h1>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => showModal()}
                >
                    Thêm chế độ ăn
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={dietTypes}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingDietType ? "Chỉnh sửa chế độ ăn" : "Thêm chế độ ăn mới"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="key_word"
                        label="Từ khóa"
                        rules={[{ required: true, message: 'Vui lòng nhập từ khóa!' }]}
                    >
                        <Input placeholder="Nhập từ khóa" />
                    </Form.Item>

                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input placeholder="Nhập tiêu đề" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả ngắn"
                    >
                        <TextArea rows={2} placeholder="Nhập mô tả ngắn" />
                    </Form.Item>

                    <Form.Item
                        name="descriptionDetail"
                        label="Mô tả chi tiết"
                    >
                        <TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
                    </Form.Item>

                    <Form.Item
                        name="researchSource"
                        label="Nguồn tham khảo"
                    >
                        <Input placeholder="Nhập nguồn tham khảo" />
                    </Form.Item>

                    <Form.Item
                        name="DietTypeImage"
                        label="Hình ảnh"
                    >
                        <Upload
                            {...uploadProps}
                            listType="picture-card"
                            maxCount={1}
                            showUploadList={false}
                        >
                            {imagePreview ? (
                                <div className="image-preview-container">
                                    <img
                                        src={imagePreview}
                                        alt="preview"
                                        className="image-preview"
                                    />
                                    <div className="image-preview-overlay">
                                        <UploadOutlined />
                                        <div>Thay đổi</div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <div className="form-actions">
                        <Button onClick={handleCancel}>Hủy</Button>
                        <Button type="primary" htmlType="submit">
                            {editingDietType ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                open={imagePreviewVisible}
                title="Xem trước hình ảnh"
                footer={null}
                onCancel={() => setImagePreviewVisible(false)}
            >
                {imagePreview && (
                    <img
                        alt="preview"
                        style={{ width: '100%' }}
                        src={imagePreview}
                    />
                )}
            </Modal>

            <Modal
                title="Chi tiết chế độ ăn"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={700}
            >
                {selectedDietType && (
                    <div className="diet-type-detail">
                        <div className="detail-row">
                            <div className="detail-image">
                                {selectedDietType.DietTypeImage ? (
                                    <img
                                        src={selectedDietType.DietTypeImage}
                                        alt={selectedDietType.title}
                                    />
                                ) : (
                                    <div className="no-image">Không có ảnh</div>
                                )}
                            </div>
                            <div className="detail-info">
                                <h2>{selectedDietType.title}</h2>
                                <p className="detail-keyword"><strong>Từ khóa:</strong> {selectedDietType.key_word}</p>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Mô tả</h3>
                            <p>{selectedDietType.description}</p>
                        </div>

                        <div className="detail-section">
                            <h3>Mô tả chi tiết</h3>
                            <p>{selectedDietType.descriptionDetail}</p>
                        </div>

                        {selectedDietType.researchSource && (
                            <div className="detail-section">
                                <h3>Nguồn tham khảo</h3>
                                <p>{selectedDietType.researchSource}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default DietTypePage