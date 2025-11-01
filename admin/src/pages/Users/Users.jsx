import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Popconfirm, message } from 'antd'
import { FiLock } from 'react-icons/fi'
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

  const handleLockUser = (userId, userName, isActive) => {
    dispatch(toggleUserStatus({ userId, isActive: false, token }))
      .unwrap()
      .then(() => {
        message.success(`Đã khoá người dùng "${userName}"`)
        // Sau khi khoá, reload lại danh sách
        dispatch(fetchUsers({ token, page: currentPage, limit: usersPerPage, search: searchEmail }))
      })
      .catch(() => {
        // lỗi đã được xử lý ở slice
      })
  }

  const goToPage = (pageNumber) => setCurrentPage(pageNumber)
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

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
                      <th>ID</th>
                      <th>Tên người dùng</th>
                      <th>Email</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users && users.length > 0 ? users.map(user => (
                      <tr key={user._id}>
                        <td>{user._id}</td>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </td>
                        <td className="btn-actions-del">
                          <Popconfirm
                            title="Xác nhận khóa người dùng"
                            description={`Bạn có chắc chắn muốn khóa người dùng "${user.fullName}"?`}
                            onConfirm={() => handleLockUser(user._id, user.fullName, user.isActive)}
                            okText="Khóa"
                            cancelText="Hủy"
                            okType="danger"
                            disabled={!user.isActive}
                            placement="topLeft"
                          >
                            <button 
                              className="lock-btn"
                              disabled={!user.isActive}
                            >
                              <FiLock className="lock-icon" />
                              Khóa
                            </button>
                          </Popconfirm>
                        </td>
                      </tr>
                    )) : (
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
