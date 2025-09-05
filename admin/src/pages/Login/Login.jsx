import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { loginSuccess } from '../../redux/slices/authSlice'
import { loginAPI } from '../../utils/api'
import './Login.scss'
import logoImage from '../../assets/logo.png'

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: 'user@example.com',
    password: 'password123'
  })
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await loginAPI(credentials)
      dispatch(loginSuccess(response.user))
      toast.success('Đăng nhập thành công!')
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Đăng nhập thất bại!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="intro-content">
          <h1 className="thesis-title">KHÓA LUẬN TỐT NGHIỆP</h1>
          <h2 className="project-title">Đề tài: DailyCook - Thực đơn nhà mình</h2>
          <div className="authors">
            <p>Thành viên thực hiện:</p>
            <p>Nguyễn Văn Phong</p>
            <p>Trần Thị Huyền Trân</p>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form">
          <div className="logo-container">
            <img src={logoImage} alt="Logo" className="logo" />
          </div>
          <h2>ĐĂNG NHẬP ADMIN</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
