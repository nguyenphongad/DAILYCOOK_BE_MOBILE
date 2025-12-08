import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTotalUsers, fetchTotalDietTypes, fetchTotalMeals, fetchTotalIngredients } from '../../redux/thunks/userThunk'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'

const Home = () => {
  const dispatch = useDispatch()
  
  // Lấy auth state từ Redux
  const auth = useSelector(state => state.auth)
  const token = auth?.token
  
  // Lấy dữ liệu từ Redux store
  const { userStats, statsLoading, statsError } = useSelector(state => state.users)
  const { dietTypeStats, dietStatsLoading, dietStatsError } = useSelector(state => state.users)
  const { mealStats, mealStatsLoading, mealStatsError } = useSelector(state => state.users)
  const { ingredientStats, ingredientStatsLoading, ingredientStatsError } = useSelector(state => state.users)

  const [stats, setStats] = useState({
    users: 0,
    dietTypes: 0,
    dishes: 0,
    ingredients: 0
  })
  
  const [loading, setLoading] = useState(true)
  
  const [services, setServices] = useState([
    { id: 1, name: 'Auth Service', status: 'checking', url: 'http://localhost:5000/api/auth/health' },
    { id: 2, name: 'User Service', status: 'checking', url: 'http://localhost:5000/api/users/health' },
    { id: 3, name: 'Ingredient Service', status: 'checking', url: 'http://localhost:5000/api/ingredients/health' },
    { id: 4, name: 'Meal Service', status: 'checking', url: 'http://localhost:5000/api/meals/health' },
    { id: 5, name: 'MealPlan Service', status: 'checking', url: 'http://localhost:5000/api/mealplans/health' },
    { id: 6, name: 'Recipe Service', status: 'checking', url: 'http://localhost:5000/api/recipes/health' },
    { id: 8, name: 'Survey Service', status: 'checking', url: 'http://localhost:5000/api/surveys/health' }
  ])

  const [logs, setLogs] = useState([
    { id: 1, timestamp: '2024-01-20 10:30:25', type: 'INFO', message: 'Gateway started successfully' },
    { id: 2, timestamp: '2024-01-20 10:30:26', type: 'ERROR', message: 'Failed to connect to Auth service' },
    { id: 3, timestamp: '2024-01-20 10:30:27', type: 'WARNING', message: 'High memory usage detected' }
  ])

  useEffect(() => {
    if (token) {
      dispatch(fetchTotalUsers({ token }))
      dispatch(fetchTotalDietTypes({ token }))
      dispatch(fetchTotalMeals({ token }))
      dispatch(fetchTotalIngredients({ token }))
    }
    
    // Giả lập việc lấy dữ liệu thống kê khác (ingredients)
    // const fetchOtherStats = () => {
    //   setLoading(true)
      
    //   setTimeout(() => {
    //     setStats(prevStats => ({
    //       ...prevStats,
    //       ingredients: 234
    //     }))
    //     setLoading(false)
    //   }, 1000)
    // }
    
    // fetchOtherStats()
  }, [dispatch, token])

  // Cập nhật stats khi có dữ liệu từ API
  useEffect(() => {
    // Kiểm tra cấu trúc dữ liệu và lấy đúng totalUsers
    let totalUsersValue = 0
    
    if (userStats) {
      // Nếu userStats có cấu trúc { data: { totalUsers: 3 } }
      if (userStats.data && userStats.data.totalUsers !== undefined) {
        totalUsersValue = userStats.data.totalUsers
      }
      // Nếu userStats có cấu trúc { totalUsers: 3 }
      else if (userStats.totalUsers !== undefined) {
        totalUsersValue = userStats.totalUsers
      }
    }
    
    if (totalUsersValue > 0) {
      setStats(prevStats => ({
        ...prevStats,
        users: totalUsersValue
      }))
    }

    // Xử lý totalDietTypes
    let totalDietTypesValue = 0
    
    if (dietTypeStats) {
      if (dietTypeStats.data && dietTypeStats.data.totalDietTypes !== undefined) {
        totalDietTypesValue = dietTypeStats.data.totalDietTypes
      } else if (dietTypeStats.totalDietTypes !== undefined) {
        totalDietTypesValue = dietTypeStats.totalDietTypes
      }
    }
    
    if (totalDietTypesValue >= 0) {
      setStats(prevStats => ({
        ...prevStats,
        dietTypes: totalDietTypesValue
      }))
    }

    // Xử lý totalMeals
    let totalMealsValue = 0
    
    if (mealStats) {
      if (mealStats.data && mealStats.data.totalMeals !== undefined) {
        totalMealsValue = mealStats.data.totalMeals
      } else if (mealStats.totalMeals !== undefined) {
        totalMealsValue = mealStats.totalMeals
      }
    }
    
    if (totalMealsValue >= 0) {
      setStats(prevStats => ({
        ...prevStats,
        dishes: totalMealsValue
      }))
    }

    // Xử lý totalIngredients
    let totalIngredientsValue = 0
    
    if (ingredientStats) {
      if (ingredientStats.data && ingredientStats.data.totalIngredients !== undefined) {
        totalIngredientsValue = ingredientStats.data.totalIngredients
      } else if (ingredientStats.totalIngredients !== undefined) {
        totalIngredientsValue = ingredientStats.totalIngredients
      }
    }
    
    if (totalIngredientsValue >= 0) {
      setStats(prevStats => ({
        ...prevStats,
        ingredients: totalIngredientsValue
      }))
    }
  }, [userStats, dietTypeStats, mealStats, ingredientStats])
  
  const StatCard = ({ title, value, icon, color, isLoading }) => (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">
          {isLoading ? '...' : (value || 0)}
        </p>
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
          
          {(statsError || dietStatsError || mealStatsError || ingredientStatsError) && (
            <div className="error-message" style={{
              color: '#e74c3c',
              backgroundColor: '#fadbd8',
              padding: '10px',
              borderRadius: '5px',
              margin: '10px 0'
            }}>
              {statsError && <div>Lỗi lấy thống kê người dùng: {statsError}</div>}
              {dietStatsError && <div>Lỗi lấy thống kê chế độ ăn: {dietStatsError}</div>}
              {mealStatsError && <div>Lỗi lấy thống kê món ăn: {mealStatsError}</div>}
              {ingredientStatsError && <div>Lỗi lấy thống kê nguyên liệu: {ingredientStatsError}</div>}
            </div>
          )}
          
          <div className="stats-container">
            <StatCard 
              title="Tổng người dùng" 
              value={stats.users} 
              icon="👥" 
              color="#4361ee"
              isLoading={statsLoading}
            />
            <StatCard 
              title="Tổng chế độ ăn" 
              value={stats.dietTypes} 
              icon="🥗" 
              color="#3a86ff"
              isLoading={dietStatsLoading}
            />
            <StatCard 
              title="Tổng món ăn" 
              value={stats.dishes} 
              icon="🍲" 
              color="#4cc9f0"
              isLoading={mealStatsLoading}
            />
            <StatCard 
              title="Tổng nguyên liệu" 
              value={stats.ingredients} 
              icon="🥕" 
              color="#4895ef"
              isLoading={ingredientStatsLoading}
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
