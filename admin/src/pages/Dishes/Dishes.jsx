import { useState, useEffect } from 'react';
import { Modal, Form, Pagination, Empty } from 'antd';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

import ImportFileModal from '../../components/ImportFileModal/ImportFileModal';
import DishDetailModal from '../../components/DishDetailModal/DishDetailModal';
import DishForm from '../../components/DishForm/DishForm';
import Loading from '../../components/Loading/Loading';

import { fetchMeals } from '../../redux/thunks/mealThunk';
import { fetchMealCategories } from '../../redux/thunks/mealCategoryThunk';
import { fetchIngredients } from '../../redux/thunks/ingredientThunk';

const Dishes = () => {
  const dispatch = useDispatch();

  // --- Redux state ---
  const mealState = useSelector((state) => state.meals);
  const ingredientsState = useSelector((state) => state.ingredients);
  const mealCategoryState = useSelector((state) => state.mealCategory);

  const { meals = [], loading, pagination = { page: 1, limit: 9, total: 0 } } = mealState || {};
  const { ingredients = [] } = ingredientsState || {};
  const { mealCategories } = mealCategoryState || {};

  // --- Local state ---
  const [isMealFormModalOpen, setIsMealFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [form] = Form.useForm();

  // --- Filter + Pagination ---
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Fetch dữ liệu ---
  useEffect(() => {
    dispatch(fetchMeals({ page: currentPage, limit: 9 }));
    dispatch(fetchIngredients({ page: 1, limit: 50 }));
    dispatch(fetchMealCategories());
  }, [dispatch, currentPage]);

  // --- Tìm kiếm + Sắp xếp ---
  const filteredMeals = meals.filter((meal) =>
    (meal.nameMeal || '').toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const sortedMeals = [...filteredMeals].sort((a, b) => {
    if (sortOrder === 'name_asc') return a.nameMeal.localeCompare(b.nameMeal);
    if (sortOrder === 'name_desc') return b.nameMeal.localeCompare(a.nameMeal);
    return 0;
  });

  // --- Helper functions ---
  const getCategoryTitle = (categoryId) => {
    const found = mealCategories.find(cat => cat._id === categoryId);
    return found ? found.title || found.nameCategory : 'Chưa phân loại';
  };

  // --- Mở modal thêm món ăn ---
  const openMealFormModal = () => {
    form.resetFields();
    setSelectedMeal(null);
    setIsMealFormModalOpen(true);
  };

  const closeMealFormModal = () => {
    form.resetFields();
    setIsMealFormModalOpen(false);
  };

  // --- Mở modal import ---
  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => setIsImportModalOpen(false);

  // --- Import file ---
  const handleImport = (importedData) => {
    console.log('Imported data:', importedData);
    toast.success('Import thành công!');
  };

  // --- Modal chi tiết món ăn ---
  const showMealDetail = (meal) => {
    setSelectedMeal(meal);
    setIsDetailModalOpen(true);
  };

  const closeMealDetail = () => {
    setSelectedMeal(null);
    setIsDetailModalOpen(false);
  };

  // --- Submit form thêm/sửa món ăn ---
  const handleSubmit = async (values) => {
    console.log('Meal form values:', values);
    // TODO: Gọi dispatch(addMeal) hoặc updateMeal tại đây
  };

  // --- Chỉnh sửa trong modal chi tiết ---
  const handleEditMeal = (updatedMeal) => {
    setSelectedMeal((prev) => ({ ...prev, ...updatedMeal }));
    toast.success('Cập nhật món ăn thành công!');
  };

  // --- Xóa món ăn ---
  const handleDeleteMeal = (id) => {
    toast.info(`Xóa món có ID: ${id}`);
  };

  // --- Đổi trang ---
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // --- JSX ---
  return (
    <div className="dishes-container">
      <Loading visible={loading} text="Đang tải dữ liệu..." />

      <div className="content-area">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <h1>Quản lý món ăn</h1>
            <div className="action-buttons">
              <button className="import-button" onClick={openImportModal}>
                <ImportOutlined /> Import File
              </button>
              <button className="add-button" onClick={openMealFormModal}>
                + Thêm món ăn
              </button>
            </div>
          </div>

          {/* Filter + Search */}
          <div className="container-filter">
            <div className="search-bar">
              <input
                placeholder="Tìm kiếm món ăn..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button>
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

          {/* Grid hiển thị món ăn */}
          <div className="dishes-grid-container">
            {sortedMeals.length > 0 ? (
              <div className="dishes-grid">
                {sortedMeals.map((meal) => (
                  <div key={meal.id} className="dish-card" onClick={() => showDishDetail(meal)}>
                    <div className="dish-image">
                      <img src={meal.mealImage} alt={meal.nameMeal} />
                      <span className="category-badge">
                        {getCategoryTitle(meal.mealCategory)}
                      </span>
                    </div>
                    <div className="dish-content">
                      <h3>{meal.nameMeal}</h3>
                      <p className="description">{meal.description}</p>
                      <div className="dish-info">
                        <span className="ingredients-count">{meal.ingredients.length} thành phần</span>
                        <span className="cooking-time">{meal.cookTimeMinutes} phút</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Empty description="Không có món ăn nào" />
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
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} món`
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm / Sửa món ăn */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: '18px' }}>
            {selectedMeal ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
          </span>
        }
        open={isMealFormModalOpen}
        onCancel={closeMealFormModal}
        width={1600}
        style={{ top: 10, maxWidth: '90%', margin: '0 auto' }}
        footer={null}
      >
        <DishForm
          form={form}
          onFinish={handleSubmit}
          onCancel={closeMealFormModal}
          allIngredients={ingredients}
          isEdit={!!selectedMeal}
          initialValues={selectedMeal}
        />
      </Modal>

      {/* Modal Import File */}
      <ImportFileModal
        isVisible={isImportModalOpen}
        onCancel={closeImportModal}
        onImport={handleImport}
      />

      {/* Modal Chi tiết món ăn */}
      <DishDetailModal
        isVisible={isDetailModalOpen}
        onClose={closeMealDetail}
        dish={selectedMeal}
        onEdit={handleEditMeal}
        onDelete={handleDeleteMeal}
        allIngredients={ingredients}
      />
    </div>
  );
};

export default Dishes;
