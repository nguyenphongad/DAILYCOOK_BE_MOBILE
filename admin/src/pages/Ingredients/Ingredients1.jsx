import { useState, useEffect } from 'react';
import { Modal, Form } from 'antd';
import { ImportOutlined } from '@ant-design/icons';

import sampleData from '../../assets/data_sample_ingredient.json';
import Loading from '../../components/Loading/Loading';
import IngredientForm from '../../components/IngredientForm/IngredientForm';
import IngredientDetailModal from '../../components/IngredientDetailModal/IngredientDetailModal';

const Ingredients1 = () => {
    // --- STATE QUẢN LÝ ---
    const [ingredients, setIngredients] = useState([]);                     // Danh sách nguyên liệu
    const [loading, setLoading] = useState(true);                           // Trạng thái loading
    const [allIngredientCategories, setAllIngredientCategories] = useState([]); // Danh mục nguyên liệu
    const [allMeasureUnits, setAllMeasureUnits] = useState([]);             // Đơn vị đo lường

    // Modal thêm nguyên liệu
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Modal chi tiết nguyên liệu
    const [isIngredientDetailModalVisible, setIsIngredientDetailModalVisible] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);

    // --- HOOKS ---
    useEffect(() => {
        // Giả lập việc lấy dữ liệu từ API
        const fetchIngredients = () => {
            setLoading(true);
            setTimeout(() => {
                setIngredients(sampleData.ingredients);
                setAllIngredientCategories(sampleData.ingredientCategories);
                setAllMeasureUnits(sampleData.measurementUnits);
                setLoading(false);
            }, 1000);
        };
        fetchIngredients();
    }, []);

    // --- HELPER ---
    // Lấy tên danh mục từ ID
    const getCategoryTitle = (id) => {
        const cat = allIngredientCategories.find(c => c._id === id);
        return cat ? cat.title : id;
    };

    // --- HANDLERS ---
    // Mở modal chi tiết nguyên liệu
    const showIngredientDetail = (ingredient) => {
        setSelectedIngredient(ingredient);
        setIsIngredientDetailModalVisible(true);
    };

    // Đóng modal chi tiết nguyên liệu
    const handleIngredientDetailClose = () => {
        setIsIngredientDetailModalVisible(false);
        setSelectedIngredient(null);
    };

    // Mở modal thêm nguyên liệu
    const showModalAddIngredient = () => {
        setIsModalVisible(true);
    };

    // Submit form thêm nguyên liệu mới
    const handleSubmit = (values) => {
        console.log('Form submitted:', values);

        const newIngredient = {
            _id: Date.now().toString(),
            nameIngredient: values.nameIngredient,
            ingredientCategory: values.ingredientCategory, // ID danh mục
            description: values.description,
            commonUses: values.commonUses || [],
            defaultAmount: values.defaultAmount,
            defaultUnit: values.defaultUnit, // Đơn vị đo lường (g/ml/…)
            ingredientImage: values.ingredientImage || "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg",
            nutrition: values.nutrition || {}
        };

        setIngredients(prev => [...prev, newIngredient]);
        handleCancel();
    };

    // Chỉnh sửa nguyên liệu
    const handleEditIngredient = (updatedIngredient) => {
        setIngredients(prev =>
            prev.map(ing => ing._id === updatedIngredient._id ? updatedIngredient : ing)
        );
    };

    // Xóa nguyên liệu
    const handleDeleteIngredient = (ingredientId) => {
        setIngredients(prev => prev.filter(ing => ing._id !== ingredientId));
    };

    // Đóng modal thêm nguyên liệu
    const handleCancel = () => {
        form.resetFields();
        setIsModalVisible(false);
    };

    // --- RENDER ---
    return (
        <div className="ingredients-container">
            {/* Loading overlay */}
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
                    {/* Header */}
                    <div className="page-header">
                        <h1>Quản lý nguyên liệu</h1>
                        <div className="action-buttons">
                            <button className="import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="add-button" onClick={showModalAddIngredient}>
                                + Thêm nguyên liệu
                            </button>
                        </div>
                    </div>

                    {/* Bộ lọc tìm kiếm */}
                    <div className="container-filter">
                        <div className="search-bar">
                            <input type="text" placeholder="Tìm kiếm nguyên liệu..." />
                            <button>Tìm</button>
                        </div>
                        <div className="filters">
                            <select>
                                <option value="">Tất cả danh mục</option>
                                <option value="main">Rau</option>
                                <option value="soup">Thịt</option>
                                <option value="dessert">Trái cây</option>
                            </select>
                            <select>
                                <option value="">Sắp xếp theo</option>
                                <option value="name_asc">Tên (A-Z)</option>
                                <option value="name_desc">Tên (Z-A)</option>
                                <option value="time_asc">Calo (Tăng dần)</option>
                                <option value="time_desc">Calo (Giảm dần)</option>
                            </select>
                        </div>
                    </div>

                    {/* Danh sách nguyên liệu */}
                    <div className="ingredients-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải nguyên liệu..." />
                        ) : (
                            <div className="ingredients-grid">
                                {ingredients.map(ingredient => (
                                    <div
                                        key={ingredient._id}
                                        className="ingredient-card"
                                        onClick={() => showIngredientDetail(ingredient)}
                                    >
                                        <div className="ingredient-image">
                                            <img src={ingredient.ingredientImage} alt={ingredient.nameIngredient} />
                                            <span className="category-badge">
                                                {getCategoryTitle(ingredient.ingredientCategory)}
                                            </span>
                                        </div>
                                        <div className="ingredient-content">
                                            <h3>{ingredient.nameIngredient}</h3>
                                            <p className="description">{ingredient.description}</p>
                                            <div className="ingredient-info">
                                                <div className="ingredient-commonUses-container">
                                                    {ingredient.commonUses.map((use, index) => (
                                                        <span key={index} className="ingredient-commonUse">
                                                            {use}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal thêm nguyên liệu */}
            <Modal
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Thêm nguyên liệu mới</span>}
                open={isModalVisible}
                onCancel={handleCancel}
                width={1600}
                style={{
                    top: 20,
                    maxWidth: '90%',
                    margin: '0 auto'
                }}
                footer={null}
            >
                <IngredientForm
                    form={form}
                    onFinish={handleSubmit}
                    onCancel={handleCancel}
                    allIngredientCategories={allIngredientCategories}
                    allMeasureUnits={allMeasureUnits}
                    isEdit={false}
                />
            </Modal>

            {/* Modal chi tiết nguyên liệu */}
            <IngredientDetailModal
                isVisible={isIngredientDetailModalVisible}
                onClose={handleIngredientDetailClose}
                ingredient={selectedIngredient}
                onEdit={handleEditIngredient}
                onDelete={handleDeleteIngredient}
                allIngredientCategories={allIngredientCategories}
                allMeasureUnits={allMeasureUnits}
            />
        </div>
    );
};

export default Ingredients1;
