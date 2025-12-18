import React, { useState } from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Upload,
    InputNumber,
    Divider,
    Card,
    message,
    Modal,
    Table,
    Space
} from 'antd';
import { PlusOutlined, DeleteOutlined, LoadingOutlined, SearchOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';
import { useDispatch, useSelector } from 'react-redux';
import { searchNutritionData } from '../../redux/thunks/nutritionThunk';
import { clearSearchResults } from '../../redux/slices/nutritionSlice';

const { Option } = Select;
const { TextArea } = Input;

const IngredientForm = ({
    form,
    onFinish,
    onCancel,
    initialValues = {},
    allIngredientCategories = [],
    allMeasureUnits = [],
    isEdit = false
}) => {
    const dispatch = useDispatch();
    
    // Redux state
    const { searchResults: nutritionSearchResults, loading: searchingNutrition } = useSelector(
        (state) => state.nutrition
    );

    // ==================== STATE ====================
    const [commonUses, setCommonUses] = useState(initialValues?.commonUses || []);
    const [newUse, setNewUse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [imageUrl, setImageUrl] = useState(initialValues?.ingredientImage || '');
    const [pastedImage, setPastedImage] = useState(null);
    
    // State cho modal tìm kiếm dinh dưỡng
    const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
    const [nutritionSearchKeyword, setNutritionSearchKeyword] = useState('');

    // ==================== HÀM XỬ LÝ ====================

    // Reset toàn bộ state của form
    const resetFormState = () => {
        setCommonUses([]);
        setNewUse('');
        setFileList([]);
        setImageUrl('');
        setPastedImage(null);
        form.resetFields();
    };

    // Thêm công dụng mới
    const addCommonUse = () => {
        if (newUse.trim()) {
            setCommonUses([...commonUses, newUse.trim()]);
            setNewUse('');
        }
    };

    // Xóa công dụng theo index
    const removeCommonUse = (index) => {
        setCommonUses(commonUses.filter((_, i) => i !== index));
    };

    // Xử lý dán ảnh từ clipboard
    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    // Tạo preview
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setImageUrl(event.target.result);
                        setPastedImage(file);
                        // Clear file list khi dán ảnh mới
                        setFileList([]);
                    };
                    reader.readAsDataURL(file);
                }
                break;
            }
        }
    };

    // Clear ảnh đã dán
    const clearPastedImage = () => {
        setPastedImage(null);
        setImageUrl(initialValues?.ingredientImage || '');
    };

    // Tìm kiếm thông tin dinh dưỡng từ API qua Redux
    const handleSearchNutrition = async () => {
        if (!nutritionSearchKeyword.trim()) {
            message.warning('Vui lòng nhập tên thực phẩm để tìm kiếm');
            return;
        }

        try {
            const result = await dispatch(searchNutritionData({
                keyword: nutritionSearchKeyword.trim(),
                page: 1,
                pageSize: 15
            })).unwrap();
            
            if (result && result.length > 0) {
                message.success(`Tìm thấy ${result.length} kết quả`);
            }
        } catch (error) {
            // Error được handle trong thunk
            console.error('Search error:', error);
        }
    };

    // Chọn thực phẩm từ kết quả tìm kiếm
    const handleSelectNutritionData = (foodData) => {
        // Điền thông tin vào form
        form.setFieldsValue({
            code: foodData.code || '',
            nameIngredient: foodData.name_vi || '',
            name_en: foodData.name_en || '',
            energy: foodData.energy || 0,
            nutrition: foodData.nutrition || []
        });

        // Đóng modal và clear kết quả
        setNutritionModalVisible(false);
        dispatch(clearSearchResults());
        setNutritionSearchKeyword('');
        
        message.success('Đã tự động điền thông tin dinh dưỡng!');
    };

    // Đóng modal và clear search results
    const handleCloseNutritionModal = () => {
        setNutritionModalVisible(false);
        dispatch(clearSearchResults());
        setNutritionSearchKeyword('');
    };

    // Xử lý submit form
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            // Upload ảnh nếu có file mới hoặc ảnh được dán
            if (pastedImage) {
                // Ưu tiên ảnh được dán
                const uploadResult = await uploadImage(pastedImage, { folder: 'ingredient' });
                values.ingredientImage = uploadResult.secure_url;
            } else if (fileList.length > 0) {
                const file = convertAntdUploadFileToFile(fileList[0]);
                if (file) {
                    const uploadResult = await uploadImage(file, { folder: 'ingredient' });
                    values.ingredientImage = uploadResult.secure_url;
                }
            } else if (imageUrl) {
                // giữ nguyên ảnh cũ nếu không upload file mới
                values.ingredientImage = imageUrl;
            }

            // Chuẩn hóa dữ liệu trước khi gửi
            const ingredientData = {
                ...values,
                nameIngredient: values.nameIngredient.trim(),
                name_en: values.name_en?.trim() || '',
                code: values.code?.trim() || '',
                description: values.description?.trim() || 'Không có mô tả',
                ingredientCategory: values.ingredientCategory,
                defaultAmount: values.defaultAmount,
                defaultUnit: values.defaultUnit,
                energy: values.energy || 0,
                nutrition: values.nutrition || [],
                commonUses,
                ingredientImage: values.ingredientImage || null
            };

            await onFinish(ingredientData); // gọi callback từ parent
            
            // Reset form sau khi thêm thành công
            resetFormState();
        } catch (error) {
            message.error(`Đã xảy ra lỗi: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== XỬ LÝ UPLOAD ====================

    // Khi file thay đổi
    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        // Clear ảnh đã dán khi chọn file mới
        if (newFileList.length > 0) {
            setPastedImage(null);
        }
    };

    // Trước khi upload (check type & size)
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Bạn chỉ có thể tải lên file ảnh!');
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Kích thước ảnh phải nhỏ hơn 2MB!');
            return false;
        }

        // Preview ảnh
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setImageUrl(reader.result);
        };

        return false; // prevent default upload
    };

    const uploadButton = (
        <div>
            {submitting ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Tải lên</div>
        </div>
    );

    // Columns cho bảng tìm kiếm dinh dưỡng
    const nutritionSearchColumns = [
        {
            title: 'Mã',
            dataIndex: 'code',
            key: 'code',
            width: 100
        },
        {
            title: 'Tên tiếng Việt',
            dataIndex: 'name_vi',
            key: 'name_vi',
            width: 200
        },
        {
            title: 'Tên tiếng Anh',
            dataIndex: 'name_en',
            key: 'name_en',
            width: 200
        },
        {
            title: 'Năng lượng',
            dataIndex: 'energy',
            key: 'energy',
            width: 100,
            render: (val) => `${val || 0} kcal`
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Button type="primary" size="small" onClick={() => handleSelectNutritionData(record)}>
                    Chọn
                </Button>
            )
        }
    ];

    // ==================== RENDER ====================
    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
                ...initialValues,
                nutrition: initialValues?.nutrition || []
            }}
            className="ingredient-form"
        >
            {/* Nút lấy thông tin dinh dưỡng */}
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button
                    type="dashed"
                    icon={<SearchOutlined />}
                    onClick={() => setNutritionModalVisible(true)}
                >
                    Lấy thông tin dinh dưỡng từ viendinhduong.vn
                </Button>
            </div>

            <Row gutter={24}>
                {/* ================== CỘT TRÁI: Thông tin cơ bản ================== */}
                <Col span={14}>
                    <Card title={<strong>Thông tin nguyên liệu</strong>} variant="bordered">
                        {/* Mã nguyên liệu */}
                        <Form.Item name="code" label="Mã nguyên liệu">
                            <Input placeholder="Nhập mã nguyên liệu (tùy chọn)" />
                        </Form.Item>

                        {/* Tên nguyên liệu */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="nameIngredient"
                                    label="Tên nguyên liệu (VI)"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên nguyên liệu' }]}
                                >
                                    <Input placeholder="Nhập tên tiếng Việt" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="name_en" label="Tên nguyên liệu (EN)">
                                    <Input placeholder="Nhập tên tiếng Anh" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Danh mục hệ thống */}
                        <Form.Item
                            name="ingredientCategory"
                            label="Danh mục hệ thống"
                            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                        >
                            <Select placeholder="Chọn danh mục nguyên liệu">
                                {allIngredientCategories.map(cat => (
                                    <Option key={cat._id} value={cat._id}>
                                        {cat.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Số lượng & đơn vị & năng lượng */}
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="defaultAmount"
                                    label="Số lượng mặc định"
                                    rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                                >
                                    <InputNumber style={{ width: '100%' }} min={0} placeholder="100" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="defaultUnit"
                                    label="Đơn vị"
                                    rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
                                >
                                    <Select placeholder="Chọn đơn vị">
                                        {allMeasureUnits.map(unit => (
                                            <Option key={unit.key} value={unit.key}>
                                                {unit.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="energy" label="Năng lượng (kcal)">
                                    <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Mô tả */}
                        <Form.Item name="description" label="Mô tả">
                            <TextArea rows={3} placeholder="Mô tả ngắn gọn về nguyên liệu" />
                        </Form.Item>

                        {/* Upload ảnh */}
                        <Form.Item label="Ảnh đại diện">
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {/* Khu vực dán ảnh */}
                                <div style={{ 
                                    border: "2px dashed #d9d9d9", 
                                    borderRadius: 8, 
                                    padding: 16,
                                    textAlign: "center",
                                    backgroundColor: pastedImage ? "#f6ffed" : "#fafafa",
                                    borderColor: pastedImage ? "#52c41a" : "#d9d9d9"
                                }}>
                                    <div style={{ marginBottom: 8, color: "#666", fontSize: 14 }}>
                                        📋 Dán ảnh từ clipboard (Ctrl+V)
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Click vào đây và nhấn Ctrl+V để dán ảnh"
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: 4,
                                            outline: "none"
                                        }}
                                        onPaste={handlePaste}
                                        readOnly
                                    />
                                    {pastedImage && (
                                        <div style={{ marginTop: 8 }}>
                                            <span style={{ color: "#52c41a", fontSize: 12 }}>
                                                ✅ Đã dán ảnh thành công! 
                                            </span>
                                            <Button 
                                                type="link" 
                                                size="small" 
                                                onClick={clearPastedImage}
                                                style={{ padding: 0, marginLeft: 8 }}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ textAlign: "center", color: "#999", fontSize: 12 }}>
                                    hoặc
                                </div>

                                {/* Upload từ thiết bị */}
                                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                                    <Upload
                                        name="ingredientImage"
                                        listType="picture-card"
                                        showUploadList={true}
                                        fileList={fileList}
                                        beforeUpload={beforeUpload}
                                        onChange={handleChange}
                                        maxCount={1}
                                        accept="image/*"
                                        style={{ width: 120, height: 120, borderRadius: 8 }}
                                        disabled={pastedImage !== null}
                                    >
                                        {(fileList.length >= 1 || pastedImage) ? null : uploadButton}
                                    </Upload>

                                    {/* Preview ảnh hiện tại */}
                                    {!fileList.length && !pastedImage && imageUrl && (
                                        <div style={{ textAlign: "center" }}>
                                            <img
                                                src={imageUrl}
                                                alt="Current"
                                                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                                            />
                                            <p style={{ marginTop: 8, fontSize: 13, color: "#888" }}>Ảnh hiện tại</p>
                                        </div>
                                    )}

                                    {/* Preview ảnh đã dán */}
                                    {pastedImage && imageUrl && (
                                        <div style={{ textAlign: "center" }}>
                                            <img
                                                src={imageUrl}
                                                alt="Pasted"
                                                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                                            />
                                            <p style={{ marginTop: 8, fontSize: 13, color: "#52c41a" }}>Ảnh đã dán</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Form.Item>
                    </Card>
                </Col>

                {/* ================== CỘT PHẢI: Dinh dưỡng + Công dụng ================== */}
                <Col span={10}>
                    {/* Thông tin dinh dưỡng chi tiết */}
                    <Card title={<strong>Thông tin dinh dưỡng chi tiết</strong>} variant="bordered">
                        <Form.List name="nutrition">
                            {(fields, { add, remove }) => (
                                <>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 12 }}>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Card key={key} size="small" style={{ marginBottom: 8 }}>
                                                <Row gutter={8}>
                                                    <Col span={11}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'name']}
                                                            rules={[{ required: true, message: 'Nhập tên' }]}
                                                        >
                                                            <Input placeholder="Tên (VI)" size="small" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={11}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'name_en']}
                                                        >
                                                            <Input placeholder="Tên (EN)" size="small" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={2}>
                                                        <MinusCircleOutlined 
                                                            onClick={() => remove(name)}
                                                            style={{ color: 'red', fontSize: 16 }}
                                                        />
                                                    </Col>
                                                </Row>
                                                <Row gutter={8}>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'value']}
                                                            rules={[{ required: true, message: 'Nhập giá trị' }]}
                                                        >
                                                            <InputNumber 
                                                                placeholder="Giá trị" 
                                                                style={{ width: '100%' }} 
                                                                size="small"
                                                                min={0}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'unit']}
                                                            rules={[{ required: true, message: 'Nhập đơn vị' }]}
                                                        >
                                                            <Input placeholder="Đơn vị (g, mg, mcg)" size="small" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                    </div>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm thành phần dinh dưỡng
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </Card>

                    <Divider />

                    {/* Công dụng phổ biến */}
                    <Card title={<strong>Công dụng phổ biến</strong>} variant="bordered">
                        {/* Thêm công dụng */}
                        <Row gutter={8} style={{ marginBottom: 12 }}>
                            <Col span={18}>
                                <Input
                                    value={newUse}
                                    placeholder="Thêm công dụng"
                                    onChange={(e) => setNewUse(e.target.value)}
                                    onPressEnter={addCommonUse}
                                />
                            </Col>
                            <Col span={6}>
                                <Button
                                    type="primary"
                                    onClick={addCommonUse}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Thêm
                                </Button>
                            </Col>
                        </Row>

                        {/* Danh sách công dụng */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {commonUses.map((use, index) => (
                                <Button
                                    key={index}
                                    size="small"
                                    style={{ borderRadius: 20 }}
                                    onClick={() => removeCommonUse(index)}
                                    icon={<DeleteOutlined />}
                                >
                                    {use}
                                </Button>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* ================== FOOTER FORM ================== */}
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                    {isEdit ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
                </Button>
            </div>

            {/* ================== MODAL TÌM KIẾM DINH DƯỠNG ================== */}
            <Modal
                title="Tìm kiếm thông tin dinh dưỡng"
                open={nutritionModalVisible}
                onCancel={handleCloseNutritionModal}
                width={1200}
                footer={null}
            >
                <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                    <Input
                        placeholder="Nhập tên thực phẩm để tìm kiếm..."
                        value={nutritionSearchKeyword}
                        onChange={(e) => setNutritionSearchKeyword(e.target.value)}
                        onPressEnter={handleSearchNutrition}
                    />
                    <Button 
                        type="primary" 
                        icon={<SearchOutlined />}
                        onClick={handleSearchNutrition}
                        loading={searchingNutrition}
                    >
                        Tìm kiếm
                    </Button>
                </Space.Compact>

                <Table
                    columns={nutritionSearchColumns}
                    dataSource={Array.isArray(nutritionSearchResults) ? nutritionSearchResults : []}
                    rowKey="_id"
                    loading={searchingNutrition}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 900, y: 400 }}
                    locale={{
                        emptyText: nutritionSearchKeyword 
                            ? 'Không tìm thấy kết quả phù hợp' 
                            : 'Nhập từ khóa để tìm kiếm'
                    }}
                />
            </Modal>
        </Form>
    );
};

export default IngredientForm;
