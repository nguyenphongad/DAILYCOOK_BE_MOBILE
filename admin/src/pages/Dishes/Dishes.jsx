import { useState, useEffect } from 'react'
import { Modal, Form } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import sampleData from '../../assets/data_sample_meal.json'
import ImportFileModal from '../../components/ImportFileModal/ImportFileModal'
import DishDetailModal from '../../components/DishDetailModal/DishDetailModal'
import DishForm from '../../components/DishForm/DishForm'
import Loading from '../../components/Loading/Loading'

const Dishes = () => {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [allIngredients, setAllIngredients] = useState([])
  
  // State cho modal chi tiết món ăn
  const [isDishDetailModalVisible, setIsDishDetailModalVisible] = useState(false)
  const [selectedDish, setSelectedDish] = useState(null)
  
  useEffect(() => {
    // Giả lập việc lấy danh sách món ăn
    const fetchDishes = () => {
      setLoading(true)
      
      // Giả lập API call bằng cách sử dụng dữ liệu từ JSON
      setTimeout(() => {
        setDishes(sampleData.dishes)
        setAllIngredients(sampleData.ingredients)
        setLoading(false)
      }, 1000)
    }
    
    fetchDishes()
  }, [])
  
  const showModal = () => {
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
  }

  const handleSubmit = (values) => {
    console.log('Form submitted:', values)
    // Thêm món ăn mới vào danh sách
    const newDish = {
      id: Date.now(),
      name: values.nameRecipe,
      description: values.description,
      ingredients_count: values.ingredients.length,
      cooking_time: `${values.cookTimeMinutes} phút`,
      category: "Món chính", // Giả sử category
      image: values.image || "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg"
    };
    
    setDishes(prev => [...prev, newDish]);
    handleCancel();
  }

  const showImportModal = () => {
    setIsImportModalVisible(true);
  };

  const handleImportCancel = () => {
    setIsImportModalVisible(false);
  };

  const handleImport = (importedData) => {
    // Xử lý dữ liệu import ở đây
    console.log('Imported data:', importedData);
    
    // Ở đây bạn có thể xử lý dữ liệu để thêm vào danh sách món ăn
    // Ví dụ:
    // const newDishes = importedData.map(item => ({
    //   id: Date.now() + Math.random(),
    //   name: item.name || item.nameRecipe || 'Món ăn không tên',
    //   description: item.description || '',
    //   ingredients_count: parseInt(item.ingredients_count) || 0,
    //   cooking_time: item.cooking_time || '0 phút',
    //   category: item.category || 'Khác',
    //   image: item.image || 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?cs=srgb&dl=pexels-jang-699953.jpg&fm=jpg',
    // }));
    // setDishes(prev => [...prev, ...newDishes]);
  };
  
  // Xử lý hiển thị modal chi tiết món ăn
  const showDishDetail = (dish) => {
    setSelectedDish(dish);
    setIsDishDetailModalVisible(true);
  };
  
  const handleDishDetailClose = () => {
    setIsDishDetailModalVisible(false);
    setSelectedDish(null);
  };
  
  // Xử lý chỉnh sửa món ăn
  const handleEditDish = (editedDish) => {
    setDishes(prev => prev.map(dish => 
      dish.id === editedDish.id ? { ...dish, ...editedDish } : dish
    ));
  };
  
  // Xử lý xóa món ăn
  const handleDeleteDish = (id) => {
    setDishes(prev => prev.filter(dish => dish.id !== id));
  };
  
  return (
    <div className="dishes-container">
      {/* Sử dụng Loading component */}
      <Loading visible={loading} text="Đang tải dữ liệu..." />
      
      <div className="content-area">
        <div className="content">
          <div className="page-header">
            <h1>Quản lý món ăn</h1>
            <div className="action-buttons">
              <button className="import-button" onClick={showImportModal}>
                <ImportOutlined /> Import File
              </button>
              <button className="add-button" onClick={showModal}>+ Thêm món ăn</button>
            </div>
          </div>
          
          <div className="dishes-filter">
            <div className="search-bar">
              <input type="text" placeholder="Tìm kiếm món ăn..." />
              <button>Tìm</button>
            </div>
            <div className="filters">
              <select>
                <option value="">Tất cả danh mục</option>
                <option value="main">Món chính</option>
                <option value="soup">Canh</option>
                <option value="dessert">Tráng miệng</option>
              </select>
              <select>
                <option value="">Sắp xếp theo</option>
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
                <option value="time_asc">Thời gian nấu (Tăng dần)</option>
                <option value="time_desc">Thời gian nấu (Giảm dần)</option>
              </select>
            </div>
          </div>
          
          <div className="dishes-grid-container">
            {loading ? (
              <Loading visible={true} text="Đang tải món ăn..." />
            ) : (
              <div className="dishes-grid">
                {dishes.map(dish => (
                  <div key={dish.id} className="dish-card" onClick={() => showDishDetail(dish)}>
                    <div className="dish-image">
                      <img src={dish.image} alt={dish.name} />
                      <span className="category-badge">{dish.category}</span>
                    </div>
                    <div className="dish-content">
                      <h3>{dish.name}</h3>
                      <p className="description">{dish.description}</p>
                      <div className="dish-info">
                        <span className="ingredients-count">{dish.ingredients_count} thành phần</span>
                        <span className="cooking-time">{dish.cooking_time}</span>
                      </div>
                    </div>
                    
                    {/* Đã xóa nút xóa */}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Modal Thêm Món Ăn */}
          <Modal
            title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Thêm món ăn mới</span>}
            open={isModalVisible}
            onCancel={handleCancel}
            width={1600}
            style={{ 
              top: 10,
              maxWidth: '90%',
              margin: '0 auto'
            }}
            footer={null}
          >
            <DishForm
              form={form}
              onFinish={handleSubmit}
              onCancel={handleCancel}
              allIngredients={allIngredients}
              isEdit={false}
            />
          </Modal>

          {/* Modal Import File */}
          <ImportFileModal 
            isVisible={isImportModalVisible}
            onCancel={handleImportCancel}
            onImport={handleImport}
          />
          
          {/* Modal Chi tiết món ăn */}
          <DishDetailModal
            isVisible={isDishDetailModalVisible}
            onClose={handleDishDetailClose}
            dish={selectedDish}
            onEdit={handleEditDish}
            onDelete={handleDeleteDish}
            allIngredients={allIngredients}
          />
        </div>
      </div>
    </div>
  )
}

export default Dishes