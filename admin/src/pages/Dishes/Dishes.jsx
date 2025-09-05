import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'

const Dishes = () => {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Giả lập việc lấy danh sách món ăn
    const fetchDishes = () => {
      setLoading(true)
      
      // Giả lập API call
      setTimeout(() => {
        const mockDishes = [
          { 
            id: 1, 
            name: 'Gà xào xả ớt', 
            description: 'Món ăn truyền thống của Việt Nam', 
            ingredients_count: 8, 
            cooking_time: '30 phút', 
            category: 'Món chính',
            image: 'https://placekitten.com/300/200',
          },
          { 
            id: 2, 
            name: 'Phở bò', 
            description: 'Món ăn đặc trưng của Việt Nam', 
            ingredients_count: 12, 
            cooking_time: '45 phút', 
            category: 'Món chính',
            image: 'https://placekitten.com/301/200',
          },
          { 
            id: 3, 
            name: 'Cá kho tộ', 
            description: 'Món ăn dân dã miền Bắc', 
            ingredients_count: 6, 
            cooking_time: '40 phút', 
            category: 'Món chính',
            image: 'https://placekitten.com/302/200',
          },
          { 
            id: 4, 
            name: 'Canh chua cá lóc', 
            description: 'Món ăn đặc trưng miền Nam', 
            ingredients_count: 10, 
            cooking_time: '35 phút', 
            category: 'Canh',
            image: 'https://placekitten.com/303/200',
          },
          { 
            id: 5, 
            name: 'Chè đậu xanh', 
            description: 'Món tráng miệng truyền thống', 
            ingredients_count: 5, 
            cooking_time: '25 phút', 
            category: 'Tráng miệng',
            image: 'https://placekitten.com/304/200',
          },
          { 
            id: 6, 
            name: 'Bún riêu cua', 
            description: 'Món ăn dân dã Việt Nam', 
            ingredients_count: 15, 
            cooking_time: '50 phút', 
            category: 'Món chính',
            image: 'https://placekitten.com/305/200',
          },
        ]
        setDishes(mockDishes)
        setLoading(false)
      }, 1000)
    }
    
    fetchDishes()
  }, [])
  
  return (
    <div className="dishes-container">
      <Menu />
      <div className="content-area">
        <Header />
        <div className="content">
          <div className="page-header">
            <h1>Quản lý món ăn</h1>
            <button className="add-button">+ Thêm món ăn</button>
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
              <div className="loading">Đang tải dữ liệu...</div>
            ) : (
              <div className="dishes-grid">
                {dishes.map(dish => (
                  <div key={dish.id} className="dish-card">
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
                    <div className="btn-actions">
                      <button className="view-btn">Xem</button>
                      <button className="edit-btn">Sửa</button>
                      <button className="delete-btn">Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dishes
