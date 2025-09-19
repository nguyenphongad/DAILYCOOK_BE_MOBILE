import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const PublicRoute = ({ element, restricted = false }) => {
  const { isLogin } = useSelector(state => state.auth)

  // Nếu route bị hạn chế và người dùng đã đăng nhập, chuyển hướng đến trang chủ
  // Ví dụ: Trang đăng nhập sẽ có restricted = true
  return isLogin && restricted ? <Navigate to="/" replace /> : element
}

export default PublicRoute
