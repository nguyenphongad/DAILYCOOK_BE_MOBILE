import { useState, useEffect } from 'react';
import { Modal, Form, Pagination, Empty } from 'antd';
import { ImportOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

import ImportFileModal from '../../components/ImportFileModal/ImportFileModal';
import DishDetailModal from '../../components/DishDetailModal/DishDetailModal';
import DishForm from '../../components/DishForm/DishForm';
import Loading from '../../components/Loading/Loading';

import { fetchMeals, addMeal, updateMeal, deleteMeal } from '../../redux/thunks/mealThunk';
import { fetchMealCategories } from '../../redux/thunks/mealCategoryThunk';
import { fetchIngredients } from '../../redux/thunks/ingredientThunk';

const Dishes = () => {
  const dispatch = useDispatch();

  // --- Redux state ---
  const mealState = useSelector((state) => state.meals);
  const ingredientsState = useSelector((state) => state.ingredients);
  const mealCategoriesState = useSelector((state) => state.mealCategories);
  
  const { meals = [], loading, pagination = { page: 1, limit: 9, total: 0 } } = mealState || {};
  const { ingredients = [] } = ingredientsState || {};
  
  // Lấy mealCategories một cách an toàn
  const mealCategories = mealCategoriesState?.mealCategories || []; // Thêm null check và default value
  
  // Log debug
  console.log('mealCategoriesState:', mealCategoriesState);
  console.log('mealCategories array:', mealCategories);

  // --- Local state ---
  const [isMealFormModalOpen, setIsMealFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [form] = Form.useForm();

  // --- Filter + Pagination ---
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPopularity, setSelectedPopularity] = useState(''); // Thêm filter theo popularity
  const [currentPage, setCurrentPage] = useState(1);

  // --- Fetch dữ liệu ---
  useEffect(() => {
    dispatch(fetchMeals({ page: currentPage, limit: 9 }));
    dispatch(fetchIngredients({ page: 1, limit: 50 }));
    dispatch(fetchMealCategories({ page: 1, limit: 100 })); // Thêm params
  }, [dispatch, currentPage]);

  // --- Tìm kiếm + Sắp xếp ---
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch = (meal.nameMeal || '').toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = !selectedCategory || meal.mealCategory === selectedCategory;
    const matchesPopularity = !selectedPopularity || meal.popularity === parseInt(selectedPopularity);
    return matchesSearch && matchesCategory && matchesPopularity;
  });

  const sortedMeals = [...filteredMeals].sort((a, b) => {
    if (sortOrder === 'name_asc') return a.nameMeal.localeCompare(b.nameMeal);
    if (sortOrder === 'name_desc') return b.nameMeal.localeCompare(a.nameMeal);
    if (sortOrder === 'popularity_desc') return (b.popularity || 0) - (a.popularity || 0);
    if (sortOrder === 'popularity_asc') return (a.popularity || 0) - (b.popularity || 0);
    return 0;
  });

  // --- Helper functions ---
  const getCategoryTitle = (categoryId) => {
    if (!Array.isArray(mealCategories)) {
      return 'Chưa phân loại';
    }
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
    
    try {
      let resultAction;
      
      if (selectedMeal?._id) {
        // Cập nhật món ăn - CHỈ DISPATCH updateMeal ở đây
        resultAction = await dispatch(updateMeal({
          id: selectedMeal._id,
          mealData: values
        }));
      } else {
        // Thêm món ăn mới - CHỈ DISPATCH addMeal ở đây
        resultAction = await dispatch(addMeal(values));
      }
      
      if (addMeal.fulfilled.match(resultAction) || updateMeal.fulfilled.match(resultAction)) {
        // Thành công - đóng modal và refresh data
        closeMealFormModal();
        // Refresh danh sách món ăn
        dispatch(fetchMeals({ page: currentPage, limit: 9 }));
      }
      
    } catch (error) {
      console.error('Error submitting meal form:', error);
    }
  };

  // --- Chỉnh sửa trong modal chi tiết ---
  const handleEditMeal = (updatedMeal) => {
    // Callback này sẽ được gọi sau khi cập nhật thành công từ DishDetailModal
    // Refresh danh sách để có dữ liệu mới nhất
    dispatch(fetchMeals({ page: currentPage, limit: 9 }));
  };

  // --- Xóa món ăn ---
  const handleDeleteMeal = (id) => {
    // Callback này sẽ được gọi sau khi xóa thành công từ DishDetailModal
    // Refresh danh sách để có dữ liệu mới nhất
    dispatch(fetchMeals({ page: currentPage, limit: 9 }));
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
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ marginRight: 12 }}
              >
                <option value="">Tất cả danh mục</option>
                {Array.isArray(mealCategories) && mealCategories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.title || category.nameCategory}
                  </option>
                ))}
              </select>
              <select 
                value={selectedPopularity} 
                onChange={(e) => setSelectedPopularity(e.target.value)}
                style={{ marginRight: 12 }}
              >
                <option value="">Tất cả độ phổ biến</option>
                <option value="5">⭐⭐⭐⭐⭐ Cực kỳ phổ biến</option>
                <option value="4">⭐⭐⭐⭐ Rất phổ biến</option>
                <option value="3">⭐⭐⭐ Phổ biến</option>
                <option value="2">⭐⭐ Khá phổ biến</option>
                <option value="1">⭐ Ít phổ biến</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="">Sắp xếp theo</option>
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
                <option value="popularity_desc">Độ phổ biến (Cao → Thấp)</option>
                <option value="popularity_asc">Độ phổ biến (Thấp → Cao)</option>
              </select>
            </div>
          </div>

          {/* Grid hiển thị món ăn - THAY THẾ phần này bằng bảng */}
          <div className="dishes-table-container">
            {sortedMeals.length > 0 ? (
              <div className="dishes-table">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>STT</th>
                      <th style={{ width: '80px' }}>Ảnh</th>
                      <th style={{ width: '30%' }}>Tên món</th>
                      <th style={{ width: '20%' }}>Danh mục</th>
                      <th style={{ width: '15%' }}>Độ phổ biến</th>
                      <th style={{ width: '100px' }}>Số thành phần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMeals.map((meal, index) => {
                      return (
                        <tr 
                          key={meal._id || meal.id} 
                          className="dish-row" 
                          onClick={() => showMealDetail(meal)}
                        >
                          <td className="text-left">{index + 1 + (pagination.page - 1) * pagination.limit}</td>
                          <td className="dish-image-cell text-left">
                            <img 
                              src={meal.mealImage || 'https://via.placeholder.com/50'} 
                              alt={meal.nameMeal} 
                              className="dish-thumbnail"
                            />
                          </td>
                          <td>
                            <div className="dish-name">{meal.nameMeal}</div>
                            {meal.description && (
                              <div className="dish-description">{meal.description.slice(0, 60)}...</div>
                            )}
                          </td>
                          <td>
                            <span className="category-badge">
                              {meal.mealCategory ? getCategoryTitle(meal.mealCategory) : 'Chưa phân loại'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                                ({meal.popularity || 1}/5⭐)
                              </span>
                            </div>
                          </td>
                          <td className="text-left">
                            {meal.ingredients?.length || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
          mealCategories={mealCategories} // Thêm prop này
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
        meal={selectedMeal}
        onEdit={handleEditMeal}
        onDelete={handleDeleteMeal}
        allIngredients={ingredients}
        mealCategories={mealCategories}
      />
    </div>
  );
};

export default Dishes;