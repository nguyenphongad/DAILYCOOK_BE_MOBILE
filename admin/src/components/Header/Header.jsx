import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { MdAdminPanelSettings, MdLogout, MdAutoGraph } from 'react-icons/md'
import { Modal } from 'antd'
import { logout } from '../../redux/slices/authSlice'

const Header = () => {
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <header className="header">

      <div className="admin-badge">
        <MdAdminPanelSettings className="admin-icon" />
        <span className="admin-text">ADMIN</span>
      </div>

      <div className="header-right">
        <div className="user-info">
          <div className="user-greeting">
            Xin chào, {user?.fullName || 'Người dùng'}
          </div>
          {user?.userImage && (
            <div 
              className="avatar-container"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img src={user.userImage} alt="Avatar" className="user-avatar" />
              {showUserMenu && (
                <div className="user-popup">
                  <div className="popup-item">
                    <MdAutoGraph className="popup-icon" />
                    <span>Hiệu suất AI</span>
                  </div>
                  <div 
                    className="popup-item logout"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                  >
                    <MdLogout className="popup-icon" />
                    <span>Đăng xuất</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Xác nhận đăng xuất"
        open={isModalOpen}
        onOk={() => {
          dispatch(logout());
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="Đăng xuất"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
      </Modal>
    </header>
  )
}

export default Header
