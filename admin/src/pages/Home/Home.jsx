import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'

const Home = () => {
  const [stats, setStats] = useState({
    users: 0,
    menus: 0,
    dishes: 0,
    ingredients: 0
  })
  
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Giả lập việc lấy dữ liệu thống kê
    const fetchStats = () => {
      setLoading(true)
      
      // Giả lập API call
      setTimeout(() => {
        setStats({
          users: 150,
          menus: 48,
          dishes: 127,
          ingredients: 234
        })
        setLoading(false)
      }, 1000)
    }
    
    fetchStats()
  }, [])
  
  const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{loading ? '...' : value}</p>
      </div>
    </div>
  )
  
  return (
    <div className="home-container">
      <div className="content-area">
        <div className="content">
          <h1>Bảng điều khiển</h1>
          
          <div className="stats-container">
            <StatCard 
              title="Tổng người dùng" 
              value={stats.users} 
              icon="👥" 
              color="#4361ee" 
            />
            <StatCard 
              title="Tổng thực đơn" 
              value={stats.menus} 
              icon="📋" 
              color="#3a86ff" 
            />
            <StatCard 
              title="Tổng món ăn" 
              value={stats.dishes} 
              icon="🍲" 
              color="#4cc9f0" 
            />
            <StatCard 
              title="Tổng thành phần" 
              value={stats.ingredients} 
              icon="🥕" 
              color="#4895ef" 
            />
          </div>
          
          <div className="recent-activity">
            <h2>Hoạt động gần đây</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <p><strong>Nguyễn Văn A</strong> vừa đăng ký tài khoản</p>
                  <span className="activity-time">5 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🍲</div>
                <div className="activity-content">
                  <p><strong>Trần Thị B</strong> vừa thêm món "Gà xào xả ớt"</p>
                  <span className="activity-time">15 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p><strong>Lê Văn C</strong> vừa tạo thực đơn "Bữa trưa cho gia đình"</p>
                  <span className="activity-time">30 phút trước</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
