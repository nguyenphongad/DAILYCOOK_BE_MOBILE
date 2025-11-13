import { useState, useEffect } from 'react';
import { Modal, Form, Pagination, Empty } from 'antd';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import Loading from '../../components/Loading/Loading';
import IngredientForm from '../../components/IngredientForm/IngredientForm';
import IngredientDetailModal from '../../components/IngredientDetailModal/IngredientDetailModal';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIngredientCategories } from '../../redux/thunks/ingredientCategoryThunk';
import { fetchMeasurementUnits } from '../../redux/thunks/measurementUnitsThunk';
import {
    addIngredient,
    updateIngredient,
    deleteIngredient,
    fetchIngredients,
} from '../../redux/thunks/ingredientThunk';
import { toast } from 'sonner';

const Ingredients1 = () => {
    const dispatch = useDispatch();

    // ==================== STATE ====================
    const ingredientState = useSelector((state) => state.ingredients);
    const ingredientCategoryState = useSelector((state) => state.ingredientCategory);
    const measurementUnitsState = useSelector((state) => state.measurementUnits);

    const { ingredients = [], loading, pagination = { page: 1, limit: 9, total: 0 } } = ingredientState || {};
    const { ingredientCategories = [] } = ingredientCategoryState || {};
    const { measurementUnits = [] } = measurementUnitsState || {};

    // ====================LOCAL STATE ====================
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal thêm nguyên liệu
    const [isIngredientDetailModalVisible, setIsIngredientDetailModalVisible] = useState(false); // Modal chi tiết
    const [selectedIngredient, setSelectedIngredient] = useState(null); // Nguyên liệu đang chọn
    const [form] = Form.useForm();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(''); // Filter theo danh mục
    const [currentPage, setCurrentPage] = useState(1);

    // --- Fetch dữ liệu khi mount ---
    useEffect(() => {
        dispatch(fetchIngredients({ page: 1, limit: 9 }));
        dispatch(fetchIngredientCategories({ page: 1, limit: 50 }));
        dispatch(fetchMeasurementUnits());
    }, [dispatch]);

    // --- Filter + Sort ---
    const filteredIngredients = (ingredients || []).filter((item) => {
        const matchesSearch = (item.nameIngredient || '').toLowerCase().includes(searchKeyword.toLowerCase());
        const matchesCategory = !selectedCategory || item.ingredientCategory === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedIngredients = [...filteredIngredients].sort((a, b) => {
        if (sortOrder === 'name_asc') {
            return (a.nameIngredient || '').localeCompare(b.nameIngredient || '');
        } else if (sortOrder === 'name_desc') {
            return (b.nameIngredient || '').localeCompare(a.nameIngredient || '');
        }
        return 0;
    });

    // --- Helper functions ---
    const getCategoryTitle = (categoryId) => {
        const found = ingredientCategories.find(cat => cat._id === categoryId);
        return found ? found.title || found.nameCategory : 'Chưa phân loại';
    };

    const getMeasureUnitLabel = (unitKey) => {
        const found = measurementUnits.find(unit => unit.key === unitKey);
        return found ? found.label : unitKey;
    };

    // --- Modal handlers ---
    const showModalAddIngredient = () => {
        setSelectedIngredient(null); // Reset khi thêm mới
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedIngredient(null);
        setIsModalVisible(false);
        // Force re-render form component để reset state
        setTimeout(() => {
            setIsModalVisible(false);
        }, 0);
    };

    const showIngredientDetail = (ingredient) => {
        setSelectedIngredient(ingredient);
        setIsIngredientDetailModalVisible(true);
    };

    const handleIngredientDetailClose = () => {
        setIsIngredientDetailModalVisible(false);
    };
    
    // ==================== HÀM XỬ LÝ ====================
    // Thêm nguyên liệu mới
    const handleSubmit = async (values) => {
        try {
            await dispatch(addIngredient(values)).unwrap();
            // Đóng modal sau khi thành công
            setIsModalVisible(false);
            form.resetFields();
            setSelectedIngredient(null);
        } catch (error) {
            console.error(error);
            toast.error(error?.message || 'Thao tác thất bại, vui lòng thử lại!');
        }
    };

    // Cập nhật nguyên liệu từ modal chi tiết
    const handleEditFromDetail = async (updatedIngredientData) => {
        if (!selectedIngredient) return;

        try {
            await dispatch(updateIngredient({
                id: selectedIngredient._id,
                ingredientData: updatedIngredientData,
            })).unwrap();

            // Cập nhật local state để modal hiển thị thông tin mới
            setSelectedIngredient(prev => ({
                ...prev,
                ...updatedIngredientData
            }));
        } catch (error) {
            console.error(error);
        }
    };

    // Xóa nguyên liệu
    const handleDelete = async (id) => {
        try {
            await dispatch(deleteIngredient(id)).unwrap();
            setIsIngredientDetailModalVisible(false);
        } catch (error) {
            console.error(error);
        }
    };

    // Phân trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
        dispatch(fetchIngredients({ page, limit: pagination.limit }));
    };

    // --- RENDER ---
    return (
        <div className="ingredients-container">
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

                    {/* Filter + Search */}
                    <div className="container-filter">
                        <div className="search-bar">
                            <input
                                placeholder="Tìm kiếm nguyên liệu..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <button>
                                <SearchOutlined /> Tìm
                            </button>
                        </div>
                        <div className="filters">
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{ marginRight: 12 }}
                            >
                                <option value="">Tất cả danh mục</option>
                                {ingredientCategories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.title}
                                    </option>
                                ))}
                            </select>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="">Sắp xếp theo</option>
                                <option value="name_asc">Tên (A-Z)</option>
                                <option value="name_desc">Tên (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Danh sách nguyên liệu */}
                    <div className="ingredients-list-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải danh sách nguyên liệu..." />
                        ) : sortedIngredients.length > 0 ? (
                            <div className="ingredients-list">
                                {/* Header */}
                                <div className="ingredients-list-header">
                                    <div className="header-image">Ảnh</div>
                                    <div className="header-name">Tên nguyên liệu</div>
                                    <div className="header-category">Danh mục</div>
                                    <div className="header-amount">Số lượng mặc định</div>
                                    <div className="header-description">Mô tả</div>
                                    <div className="header-uses">Công dụng</div>
                                </div>

                                {/* Danh sách items */}
                                {sortedIngredients.map((ingredient) => (
                                    <div
                                        key={ingredient._id}
                                        className="ingredient-row"
                                        onClick={() => showIngredientDetail(ingredient)}
                                    >
                                        <div className="row-image">
                                            <img src={ingredient.ingredientImage} alt={ingredient.nameIngredient} />
                                        </div>
                                        <div className="row-name">
                                            <h3>{ingredient.nameIngredient}</h3>
                                        </div>
                                        <div className="row-category">
                                            <span className="category-badge">
                                                {getCategoryTitle(ingredient.ingredientCategory)}
                                            </span>
                                        </div>
                                        <div className="row-amount">
                                            {ingredient.defaultAmount} {getMeasureUnitLabel(ingredient.defaultUnit)}
                                        </div>
                                        <div className="row-description">
                                            <p>{ingredient.description}</p>
                                        </div>
                                        <div className="row-uses">
                                            {Array.isArray(ingredient.commonUses) && ingredient.commonUses.length > 0 ? (
                                                <div className="uses-container">
                                                    {ingredient.commonUses.slice(0, 2).map((use, index) => (
                                                        <span key={index} className="use-tag">
                                                            {use}
                                                        </span>
                                                    ))}
                                                    {ingredient.commonUses.length > 2 && (
                                                        <span className="use-more">+{ingredient.commonUses.length - 2}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="no-uses">Không có công dụng</span>
                                            )}
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
                destroyOnClose={true}
            >
                <IngredientForm
                    key={isModalVisible ? 'open' : 'closed'}
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
                onEdit={handleEditFromDetail} // chỉ update
                onDelete={handleDelete}
                allIngredientCategories={ingredientCategories || []}
                allMeasureUnits={Array.isArray(measurementUnits) ? measurementUnits : []}
            />
        </div>
    );
};

export default Ingredients1;
