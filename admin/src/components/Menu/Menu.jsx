import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import './Menu.scss'

const Menu = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const [menuItems] = useState([
    { path: '/', label: 'Trang chủ', icon: '📊' },
    { path: '/users', label: 'Quản lý người dùng', icon: '👥' },
    { path: '/menus', label: 'Quản lý thực đơn', icon: '📋' },
    { path: '/dishes', label: 'Quản lý món ăn', icon: '🍲' },
    { path: '/ingredients', label: 'Quản lý thành phần', icon: '🥕' },
    { path: '/products', label: 'Quản lý sản phẩm', icon: '📦' },
  ])
  
  const handleLogout = () => {
    dispatch(logout())
  }
  
  return (
    <div className="menu">
      <div className="menu-header">
        <h2>DAILYCOOK</h2>
      </div>
      <ul className="menu-items">
        {menuItems.map(item => (
          <li 
            key={item.path} 
            className={location.pathname === item.path ? 'active' : ''}
          >
            <Link to={item.path}>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="menu-footer">
        <button onClick={handleLogout} className="logout-button">
          <span className="icon">🚪</span>
          <span className="label">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}

export default Menu
