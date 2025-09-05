import { useSelector } from 'react-redux'

const Header = () => {
  const { user } = useSelector(state => state.auth)
  
  return (
    <header className="header">
      <div className="user-greeting">
        Xin chào, {user?.name || 'Người dùng'}
      </div>
    </header>
  )
}

export default Header
