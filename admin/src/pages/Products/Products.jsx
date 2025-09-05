import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Giả lập việc lấy danh sách sản phẩm
    const fetchProducts = () => {
      setLoading(true)
      
      // Giả lập API call
      setTimeout(() => {
        const mockProducts = [
          { 
            id: 1, 
            name: 'Nồi cơm điện', 
            description: 'Nồi cơm điện đa năng 1.8L', 
            price: 1200000, 
            category: 'Thiết bị nhà bếp',
            stock: 25,
            image: 'https://placekitten.com/300/300',
          },
          { 
            id: 2, 
            name: 'Máy xay sinh tố', 
            description: 'Máy xay sinh tố công suất cao', 
            price: 800000, 
            category: 'Thiết bị nhà bếp',
            stock: 15,
            image: 'https://placekitten.com/301/300',
          },
          { 
            id: 3, 
            name: 'Dao bếp set 5 món', 
            description: 'Bộ dao bếp inox cao cấp', 
            price: 550000, 
            category: 'Dụng cụ nấu ăn',
            stock: 30,
            image: 'https://placekitten.com/302/300',
          },
          { 
            id: 4, 
            name: 'Thớt gỗ', 
            description: 'Thớt gỗ tự nhiên kháng khuẩn', 
            price: 180000, 
            category: 'Dụng cụ nấu ăn',
            stock: 40,
            image: 'https://placekitten.com/303/300',
          },
          { 
            id: 5, 
            name: 'Nồi áp suất', 
            description: 'Nồi áp suất đa năng 5L', 
            price: 1500000, 
            category: 'Thiết bị nhà bếp',
            stock: 10,
            image: 'https://placekitten.com/304/300',
          },
          { 
            id: 6, 
            name: 'Chảo chống dính', 
            description: 'Chảo chống dính cao cấp 28cm', 
            price: 450000, 
            category: 'Dụng cụ nấu ăn',
            stock: 35,
            image: 'https://placekitten.com/305/300',
          },
        ]
        setProducts(mockProducts)
        setLoading(false)
      }, 1000)
    }
    
    fetchProducts()
  }, [])
  
  return (
    <div className="products-container">
      <Menu />
      <div className="content-area">
        <Header />
        <div className="content">
          <div className="page-header">
            <h1>Quản lý sản phẩm</h1>
            <button className="add-button">+ Thêm sản phẩm</button>
          </div>
          
          <div className="products-filter">
            <div className="search-bar">
              <input type="text" placeholder="Tìm kiếm sản phẩm..." />
              <button>Tìm</button>
            </div>
            <div className="filters">
              <select>
                <option value="">Tất cả danh mục</option>
                <option value="kitchen-appliances">Thiết bị nhà bếp</option>
                <option value="cooking-tools">Dụng cụ nấu ăn</option>
              </select>
              <select>
                <option value="">Sắp xếp theo</option>
                <option value="price_asc">Giá (Thấp - Cao)</option>
                <option value="price_desc">Giá (Cao - Thấp)</option>
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
              </select>
            </div>
          </div>
          
          <div className="products-grid-container">
            {loading ? (
              <div className="loading">Đang tải dữ liệu...</div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      <img src={product.image} alt={product.name} />
                      <span className={`stock-badge ${product.stock <= 10 ? 'low' : ''}`}>
                        {product.stock <= 10 ? 'Sắp hết hàng' : 'Còn hàng'}
                      </span>
                    </div>
                    <div className="product-content">
                      <h3>{product.name}</h3>
                      <p className="description">{product.description}</p>
                      <div className="product-info">
                        <span className="category">{product.category}</span>
                        <span className="price">{product.price.toLocaleString()} VNĐ</span>
                      </div>
                    </div>
                    <div className="product-actions">
                      <button className="view-btn">Xem</button>
                      <button className="edit-btn">Sửa</button>
                      <button className="delete-btn">Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products
