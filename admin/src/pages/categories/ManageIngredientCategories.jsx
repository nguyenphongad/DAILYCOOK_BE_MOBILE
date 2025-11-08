import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import { Empty, Form, Modal, Pagination } from 'antd';
import Loading from '../../components/Loading/Loading';
import IngredientCategoryForm from '../../components/Categories/IngredientCategoryForm';
import { deleteIngredientCategory, addIngredientCategory, fetchIngredientCategories, updateIngredientCategory } from '../../redux/thunks/ingredientCategoryThunk';

const ManageIngredientCategories = () => {

    const dispatch = useDispatch();
    const ingredientCategoryState = useSelector(state => state.ingredientCategory);

    const { ingredientCategories = [], loading, pagination = { page: 1, limit: 9 } } = ingredientCategoryState || {};
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [form] = Form.useForm();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchIngredientCategories({ page: 1, limit: 9 }));
    }, [dispatch]);

    // Lọc danh sách diet types theo từ khóa tìm kiếm
    const filtereIngredientCategories = (ingredientCategories || []).filter(item =>
        (item.title || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.keyword || '').toLowerCase().includes(searchKeyword.toLowerCase())
    );

    // Sắp xếp danh sách diet types
    const sortIngredientCategories = [...filtereIngredientCategories].sort((a, b) => {
        if (sortOrder === 'name_asc') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (sortOrder === 'name_desc') {
            return (b.title || '').localeCompare(a.title || '');
        }
        return 0;
    });

    const showModalAddIngredientCategory = () => {
        setSelectedCategory(null); // thêm mới thì không có category
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedCategory(null);
        setIsModalVisible(false);
    };

    const handleSubmit = (values) => {
        // update
        if (selectedCategory) {
            dispatch(updateIngredientCategory({
                id: selectedCategory._id,
                ingredientCategoryData: values
            }))
        } else {
            // Add
            dispatch(addIngredientCategory(values));
        }
        handleCancel();
    };

    const handleDelete = (id) => {
        dispatch(deleteIngredientCategory(id));
        handleCancel();
    };

    // Khi bấm vào card
    const handleCardClick = (ingredientCategory) => {
        setSelectedCategory(ingredientCategory);
        form.setFieldsValue(ingredientCategory);
        setIsModalVisible(true);
    };

    // Xử lý tìm kiếm
    const handleSearch = () => {
        // Thực hiện tìm kiếm client-side vì đã tải tất cả dữ liệu
    };

    // Xử lý phân trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
        dispatch(fetchIngredientCategories({ page, limit: pagination.limit }));
    };

    return (
        <div className="ingredientCategories-container">
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
                    <div className="page-header">
                        <h1>Quản lý danh mục thực phẩm</h1>
                        <div className="action-buttons">
                            <button className="import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="add-button" onClick={showModalAddIngredientCategory}>
                                + Thêm danh mục thực phẩm
                            </button>
                        </div>
                    </div>

                    <div className="container-filter">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Tìm kiếm danh mục thực phẩm..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                prefix={<SearchOutlined />}
                                onPressEnter={handleSearch}
                            />
                            <button onClick={handleSearch}>Tìm</button>
                        </div>
                        <div className="filters">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="">Sắp xếp theo</option>
                                <option value="name_asc">Tên (A-Z)</option>
                                <option value="name_desc">Tên (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Danh sách */}
                    <div className="ingredientCategories-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải danh mục thực phâm..." />
                        ) : sortIngredientCategories.length > 0 ? (
                            <div className="ingredientCategories-grid">
                                {sortIngredientCategories.map(ingredientCategory => (
                                    <div
                                        key={ingredientCategory._id}
                                        className="ingredientCategory-card"
                                        onClick={() => handleCardClick(ingredientCategory)} // << click card để edit
                                    >
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
                        ) : (
                            <div className="empty-state">
                                <Empty description="Không có danh mục thực phâm nào" />
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

            {/* Modal Form */}
            <Modal
                title={
                    <span style={{ fontWeight: 700, fontSize: '18px' }}>
                        {selectedCategory ? "Chỉnh sửa danh mục thực phẩm" : "Thêm danh mục thực phẩm mới"}
                    </span>
                }
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
                    onDelete={handleDelete}
                    ingredientCategory={selectedCategory}
                    isEdit={!!selectedCategory}
                />
            </Modal>
        </div>
    );
};

export default ManageIngredientCategories;
