import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Popconfirm, message } from 'antd'
import { FiLock } from 'react-icons/fi'
import { MdAdminPanelSettings } from 'react-icons/md'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'
import Loading from '../../components/Loading/Loading'
import { fetchUsers, toggleUserStatus } from '../../redux/thunks/userThunk'
import { clearUserError } from '../../redux/slices/userSlice'
import { useSelector as useReduxSelector } from 'react-redux'

const Users = () => {
  const dispatch = useDispatch()
  const { users, totalPages, totalUsers, loading, error } = useSelector(state => state.users)
  const auth = useReduxSelector(state => state.auth)
  const token = auth?.token

  const [searchEmail, setSearchEmail] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [processingUserId, setProcessingUserId] = useState(null) // Thêm state cho loading riêng lẻ
  const usersPerPage = 10

  // Fetch users từ API
  useEffect(() => {
    if (token) {
      dispatch(fetchUsers({ token, page: currentPage, limit: usersPerPage, search: searchEmail }))
    }
  }, [token, currentPage, searchEmail, dispatch])

  // Hiển thị lỗi nếu có
  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearUserError())
    }
  }, [error, dispatch])

  const handleToggleUserStatus = async (userId, userName, isActive) => {
    const newStatus = !isActive;
    const action = newStatus ? 'mở khóa' : 'khóa';
    
    try {
      // Set loading cho user cụ thể
      setProcessingUserId(userId);
      
      await dispatch(toggleUserStatus({ userId, isActive: newStatus, token })).unwrap();
      
      message.success(`Đã ${action} người dùng "${userName}"`);
      
      // Không cần reload lại danh sách vì đã update trong Redux slice
      
    } catch (error) {
      message.error(`Lỗi ${action} người dùng: ${error.message || error}`);
    } finally {
      // Tắt loading cho user cụ thể
      setProcessingUserId(null);
    }
  }

  const goToPage = (pageNumber) => setCurrentPage(pageNumber)
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

  // Sắp xếp users: admin lên đầu
  const sortedUsers = users?.slice().sort((a, b) => {
    const aIsAdmin = a.accountInfo?.isAdmin || false
    const bIsAdmin = b.accountInfo?.isAdmin || false
    if (aIsAdmin && !bIsAdmin) return -1
    if (!aIsAdmin && bIsAdmin) return 1
    return 0
  }) || []

  return (
    <div className="users-container">
      <Loading visible={loading} text="Đang tải danh sách người dùng..." />
      <div className="content-area">
        <div className="content">
          <div className="page-header">
            <h1>Quản lý người dùng</h1>
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder="Tìm kiếm theo email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="users-table-container">
            {!loading && (
              <>
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên người dùng</th>
                      <th>Email</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers && sortedUsers.length > 0 ? sortedUsers.map((user, index) => {
                      const isAdmin = user.accountInfo?.isAdmin || false
                      const isActive = user.accountInfo?.isActive !== false
                      const email = user.accountInfo?.email || 'N/A'
                      
                      return (
                        <tr key={user._id}>
                          <td>{(currentPage - 1) * usersPerPage + index + 1}</td>
                          <td style={isAdmin ? { color: '#dc2626', fontWeight: 'bold' } : {}}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {user.fullName}
                              {isAdmin && <MdAdminPanelSettings className="admin-icon" />}
                            </div>
                          </td>
                          <td>{email}</td>
                          <td>{new Date(user.createAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            {!isAdmin && (
                              <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                                {isActive ? 'Hoạt động' : 'Bị khóa'}
                              </span>
                            )}
                          </td>
                          <td className="btn-actions-del">
                            {!isAdmin && (
                              <Popconfirm
                                title={`Xác nhận ${isActive ? 'khóa' : 'mở khóa'} người dùng`}
                                description={`Bạn có chắc chắn muốn ${isActive ? 'khóa' : 'mở khóa'} người dùng "${user.fullName}"?`}
                                onConfirm={() => handleToggleUserStatus(user._id, user.fullName, isActive)}
                                okText={isActive ? 'Khóa' : 'Mở khóa'}
                                cancelText="Hủy"
                                okType={isActive ? 'danger' : 'primary'}
                                placement="topLeft"
                              >
                                <button 
                                  className={isActive ? "lock-btn" : "unlock-btn"}
                                  disabled={processingUserId === user._id}
                                >
                                  <FiLock className="lock-icon" />
                                  {processingUserId === user._id 
                                    ? 'Đang xử lý...' 
                                    : (isActive ? 'Khóa' : 'Mở khóa')
                                  }
                                </button>
                              </Popconfirm>
                            )}
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>Không có người dùng nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination">
                  <button 
                    onClick={goToPrevPage} 
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Trước
                  </button>
                  
                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                  </div>

                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Sau →
                  </button>
                </div>

                <div className="pagination-info">
                  Hiển thị {(currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, totalUsers)} 
                  <span> </span>trong tổng số {totalUsers} người dùng
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Users
