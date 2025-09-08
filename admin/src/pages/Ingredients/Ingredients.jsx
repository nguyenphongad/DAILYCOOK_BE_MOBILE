import { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Giả lập việc lấy danh sách thành phần
    const fetchIngredients = () => {
      setLoading(true)

      // Giả lập API call
      setTimeout(() => {
        const mockIngredients = [
          { id: 1, name: 'Thịt gà', category: 'Thịt', unit: 'gram', nutrition: 'Protein cao, ít chất béo', price: 65000 },
          { id: 2, name: 'Thịt bò', category: 'Thịt', unit: 'gram', nutrition: 'Giàu sắt, protein', price: 120000 },
          { id: 3, name: 'Cà rốt', category: 'Rau củ', unit: 'cái', nutrition: 'Vitamin A, chất xơ', price: 10000 },
          { id: 4, name: 'Cà chua', category: 'Rau củ', unit: 'quả', nutrition: 'Vitamin C, lycopene', price: 15000 },
          { id: 5, name: 'Tỏi', category: 'Gia vị', unit: 'củ', nutrition: 'Allicin, chống oxy hóa', price: 5000 },
          { id: 6, name: 'Đường', category: 'Gia vị', unit: 'gram', nutrition: 'Carbohydrate', price: 20000 },
          { id: 7, name: 'Muối', category: 'Gia vị', unit: 'gram', nutrition: 'Natri', price: 10000 },
          { id: 8, name: 'Gạo', category: 'Ngũ cốc', unit: 'kg', nutrition: 'Carbohydrate', price: 25000 },
          { id: 9, name: 'Trứng gà', category: 'Khác', unit: 'quả', nutrition: 'Protein, vitamin D', price: 3000 },
          { id: 10, name: 'Sữa tươi', category: 'Khác', unit: 'ml', nutrition: 'Canxi, protein', price: 30000 },
        ]
        setIngredients(mockIngredients)
        setLoading(false)
      }, 1000)
    }

    fetchIngredients()
  }, [])

  return (
    <div className="ingredients-container">
      <div className="content-area">
        <div className="content">
          <div className="page-header">
            <h1>Quản lý thành phần</h1>
            <button className="add-button">+ Thêm thành phần</button>
          </div>

          <div className="ingredients-filter">
            <div className="search-bar">
              <input type="text" placeholder="Tìm kiếm thành phần..." />
              <button>Tìm</button>
            </div>
            <div className="filters">
              <select>
                <option value="">Tất cả danh mục</option>
                <option value="meat">Thịt</option>
                <option value="vegetables">Rau củ</option>
                <option value="spices">Gia vị</option>
                <option value="cereals">Ngũ cốc</option>
                <option value="other">Khác</option>
              </select>
              <select>
                <option value="">Sắp xếp theo</option>
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
                <option value="time_asc">Thời gian nấu (Tăng dần)</option>
                <option value="time_desc">Thời gian nấu (Giảm dần)</option>
              </select>
            </div>
          </div>

          <div className="ingredients-table-container">
            {loading ? (
              <div className="loading">Đang tải dữ liệu...</div>
            ) : (
              <table className="ingredients-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Danh mục</th>
                    <th>Đơn vị</th>
                    <th>Dinh dưỡng</th>
                    <th>Giá (VNĐ)</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(ingredient => (
                    <tr key={ingredient.id}>
                      <td>{ingredient.id}</td>
                      <td>{ingredient.name}</td>
                      <td>
                        <span className={`category-badge ${ingredient.category.toLowerCase().replace(' ', '-')}`}>
                          {ingredient.category}
                        </span>
                      </td>
                      <td>{ingredient.unit}</td>
                      <td>{ingredient.nutrition}</td>
                      <td>{ingredient.price.toLocaleString()}</td>
                      <td className="btn-actions">
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

export default Ingredients
