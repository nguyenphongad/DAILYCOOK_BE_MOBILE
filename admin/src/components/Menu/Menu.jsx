import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MdDashboard, MdPeople, MdRestaurantMenu, MdShoppingBasket, MdInventory, MdInfo } from 'react-icons/md'
import { Modal } from 'antd'
import logoImage from '../../assets/logo.png'

const Menu = () => {
  const location = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [menuItems] = useState([
    { path: '/', label: 'Trang chủ', icon: <MdDashboard /> },
    { path: '/users', label: 'Quản lý người dùng', icon: <MdPeople /> },
    { path: '/dishes', label: 'Quản lý món ăn', icon: <MdRestaurantMenu /> },
    { path: '/ingredients', label: 'Quản lý thành phần', icon: <MdInventory /> },
    { path: '/products', label: 'Quản lý sản phẩm', icon: <MdShoppingBasket /> },
  ])

  return (
    <div className="menu">
      <div className="menu-header">
        <img src={logoImage} alt="DailyCook Logo" className="menu-logo" />
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
              <span className="label text_menu">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="menu-footer">
        <div className="system-info">
          <p>Hệ thống khóa luận tốt nghiệp</p>
          <button onClick={() => setIsModalOpen(true)} className="info-button">
            <span className="icon"><MdInfo /></span>
            <span className="label">Chi tiết</span>
          </button>
        </div>
      </div>

      <Modal
        title="Thông tin hệ thống"
        open={isModalOpen}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        footer={[
          <button key="close" className="ant-btn ant-btn-primary" onClick={() => setIsModalOpen(false)}>
            Đóng
          </button>,
        ]}
      >
        <div className="system-detail">
          <h3>KHÓA LUẬN TỐT NGHIỆP - ĐỀ TÀI DAILYCOOK</h3>
          <div className="info-section">
            <h4>Thông tin đề tài</h4>
            <p>Đề tài: <strong>DailyCook - Thực đơn nhà mình</strong></p>
            <p>Ứng dụng hỗ trợ người dùng lập kế hoạch bữa ăn, gợi ý công thức nấu ăn dựa trên nguyên liệu có sẵn và hỗ trợ quản lý thực phẩm trong gia đình.</p>
          </div>
          <div className="info-section">
            <h4>Sinh viên thực hiện</h4>
            <p>• Nguyễn Văn Phong</p>
            <p>• Trần Thị Huyền Trân</p>
          </div>
          <div className="info-section">
            <h4>Giảng viên hướng dẫn</h4>
            <p>• ThS. Nguyễn Trọng Tiến</p>
          </div>
          <div className="info-section">
            <h4>Công nghệ sử dụng</h4>
            <p>• Front-end: React Native, React.js</p>
            <p>• Back-end: Node.js, Express</p>
            <p>• Database: MongoDB</p>
            <p>• AI Integration: OpenAI API</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Menu
