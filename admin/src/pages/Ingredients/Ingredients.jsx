import { Modal } from "antd"
import { useState, useEffect } from "react"

// Enum chuyển sang object thường (JS)
const IngredientType = {
  VEGETABLES: "Rau củ",
  FRUITS: "Trái cây",
  MEAT: "Thịt",
  SEAFOOD: "Hải sản",
  DAIRY: "Sữa & chế phẩm",
  EGGS: "Trứng",
  GRAINS: "Ngũ cốc",
  LEGUMES: "Đậu",
  NUTS_AND_SEEDS: "Các loại hạt",
  HERBS_AND_SPICES: "Thảo mộc & Gia vị",
  OILS_AND_FATS: "Dầu, mỡ, bơ",
  BEVERAGES: "Đồ uống",
  BEVERAGES: "Đồ ăn vặt",
  SWEETS_AND_DESSERTS: "Kẹo & tráng miệng",
  BAKERY: "Bánh mì, bánh ngọt",
  CONDIMENTS: "Gia vị / Nước chấm",
  FROZEN_FOODS: "Đông lạnh",
  PREPARED_FOODS: "Chế biến sẵn",
  OTHER: "Khác",
}

const MeasurementUnits = {
  GRAM: "g",            // Gram
  KILOGRAM: "kg",       // Kilogram
  MILLILITER: "ml",     // Mililít
  LITER: "l",           // Lít
  TEASPOON: "thìa cà phê",      // Thìa cà phê
  TABLESPOON: "thìa canh",   // Thìa canh
  CUP: "cốc",           // Cốc
  PIECE: "cái",         // Cái/miếng chung
  FRUIT: "trái",        // Trái (dùng cho trái cây, quả)
  ROOT: "củ",           // Củ (củ hành, củ khoai…)
  SLICE: "lát",         // Lát
  BUNCH: "bó",          // Bó
  CLOVE: "tép",         // Tép (tỏi)
  PINCH: "nhúm",        // Nhúm
}

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [sortBy, setSortBy] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    description: "",
    category: "",
    defaultAmount: "",
    defaultUnit: "",
    nutrition: { calories: "", protein: "", carbs: "", fat: "" },
    commonUses: [],
  })

  useEffect(() => {
    const fetchIngredients = () => {
      setLoading(true)
      setTimeout(() => {
        const mockIngredients = [
          {
            _id: "1",
            name: "Thịt gà",
            description: "Thịt gà tươi, ít chất béo",
            category: IngredientType.MEAT,
            defaultAmount: 100,
            defaultUnit: MeasurementUnits.GRAM,
            nutrition: { calories: 239, protein: 27, carbs: 0, fat: 14 },
            commonUses: ["Xào", "Luộc", "Nướng"],
          },
          {
            _id: "2",
            name: "Cà rốt",
            description: "Rau củ giàu vitamin A",
            category: IngredientType.VEGETABLES,
            defaultAmount: 1,
            defaultUnit: MeasurementUnits.ROOT,
            nutrition: { calories: 41, protein: 1, carbs: 10, fat: 0 },
            commonUses: ["Xào", "Canh", "Salad"],
          },
          {
            _id: "3",
            name: "Sữa tươi",
            description: "Đồ uống giàu canxi",
            category: IngredientType.DAIRY,
            defaultAmount: 100,
            defaultUnit: MeasurementUnits.MILLILITER,
            nutrition: { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
            commonUses: ["Uống", "Pha chế", "Làm bánh"],
          },
          {
            _id: "4",
            name: "Cá hồi",
            description: "Cá hồi tươi, giàu omega-3",
            category: IngredientType.SEAFOOD,
            defaultAmount: 100,
            defaultUnit: MeasurementUnits.GRAM,
            nutrition: { calories: 208, protein: 20, carbs: 0, fat: 13 },
            commonUses: ["Nướng", "Sashimi", "Chiên"],
          },
          {
            _id: "5",
            name: "Táo",
            description: "Trái cây giàu chất xơ và vitamin C",
            category: IngredientType.FRUITS,
            defaultAmount: 1,
            defaultUnit: MeasurementUnits.FRUIT,
            nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
            commonUses: ["Ăn tươi", "Làm bánh", "Nước ép"],
          }
        ]
        setIngredients(mockIngredients)
        setLoading(false)
      }, 1000)
    }

    fetchIngredients()
  }, [])

  // Xử lý lọc + tìm kiếm + sắp xếp
  const filteredIngredients = ingredients
    .filter((ing) =>
      ing.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((ing) =>
      categoryFilter ? ing.category === categoryFilter : true
    )
    .sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name)
      if (sortBy === "name_desc") return b.name.localeCompare(a.name)
      if (sortBy === "calo_asc") return a.nutrition.calories - b.nutrition.calories
      if (sortBy === "calo_desc") return b.nutrition.calories - a.nutrition.calories
      return 0
    })

  return (
    <div className="ingredients-container">
      <div className="content-area">
        <div className="content">
          <div className="page-header">
            <h1>Quản lý thành phần</h1>
            <button className="add-button" onClick={() => setShowAddModal(true)}>
              + Thêm thành phần
            </button>
          </div>

          <div className="ingredients-filter">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Tìm kiếm thành phần..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filters">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {Object.entries(IngredientType).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">Sắp xếp theo</option>
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
                <option value="calo_asc">Calo (Thấp → Cao)</option>
                <option value="calo_desc">Calo (Cao → Thấp)</option>
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
                    <th>Dinh dưỡng (100g)</th>
                    <th>Công dụng</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.map((ingredient) => (
                    <tr key={ingredient._id}>
                      <td>{ingredient._id}</td>
                      <td>{ingredient.name}</td>
                      <td>{ingredient.category}</td>
                      <td>
                        {ingredient.defaultAmount} {ingredient.defaultUnit}
                      </td>
                      <td>
                        Calo: {ingredient.nutrition.calories} <br />
                        Protein: {ingredient.nutrition.protein}g <br />
                        Carbs: {ingredient.nutrition.carbs}g <br />
                        Fat {ingredient.nutrition.fat}g
                      </td>
                      <td>
                        {ingredient.commonUses?.length > 0
                          ? ingredient.commonUses.join(", ")
                          : "Không có"}
                      </td>
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

      {showAddModal && (
        <Modal
          title="Thêm thành phần mới"
          open={showAddModal}
          onCancel={() => setShowAddModal(false)}
          footer={null}
          width={700}
        >
          <div className="add-ingredient-form">
            <div className="form-group">
              <label>Tên thành phần</label>
              <input
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                placeholder="Nhập tên thành phần"
              />
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={newIngredient.description}
                onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
                placeholder="Nhập mô tả"
              />
            </div>
            <div className="form-group">
              <label>Danh mục</label>
              <select
                value={newIngredient.category}
                onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
              >
                <option value="">Chọn danh mục</option>
                {Object.entries(IngredientType).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Số lượng mặc định</label>
              <input
                type="number"
                value={newIngredient.defaultAmount}
                onChange={(e) => setNewIngredient({ ...newIngredient, defaultAmount: e.target.value })}
                placeholder="Nhập số lượng"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Đơn vị đo</label>
              <select
                value={newIngredient.defaultUnit}
                onChange={(e) => setNewIngredient({ ...newIngredient, defaultUnit: e.target.value })}
              >
                <option value="">Chọn đơn vị</option>
                {Object.entries(MeasurementUnits).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Dinh dưỡng (trên 100g)</label>
              <input
                type="number"
                value={newIngredient.nutrition.calories}
                onChange={(e) =>
                  setNewIngredient({
                    ...newIngredient,
                    nutrition: { ...newIngredient.nutrition, calories: e.target.value },
                  })
                }
                placeholder="Calo"
                min="0"
              />
              <input
                type="number"
                value={newIngredient.nutrition.protein}
                onChange={(e) =>
                  setNewIngredient({
                    ...newIngredient,
                    nutrition: { ...newIngredient.nutrition, protein: e.target.value },
                  })
                }
                placeholder="Protein (g)"
                min="0"
              />
              <input
                type="number"
                value={newIngredient.nutrition.carbs}
                onChange={(e) =>
                  setNewIngredient({
                    ...newIngredient,
                    nutrition: { ...newIngredient.nutrition, carbs: e.target.value },
                  })
                }
                placeholder="Carbs (g)"
                min="0"
              />
              <input
                type="number"
                value={newIngredient.nutrition.fat}
                onChange={(e) =>
                  setNewIngredient({
                    ...newIngredient,
                    nutrition: { ...newIngredient.nutrition, fat: e.target.value },
                  })
                }
                placeholder="Fat (g)"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Công dụng phổ biến</label>
              <input
                type="text"
                value={newIngredient.commonUses.join(", ")}
                onChange={(e) =>
                  setNewIngredient({ ...newIngredient, commonUses: e.target.value.split(",").map(s => s.trim()) })
                }
                placeholder="Nhập các công dụng, cách nhau bằng dấu phẩy"
              />
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Hủy
              </button>
              <button className="save-btn">
                Lưu
              </button>
            </div>
          </div>
        </Modal>
      )}


    </div>
  )
}

export default Ingredients
