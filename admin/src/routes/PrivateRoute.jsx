import { Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { logout } from '../redux/slices/authSlice';

const PrivateRoute = ({ element }) => {
  const { isLogin, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      dispatch(logout());
    }
  }, [token, dispatch]);

  // Nếu đã đăng nhập, hiển thị component được bảo vệ
  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập và lưu vị trí hiện tại
  return isLogin ? element : <Navigate to="/login" state={{ from: location }} replace />;
}

export default PrivateRoute
