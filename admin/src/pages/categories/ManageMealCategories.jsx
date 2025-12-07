import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import { Modal, Form, Pagination, Empty } from 'antd';
import Loading from '../../components/Loading/Loading';
import MealCategoryForm from '../../components/Categories/MealCategoryForm';
import {
    fetchMealCategories,
    addMealCategory,
    updateMealCategory,
    deleteMealCategory
} from '../../redux/thunks/mealCategoryThunk'

const ManageMealCategories = () => {
    const dispatch = useDispatch();
    const mealCategoryState = useSelector(state => state.mealCategories);

    const { mealCategories = [], loading, pagination = { page: 1, limit: 30 } } = mealCategoryState || {};

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [form] = Form.useForm();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchMealCategories({ page: 1, limit: 30 }));
    }, [dispatch]);

    // Lọc danh sách meal categories theo từ khóa tìm kiếm
    const filteredMealCategories = (mealCategories || []).filter(item =>
        (item.title || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.keyword || '').toLowerCase().includes(searchKeyword.toLowerCase())
    );

    // Sắp xếp danh sách meal categories
    const sortedMealCategories = [...filteredMealCategories].sort((a, b) => {
        if (sortOrder === 'name_asc') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (sortOrder === 'name_desc') {
            return (b.title || '').localeCompare(a.title || '');
        }
        return 0;
    });

    const showModalAddMealCategory = () => {
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
            dispatch(updateMealCategory({
                id: selectedCategory._id,
                mealCategoryData: values
            }))
        } else {
            dispatch(addMealCategory(values));
        }
        handleCancel();
    };

    const handleDelete = (id) => {
        dispatch(deleteMealCategory(id));
        handleCancel();
    };

    // Khi bấm vào card
    const handleCardClick = (mealCategory) => {
        setSelectedCategory(mealCategory);
        form.setFieldsValue(mealCategory);
        setIsModalVisible(true);
    };

    // Xử lý tìm kiếm
    const handleSearch = () => {
        // Thực hiện tìm kiếm client-side vì đã tải tất cả dữ liệu
    };

    // Xử lý phân trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
        dispatch(fetchMealCategories({ page, limit: pagination.limit }));
    };

    return (
        <div className="mealCategories-container">
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
                    <div className="page-header">
                        <h1>Quản lý danh mục món ăn</h1>
                        <div className="action-buttons">
                            <button className="import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="add-button" onClick={showModalAddMealCategory}>
                                + Thêm danh mục món ăn
                            </button>
                        </div>
                    </div>

                    <div className="container-filter">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Tìm kiếm danh mục món ăn..."
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

                    {/* Danh sách danh mục món ăn */}
                    <div className="mealCategories-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải danh mục món ăn..." />
                        ) : sortedMealCategories.length > 0 ? (
                            <div className="mealCategories-grid">
                                {sortedMealCategories.map(mealCategory => (
                                    <div
                                        key={mealCategory._id}
                                        className="mealCategory-card"
                                        onClick={() => handleCardClick(mealCategory)}
                                    >
                                        <div className="mealCategory-keyword">
                                            <span className="category-badge">{mealCategory.keyword}</span>
                                        </div>
                                        <div className="mealCategory-content">
                                            <h3>{mealCategory.title}</h3>
                                            <p className="description">{mealCategory.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Empty description="Không có danh mục món ăn nào" />
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
                                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} danh mục món ăn`}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            <Modal
                title={
                    <span style={{ fontWeight: 700, fontSize: '18px' }}>
                        {selectedCategory ? "Chỉnh sửa danh mục món ăn" : "Thêm danh mục món ăn mới"}
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
                <MealCategoryForm
                    form={form}
                    onFinish={handleSubmit}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    mealCategory={selectedCategory}
                    isEdit={!!selectedCategory}
                />
            </Modal>
        </div>
    );
};

export default ManageMealCategories;