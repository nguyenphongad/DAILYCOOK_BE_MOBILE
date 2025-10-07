import { useState, useEffect } from 'react';
import { Modal, Form, Pagination, Empty } from 'antd';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import Loading from '../../components/Loading/Loading';
import IngredientForm from '../../components/IngredientForm/IngredientForm';
import IngredientDetailModal from '../../components/IngredientDetailModal/IngredientDetailModal'
import { useDispatch, useSelector } from 'react-redux';
import { fetchIngredientCategories } from '../../redux/thunks/ingredientCategoryThunk';
import { fetchMeasurementUnits } from '../../redux/thunks/measurementUnitsThunk'
import {
    addIngredient,
    updateIngredient,
    deleteIngredient,
    fetchIngredients,
} from '../../redux/thunks/ingredientThunk';
import { toast } from 'sonner';

const Ingredients1 = () => {
    const dispatch = useDispatch();
    const ingredientState = useSelector((state) => state.ingredient);
    const ingredientCategoryState = useSelector((state) => state.ingredientCategory);
    const measurementUnitsState = useSelector((state) => state.measurementUnits)

    const { ingredients = [], loading, pagination = { page: 1, limit: 9, total: 0 } } = ingredientState || {};
    const { ingredientCategories = [] } = ingredientCategoryState || {};
    const { measurementUnits = [] } = measurementUnitsState || {};

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isIngredientDetailModalVisible, setIsIngredientDetailModalVisible] = useState(false)
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [form] = Form.useForm();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch initial data
    useEffect(() => {
        dispatch(fetchIngredients({ page: 1, limit: 9 }));
        dispatch(fetchIngredientCategories({ page: 1, limit: 50 }));
        dispatch(fetchMeasurementUnits());
    }, [dispatch]);

    // Filter
    const filteredIngredients = (ingredients || []).filter(
        (item) =>
            (item.title || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
            (item.keyword || '').toLowerCase().includes(searchKeyword.toLowerCase())
    );

    // Sort
    const sortedIngredients = [...filteredIngredients].sort((a, b) => {
        if (sortOrder === 'name_asc') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (sortOrder === 'name_desc') {
            return (b.title || '').localeCompare(a.title || '');
        }
        return 0;
    });

    // Modal handlers
    const showModalAddIngredient = () => {
        setSelectedIngredient(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedIngredient(null);
        setIsModalVisible(false);
    };

    // Submit form
    const handleSubmit = async (values) => {
        try {
            if (selectedIngredient) {
                await dispatch(
                    updateIngredient({
                        id: selectedIngredient._id,
                        ingredientData: values,
                    })
                ).unwrap();
                toast.success('Cập nhật nguyên liệu thành công!');
            } else {
                await dispatch(addIngredient(values)).unwrap();
                toast.success('Thêm nguyên liệu thành công!');
            }
            handleCancel();
        } catch (error) {
            console.error(error);
            toast.error(error?.message || 'Thao tác thất bại, vui lòng thử lại!');
        }
    };

    // Delete
    const handleDelete = async (id) => {
        try {
            await dispatch(deleteIngredient(id)).unwrap();
            toast.success('Xóa nguyên liệu thành công!');
            handleCancel();
        } catch (error) {
            console.error(error);
            toast.error('Không thể xóa nguyên liệu này!');
        }
    };

    // Click to edit
    const handleCardClick = (ingredient) => {
        setSelectedIngredient(ingredient);
        form.setFieldsValue(ingredient);
        setIsModalVisible(true);
        setIsIngredientDetailModalVisible(true);
    };

    const handleIngredientDetailClose = () => {
        setIsIngredientDetailModalVisible(false);
    };
    const handleEdit = (updatedIngredient) => {
        // Ví dụ đơn giản
        dispatch(updateIngredient(updatedIngredient));
    };

    // Pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
        dispatch(fetchIngredients({ page, limit: pagination.limit }));
    };

    const handleSearch = () => { };

    // --- RENDER ---
    return (
        <div className="ingredients-container">
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
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

                    {/* Bộ lọc */}
                    <div className="container-filter">
                        <div className="search-bar">
                            <input
                                placeholder="Tìm kiếm nguyên liệu..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <button onClick={handleSearch}>
                                <SearchOutlined /> Tìm
                            </button>
                        </div>
                        <div className="filters">
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="">Sắp xếp theo</option>
                                <option value="name_asc">Tên (A-Z)</option>
                                <option value="name_desc">Tên (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    <div className="ingredients-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải danh sách nguyên liệu..." />
                        ) : sortedIngredients.length > 0 ? (
                            <div className="ingredients-grid">
                                {sortedIngredients.map((ingredient) => (
                                    <div
                                        key={ingredient._id}
                                        className="ingredient-card"
                                        onClick={() => handleCardClick(ingredient)}
                                    >
                                        <div className="ingredient-keyword">
                                            <span className="ingredient-badge">{ingredient.keyword}</span>
                                        </div>
                                        <div className="ingredient-content">
                                            <h3>{ingredient.title}</h3>
                                            <p className="description">{ingredient.description}</p>
                                            <p className="category">
                                                Danh mục: {ingredient.category?.title || 'Chưa phân loại'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Empty description="Không có nguyên liệu nào" />
                            </div>
                        )}
                    </div>

                    {/* Phân trang */}
                    {pagination.total > 0 && (
                        <div className="pagination-container">
                            <Pagination
                                current={pagination.page}
                                total={pagination.total}
                                pageSize={pagination.limit}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} mục`}
                            />
                        </div>
                    )}
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
                    allIngredientCategories={ingredientCategories || []}
                    allMeasureUnits={Array.isArray(measurementUnits) ? measurementUnits : []}
                    isEdit={false}
                />

            </Modal>

            {/* Modal chi tiết nguyên liệu */}
            <IngredientDetailModal
                isVisible={isIngredientDetailModalVisible}
                onClose={handleIngredientDetailClose}
                ingredient={selectedIngredient}
                onEdit={handleEdit}
                onDelete={handleDelete}
                allIngredientCategories={ingredientCategories || []}
                allMeasureUnits={Array.isArray(measurementUnits) ? measurementUnits : []}
            />
        </div>
    );
};

export default Ingredients1;
