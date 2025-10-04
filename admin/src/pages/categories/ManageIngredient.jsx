import { useState, useEffect } from 'react';
import { ImportOutlined } from '@ant-design/icons';
import { Modal, Form } from 'antd';

import sampleData from '../../assets/data_sample_ingredientCategory.json';
import Loading from '../../components/Loading/Loading';
import IngredientCategoryForm from '../../components/Categories/IngredientCategoryForm';

const ManageIngredient = () => {
    const [ingredientCategories, setIngredientCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchIngredientCategories = () => {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setIngredientCategories(sampleData.ingredientCategories);
            }, 1000);
        };
        fetchIngredientCategories();
    }, []);

    const showModalAddIngredientCategory = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        form.resetFields();
        setIsModalVisible(false);
    };

    const handleSubmit = (values) => {
        console.log("Dữ liệu form:", values);
        const newIngredientCategory = {
            _id: Date.now().toString(),
            keyword: values.keyword,
            title: values.title,
            description: values.description
        }
        setIngredientCategories(prev => [...prev, newIngredientCategory]);
        handleCancel()
    };

    return (
        <div className="ingredientCategories-container">
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
                    <div className="page-header">
                        <h1>Quản lý danh mục nguyên liệu</h1>
                        <div className="action-buttons">
                            <button className="import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="add-button" onClick={showModalAddIngredientCategory}>
                                + Thêm danh mục nguyên liệu
                            </button>
                        </div>
                    </div>

                    <div className="container-filter">
                        <div className="search-bar">
                            <input type="text" placeholder="Tìm kiếm nguyên liệu..." />
                            <button>Tìm</button>
                        </div>
                    </div>

                    {/* Danh sách */}
                    <div className="ingredientCategories-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải danh mục nguyên liệu..." />
                        ) : (
                            <div className="ingredientCategories-grid">
                                {ingredientCategories.map(ingredientCategory => (
                                    <div key={ingredientCategory._id} className="ingredientCategory-card">
                                        <div className="ingredientCategory-keyword">
                                            <span className="category-badge">{ingredientCategory.keyword}</span>
                                        </div>
                                        <div className="ingredientCategory-content">
                                            <h3>{ingredientCategory.title}</h3>
                                            <p className="description">{ingredientCategory.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Add Form */}
            <Modal
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Thêm danh mục nguyên liệu mới</span>}
                open={isModalVisible}
                onCancel={handleCancel}
                width={1600}
                style={{

                    maxWidth: '90%',
                    margin: '0 auto'
                }}
                footer={null}
            >
                <IngredientCategoryForm
                    form={form}
                    onFinish={handleSubmit}
                    onCancel={handleCancel}
                    isEdit={false}
                />
            </Modal>
        </div>
    );
};

export default ManageIngredient;
