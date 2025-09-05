import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'
import './Menus.scss'

const Menus = () => {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Giả lập việc lấy danh sách thực đơn
    const fetchMenus = () => {
      setLoading(true)
      
      // Giả lập API call
      setTimeout(() => {
        const mockMenus = [
          { id: 1, name: 'Thực đơn tuần 1', description: 'Thực đơn cho gia đình 4 người', dishes_count: 10, created_by: 'Admin', created_at: '01/05/2023' },
          { id: 2, name: 'Thực đơn ăn kiêng', description: 'Thực đơn giảm cân trong 1 tuần', dishes_count: 15, created_by: 'Admin', created_at: '05/05/2023' },
          { id: 3, name: 'Thực đơn cho trẻ em', description: 'Thực đơn dành cho trẻ từ 3-5 tuổi', dishes_count: 8, created_by: 'Admin', created_at: '10/05/2023' },
          { id: 4, name: 'Thực đơn cuối tuần', description: 'Các món ăn cho ngày cuối tuần', dishes_count: 5, created_by: 'Admin', created_at: '15/05/2023' },
          { id: 5, name: 'Thực đơn ngày lễ', description: 'Các món ăn đặc biệt cho ngày lễ', dishes_count: 12, created_by: 'Admin', created_at: '20/05/2023' },
        ]
        setMenus(mockMenus)
        setLoading(false)
      }, 1000)
    }
    
    fetchMenus()
  }, [])
  
  return (
    <div className="menus-container">
      <Menu />
      <div className="content-area">
        <Header />
        <div className="content">
          <div className="page-header">
            <h1>Quản lý thực đơn</h1>
            <button className="add-button">+ Thêm thực đơn</button>
          </div>
          
          <div className="menus-grid-container">
            {loading ? (
              <div className="loading">Đang tải dữ liệu...</div>
            ) : (
              <div className="menus-grid">
                {menus.map(menu => (
                  <div key={menu.id} className="menu-card">
                    <div className="menu-content">
                      <h3>{menu.name}</h3>
                      <p className="description">{menu.description}</p>
                      <div className="menu-info">
                        <span className="dishes-count">{menu.dishes_count} món</span>
                        <span className="created-at">Tạo: {menu.created_at}</span>
                      </div>
                    </div>
                    <div className="menu-actions">
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

export default Menus
