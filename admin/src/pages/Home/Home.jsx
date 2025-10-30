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
  
  const [services, setServices] = useState([
    { id: 1, name: 'Auth Service', status: 'checking', url: 'http://localhost:5000/api/auth/health' },
    { id: 2, name: 'User Service', status: 'checking', url: 'http://localhost:5000/api/user/health' },
    { id: 3, name: 'Ingredient Service', status: 'checking', url: 'http://localhost:5000/api/ingredient/health' },
    { id: 4, name: 'Meal Service', status: 'checking', url: 'http://localhost:5000/api/meal/health' },
    { id: 5, name: 'MealPlan Service', status: 'checking', url: 'http://localhost:5000/api/mealPlan/health' },
    { id: 6, name: 'Recipe Service', status: 'checking', url: 'http://localhost:5000/api/recipe/health' },
    { id: 7, name: 'Shopping Service', status: 'checking', url: 'http://localhost:5000/api/shopping/health' },
    { id: 8, name: 'Survey Service', status: 'checking', url: 'http://localhost:5000/api/survey/health' }
  ])

  const [logs, setLogs] = useState([
    { id: 1, timestamp: '2024-01-20 10:30:25', type: 'INFO', message: 'Gateway started successfully' },
    { id: 2, timestamp: '2024-01-20 10:30:26', type: 'ERROR', message: 'Failed to connect to Auth service' },
    { id: 3, timestamp: '2024-01-20 10:30:27', type: 'WARNING', message: 'High memory usage detected' }
  ])

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

  // Hàm kiểm tra health của 1 service
  const checkServiceHealth = async (service) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'OK' ? 'running' : 'stopped';
      } else {
        return 'stopped';
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Service ${service.name} health check timeout`);
      } else {
        console.log(`Service ${service.name} health check failed:`, error.message);
      }
      return 'stopped';
    }
  };

  // Hàm kiểm tra tất cả services
  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        const status = await checkServiceHealth(service)
        return { ...service, status }
      })
    )
    setServices(updatedServices)
  }

  // Effect để kiểm tra services mỗi 10 giây
  useEffect(() => {
    // Kiểm tra ngay khi component mount
    checkAllServices()
    
    // Thiết lập interval 10 giây thay vì 15 giây
    const interval = setInterval(() => {
      checkAllServices()
    }, 10000)

    // Cleanup interval khi component unmount
    return () => clearInterval(interval)
  }, [])

  const ServiceStatus = ({ status }) => (
    <div className="service-status">
      <span className={`status-dot ${status}`}></span>
      <span className="status-text">
        {status === 'running' ? 'Running' : 
         status === 'stopped' ? 'Stopped' : 
         'Checking...'}
      </span>
    </div>
  )

  return (
    <div className="home-container">
      <div className="content-area">
        <div className="content">
          <h1 style={{marginTop:0}}>Bảng điều khiển</h1>
          
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
          
          <div className="services-section">
            <h2>Trạng thái Services</h2>
            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className="service-card">
                  <h3>{service.name}</h3>
                  <ServiceStatus status={service.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="logs-section">
            <h2>Gateway Logs</h2>
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th style={{width: '200px'}}>Thời gian</th>
                    <th style={{width: '100px'}}>Loại</th>
                    <th>Nội dung</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className={`log-row ${log.type.toLowerCase()}`}>
                      <td>{log.timestamp}</td>
                      <td><strong>{log.type}</strong></td>
                      <td>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
