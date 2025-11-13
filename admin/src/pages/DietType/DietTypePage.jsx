import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import { Modal, Form, Empty, Spin, Pagination } from 'antd';
import Loading from '../../components/Loading/Loading';
import DietTypeForm from '../../components/DietTypeForm/DietTypeForm';
import DietTypeDetailModal from '../../components/DietTypeDetailModal/DietTypeDetailModal';
import {
    fetchDietTypes,
    addDietType,
    updateDietType,
    deleteDietType
} from '../../redux/thunks/dietTypeThunk';

const DietTypePage = () => {
    const dispatch = useDispatch();
    const dietTypeState = useSelector(state => state.dietType);

    const { dietTypes = [], loading, pagination = { page: 1, limit: 9 } } = dietTypeState || {};

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDietTypeDetailModalVisible, setIsDietTypeDetailModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [form] = Form.useForm();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Tải dữ liệu khi component được mount
    useEffect(() => {
        dispatch(fetchDietTypes({ page: 1, limit: 9 }));
    }, [dispatch]);

    // Lọc danh sách diet types theo từ khóa tìm kiếm
    const filteredDietTypes = (dietTypes || []).filter(item =>
        (item.title || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.keyword || '').toLowerCase().includes(searchKeyword.toLowerCase())
    );

    // Sắp xếp danh sách diet types
    const sortedDietTypes = [...filteredDietTypes].sort((a, b) => {
        if (sortOrder === 'name_asc') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (sortOrder === 'name_desc') {
            return (b.title || '').localeCompare(a.title || '');
        }
        return 0;
    });

    // Hiển thị modal thêm mới
    const showModalAddDietType = () => {
        setSelectedCategory(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    // Đóng modal thêm mới
    const handleCancel = () => {
        form.resetFields();
        setSelectedCategory(null);
        setIsModalVisible(false);
    };

    // Xử lý submit form thêm mới
    const handleSubmit = (values) => {
        if (selectedCategory) {
            // Update existing diet type
            dispatch(updateDietType({
                id: selectedCategory._id,
                dietTypeData: values
            }));
        } else {
            // Add new diet type
            dispatch(addDietType(values));
        }
        handleCancel();
    };

    // Xử lý xóa chế độ ăn
    const handleDelete = (id) => {
        dispatch(deleteDietType(id));
        handleCancel();
    };

    // Hiển thị modal chi tiết
    const showDietTypeDetail = (item) => {
        setSelectedCategory(item);
        setIsDietTypeDetailModalVisible(true);
    };

    // Đóng modal chi tiết
    const handleDietTypeDetailClose = () => {
        setIsDietTypeDetailModalVisible(false);
        setSelectedCategory(null);
    };

    // Xử lý chỉnh sửa từ modal chi tiết
    const handleEdit = (updatedDietType) => {
        dispatch(updateDietType({
            id: updatedDietType._id,
            dietTypeData: updatedDietType
        }));
    };

    // Xử lý tìm kiếm
    const handleSearch = () => {
        // Thực hiện tìm kiếm client-side vì đã tải tất cả dữ liệu
    };

    // Xử lý phân trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
        dispatch(fetchDietTypes({ page, limit: pagination.limit }));
    };

    return (
        <div className="diet-type-page">
            {/* Loading overlay */}
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="diet-type-content-area">
                <div className="diet-type-content">
                    {/* Header */}
                    <div className="diet-type-header">
                        <h1>Quản lý chế độ ăn</h1>
                        <div className="diet-type-action-buttons">
                            <button className="diet-type-import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="diet-type-add-button" onClick={showModalAddDietType}>
                                + Thêm chế độ ăn
                            </button>
                        </div>
                    </div>

                    {/* Bộ lọc tìm kiếm */}
                    <div className="diet-type-filter-container">
                        <div className="diet-type-search-bar">
                            <input 
                                placeholder="Tìm kiếm chế độ ăn..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <button onClick={handleSearch}>
                                <SearchOutlined /> Tìm
                            </button>
                        </div>
                        <div className="diet-type-filters">
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

                    {/* Danh sách chế độ ăn */}
                    <div className="diet-type-grid-container">
                        {loading ? (
                            <div className="diet-type-loading">
                                <Spin size="large" />
                            </div>
                        ) : sortedDietTypes.length > 0 ? (
                            <div className="diet-type-grid">
                                {sortedDietTypes.map(item => (
                                    <div
                                        key={item._id}
                                        className="diet-type-card"
                                        onClick={() => showDietTypeDetail(item)}
                                    >
                                        <div className="diet-type-image">
                                            <img
                                                src={item.dietTypeImage || 'https://media.istockphoto.com/id/1433432507/vi/anh/%C4%83n-u%E1%BB%91ng-l%C3%A0nh-m%E1%BA%A1nh-%C4%91%C4%A9a-v%E1%BB%9Bi-th%E1%BB%B1c-ph%E1%BA%A9m-thu%E1%BA%A7n-chay-ho%E1%BA%B7c-chay-trong-tay-ph%E1%BB%A5-n%E1%BB%AF-ch%E1%BA%BF-%C4%91%E1%BB%99-%C4%83n-u%E1%BB%91ng-d%E1%BB%B1a.jpg?s=612x612&w=0&k=20&c=Z0BVb_z-mLjup_3f4Kvto5q0A0z8CqBjsHS7DSMaQ1k='}
                                                alt={item.title}
                                            />
                                            <span className="diet-type-badge">
                                                {item.keyword}
                                            </span>
                                        </div>
                                        <div className="diet-type-content-card">
                                            <h3>{item.title}</h3>
                                            <p className="diet-type-description">{item.description || 'Không có mô tả'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="diet-type-empty-state">
                                <Empty description="Không có chế độ ăn nào" />
                            </div>
                        )}
                    </div>

                    {/* Phân trang */}
                    {pagination.total > 0 && (
                        <div className="diet-type-pagination">
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

            {/* Modal thêm chế độ ăn mới */}
            <Modal
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>
                    Thêm chế độ ăn mới
                </span>}
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
                    initialValues={null}
                />
            </Modal>

            {/* Modal chi tiết chế độ ăn */}
            <DietTypeDetailModal
                isVisible={isDietTypeDetailModalVisible}
                onClose={handleDietTypeDetailClose}
                dietType={selectedCategory}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default DietTypePage;