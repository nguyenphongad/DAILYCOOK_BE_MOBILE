import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MdDashboard, MdPeople, MdRestaurantMenu, MdShoppingBasket, MdInventory, MdInfo, MdLocalDining, MdKeyboardArrowDown, MdCategory, MdFoodBank, MdOutlineAssignment } from 'react-icons/md'
import { Modal } from 'antd'
import logoImage from '../../assets/logo.png'
import { BiSolidDuplicate } from "react-icons/bi";

const Menu = () => {
  const location = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeMenuIndex, setActiveMenuIndex] = useState(0)
  const menuRef = useRef(null)
  const floatingBorderRef = useRef(null)
  const [expandedMenus, setExpandedMenus] = useState({})

  const [menuItems] = useState([
    { path: '/', label: 'Trang chủ', icon: <MdDashboard /> },
    {
      path: '/manage_categorys', label: 'Quản lý danh mục', icon: <BiSolidDuplicate />,
      submenu: [
        { path: '/manage_category/ingredients', label: 'Nguyên liệu', icon: <MdInventory /> },
        { path: '/manage_category/meals', label: 'Món ăn', icon: <MdFoodBank /> },
      ]
    },
    { path: '/manage_diet_types', label: 'Quản lý chế độ ăn', icon: <MdLocalDining /> },
    { path: '/manage_surveys', label: 'Quản lý khảo sát', icon: <MdOutlineAssignment /> },
    {
      path: '/manage_meal', label: 'Quản lý món ăn', icon: <MdRestaurantMenu />,
    },
    // { path: '/manage_recipes', label: 'Quản lý công thức', icon: <MdShoppingBasket /> },
    { path: '/manage_ingredients', label: 'Quản lý nguyên liệu', icon: <MdInventory /> },
    { path: '/manage_users', label: 'Quản lý người dùng', icon: <MdPeople /> },
  ])

  // Tìm menu item đang active dựa vào path
  useEffect(() => {
    const currentPath = location.pathname;

    // Kiểm tra đường dẫn chính và submenu
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];

      // Kiểm tra path chính
      if (item.path === currentPath) {
        setActiveMenuIndex(i);
        return;
      }

      // Kiểm tra trong submenu nếu có
      if (item.submenu) {
        const subIndex = item.submenu.findIndex(sub => sub.path === currentPath);
        if (subIndex !== -1) {
          setActiveMenuIndex(i);
          setExpandedMenus(prev => ({ ...prev, [i]: true }));
          return;
        }
      }
    }

    // Nếu không tìm thấy, đặt về menu đầu tiên
    setActiveMenuIndex(0);
  }, [location, menuItems]);

  // Di chuyển floating border đến menu item đang active
  useEffect(() => {
    if (floatingBorderRef.current) {
      const activeItem = document.querySelector('.menu-items li.active');
      if (activeItem) {
        // Lấy vị trí thực tế của item active so với container menu
        const menuTop = menuRef.current.getBoundingClientRect().top;
        const itemTop = activeItem.getBoundingClientRect().top;
        const offsetTop = itemTop - menuTop;

        // Cập nhật vị trí của floating border
        floatingBorderRef.current.style.top = `${offsetTop}px`;
        floatingBorderRef.current.style.opacity = '1';
      } else {
        floatingBorderRef.current.style.opacity = '0';
      }
    }
  }, [activeMenuIndex, location.pathname, expandedMenus]);

  const toggleSubmenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="menu" ref={menuRef}>
      {/* Floating border element */}
      <div className="floating-border" ref={floatingBorderRef}></div>

      <div className="menu-header">
        <img src={logoImage} alt="DailyCook Logo" className="menu-logo" />
        <h2>DAILYCOOK</h2>
      </div>

      <ul className="menu-items">
        {menuItems.map((item, index) => (
          <li
            key={item.path}
            className={`${location.pathname === item.path ? 'active' : ''} ${item.submenu ? 'has-submenu' : ''}`}
            title={item.label}
          >
            {item.submenu ? (
              <>
                <div
                  className="menu-item-with-submenu"
                  onClick={() => toggleSubmenu(index)}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label text_menu">{item.label}</span>
                  <span className={`submenu-arrow ${expandedMenus[index] ? 'expanded' : ''}`}>
                    <MdKeyboardArrowDown />
                  </span>
                </div>
                {item.submenu && (
                  <ul className={`submenu ${expandedMenus[index] ? 'expanded' : ''}`}>
                    {item.submenu.map((subItem) => (
                      <li
                        key={subItem.path}
                        className={location.pathname === subItem.path ? 'active' : ''}
                      >
                        <Link to={subItem.path}>
                          <span className="submenu-icon">{subItem.icon}</span>
                          <span className="label">{subItem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link to={item.path}>
                <span className="icon">{item.icon}</span>
                <span className="label text_menu">{item.label}</span>
              </Link>
            )}
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
            <p>• ThS. Nguyễn Thị Thu Hà</p>
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