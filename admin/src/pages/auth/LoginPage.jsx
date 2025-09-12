import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Spin } from 'antd'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { IoMdLogIn } from "react-icons/io"
import { loginSuccess } from '../../redux/slices/authSlice'
import { loginAPI } from '../../utils/api'
import logoImage from '../../assets/logo.png'

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: 'user@example.com',
    password: 'password123',
    name: "ADMIN TRÂN",
    avatar: 'https://hinhnenpowerpoint.app/wp-content/uploads/2025/06/anh-avatar-capybara-cute-1.jpg'
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
          <p>Giáo viên hướng dẫn: TS. Nguyễn Trọng Tiến</p>
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
          <h2 style={{color:"#b30000"}}>ĐĂNG NHẬP ADMIN</h2>
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
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
                <span 
                  className="password-toggle-icon" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <><Spin size="small" className="white-spin" /> </> : <><IoMdLogIn className="login-icon" /> Đăng Nhập</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage