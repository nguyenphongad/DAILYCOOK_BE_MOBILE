import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { loginAdmin } from '../../redux/thunks/authThunk'
import logoImage from '../../assets/logo.png'

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    passwordAdmin: ''
  })
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLogin } = useSelector(state => state.auth)
  
  // Kiểm tra nếu đã đăng nhập thì chuyển hướng đến trang chủ hoặc trang yêu cầu trước đó
  useEffect(() => {
    if (isLogin) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isLogin, navigate, location])

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
      const resultAction = await dispatch(loginAdmin(credentials))
      if (loginAdmin.fulfilled.match(resultAction)) {
        toast.success('Đăng nhập thành công!')
        navigate('/')
      } else if (loginAdmin.rejected.match(resultAction)) {
        toast.error(resultAction.payload?.message || 'Đăng nhập thất bại!')
      }
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
              <label htmlFor="passwordAdmin">Mật khẩu</label>
              <input
                type="password"
                id="passwordAdmin"
                name="passwordAdmin"
                value={credentials.passwordAdmin}
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

export default LoginPage