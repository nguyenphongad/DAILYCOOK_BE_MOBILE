import { useState, useEffect } from 'react';
import { ImportOutlined } from '@ant-design/icons';
import { Modal, Form } from 'antd';

import sampleData from '../../assets/data_sample_dietType.json';
import Loading from '../../components/Loading/Loading';
import DietTypeForm from '../../components/DietTypeForm/DietTypeForm';
import DietTypeDetailModal from '../../components/DietTypeDetailModal/DietTypeDetailModal';

const DietTypePage = () => {
    const [dietType, setDietType] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDietTpeDetailModalVisible, setIsDietTpeDetailModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null); // << lưu danh mục được chọn
    const [form] = Form.useForm();


    useEffect(() => {
        const fetchDietType = () => {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setDietType(sampleData.dietType);
            }, 1000);
        };
        fetchDietType();
    }, []);

    const showModalAddDietType = () => {
        setSelectedCategory(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedCategory(null);
        setIsModalVisible(false);
    };

    const handleSubmit = (values) => {
        if (selectedCategory) {
            // Update (Edit)
            setDietType(prev =>
                prev.map(cat =>
                    cat._id === selectedCategory._id ? { ...cat, ...values } : cat
                )
            );
        } else {
            // Add
            const newDietType = {
                _id: Date.now().toString(),
                keyword: values.keyword,
                title: values.title,
                description: values.description,
                descriptionDetail: values.descriptionDetail,
                researchSource: values.researchSource,
                dietTypeImage: values.dietTypeImage
            };
            setDietType(prev => [...prev, newDietType]);
        }
        handleCancel();
    };

    const handleDelete = (id) => {
        setDietType(prev => prev.filter(cat => cat._id !== id));
        handleCancel();
    };

    const showDietTypeDetail = (tmp) => {
        setSelectedCategory(tmp);
        setIsDietTpeDetailModalVisible(true);
    };


    const handleDietTypeDetailClose = () => {
        setIsDietTpeDetailModalVisible(false);
        setSelectedCategory(null);
    };


    const handleEditDietType = (tmp) => {
        setDietType(prev =>
            prev.map(ing => ing._id === tmp._id ? tmp : ing)
        );
    };

    return (
        <div className="ingredients-container">
            {/* Loading overlay */}
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
                    {/* Header */}
                    <div className="page-header">
                        <h1>Quản lý chế độ ăn</h1>
                        <div className="action-buttons">
                            <button className="import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="add-button" onClick={showModalAddDietType}>
                                + Thêm chế độ ăn
                            </button>
                        </div>
                    </div>

                    {/* Bộ lọc tìm kiếm */}
                    <div className="container-filter">
                        <div className="search-bar">
                            <input type="text" placeholder="Tìm kiếm chế độ ăn..." />
                            <button>Tìm</button>
                        </div>
                        <div className="filters">
                            <select>
                                <option value="">Sắp xếp theo</option>
                                <option value="name_asc">Tên (A-Z)</option>
                                <option value="name_desc">Tên (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Danh sách nguyên liệu */}
                    <div className="ingredients-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải chế độ ăn..." />
                        ) : (
                            <div className="ingredients-grid">
                                {dietType.map(tmp => (
                                    <div
                                        key={tmp._id}
                                        className="ingredient-card"
                                        onClick={() => showDietTypeDetail(tmp)}
                                    >
                                        <div className="ingredient-image">
                                            <img src={tmp.dietTypeImage} alt={tmp.title} />
                                            <span className="category-badge">
                                                {tmp.keyword}
                                            </span>
                                        </div>
                                        <div className="ingredient-content">
                                            <h3>{tmp.title}</h3>
                                            <p className="description">{tmp.description}</p>
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
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Thêm chế độ ăn mới</span>}
                open={isModalVisible}
                onCancel={handleCancel}
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
                    onFinish={handleSubmit}
                    onCancel={handleCancel}
                    isEdit={false}
                />
            </Modal>

            <DietTypeDetailModal
                isVisible={isDietTpeDetailModalVisible}
                onClose={handleDietTypeDetailClose}
                dietType={selectedCategory}
                onEdit={handleEditDietType}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default DietTypePage;