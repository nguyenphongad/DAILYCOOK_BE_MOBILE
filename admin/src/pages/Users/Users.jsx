import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'
import './Users.scss'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Giả lập việc lấy danh sách người dùng
    const fetchUsers = () => {
      setLoading(true)
      
      // Giả lập API call
      setTimeout(() => {
        const mockUsers = [
          { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567', created_at: '01/05/2023', status: 'active' },
          { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', phone: '0901234568', created_at: '15/05/2023', status: 'active' },
          { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', phone: '0901234569', created_at: '20/05/2023', status: 'inactive' },
          { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', phone: '0901234570', created_at: '25/05/2023', status: 'active' },
          { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', phone: '0901234571', created_at: '30/05/2023', status: 'active' },
        ]
        setUsers(mockUsers)
        setLoading(false)
      }, 1000)
    }
    
    fetchUsers()
  }, [])
  
  return (
    <div className="users-container">
      <Menu />
      <div className="content-area">
        <Header />
        <div className="content">
          <div className="page-header">
            <h1>Quản lý người dùng</h1>
            <button className="add-button">+ Thêm người dùng</button>
          </div>
          
          <div className="users-table-container">
            {loading ? (
              <div className="loading">Đang tải dữ liệu...</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên người dùng</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.created_at}</td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="edit-btn">Sửa</button>
                        <button className="delete-btn">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Users
