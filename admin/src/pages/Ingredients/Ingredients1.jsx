import { useState, useEffect } from 'react'
import { Modal, Form } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import sampleData from '../../assets/data_sample_ingredient.json'
import Loading from '../../components/Loading/Loading'
import IngredientForm from '../../components/IngredientForm/IngredientForm'

const Ingredients1 = () => {
    const [ingredients, setIngredients] = useState([])
    const [loading, setLoading] = useState(true)
    const [allIngredientCategories, setAllIngredientCategories] = useState([])
    const [allMeasureUnits, setAllMeasureUnits] = useState([])

    const [isModalVisible, setIsModalVisible] = useState(false)
    const [form] = Form.useForm()

    useEffect(() => {
        // Giả lập việc lấy danh sách món ăn
        const fetchIngredients = () => {
            setLoading(true)

            // Giả lập API call bằng cách sử dụng dữ liệu từ JSON
            setTimeout(() => {
                setIngredients(sampleData.ingredients)
                setAllIngredientCategories(sampleData.ingredientCategories)
                setAllMeasureUnits(sampleData.measurementUnits)
                setLoading(false)
            }, 1000)
        }

        fetchIngredients()
    }, [])

    const getCategoryTitle = (id) => {
        const cat = allIngredientCategories.find(c => c._id === id)
        return cat ? cat.title : id
    }

    const handleCancel = () => {
        form.resetFields()
        setIsModalVisible(false)
    }

    const handleSubmit = (values) => {
        console.log('Form submitted:', values)
        const newIngredient = {
            _id: Date.now().toString(),
            nameIngredient: values.nameIngredient,
            ingredientCategory: values.ingredientCategory, // ID
            description: values.description,
            commonUses: values.commonUses || [],
            defaultAmount: values.defaultAmount,
            defaultUnit: values.defaultUnit, // Value (g/ml/…)
            ingredientImage: values.ingredientImage || "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg",
            nutrition: values.nutrition || {}
        };
        setIngredients(prev => [...prev, newIngredient]);
        handleCancel();
    }


    const showModal = () => {
        setIsModalVisible(true)
    }

    return (
        <div className="ingredients-container">
            {/* Sử dụng Loading component */}
            <Loading visible={loading} text="Đang tải dữ liệu..." />

            <div className="content-area">
                <div className="content">
                    <div className="page-header">
                        <h1>Quản lý nguyên liệu</h1>
                        <div className="action-buttons">
                            <button className="import-button">
                                <ImportOutlined /> Import File
                            </button>
                            <button className="add-button" onClick={showModal}>+ Thêm nguyên liệu</button>
                        </div>
                    </div>

                    <div className="container-filter">
                        <div className="search-bar">
                            <input type="text" placeholder="Tìm kiếm nguyên liệu..." />
                            <button>Tìm</button>
                        </div>
                        <div className="filters">
                            <select>
                                <option value="">Tất cả danh mục</option>
                                <option value="main">Rau</option>
                                <option value="soup">Thịt</option>
                                <option value="dessert">Trái cây</option>
                            </select>
                            <select>
                                <option value="">Sắp xếp theo</option>
                                <option value="name_asc">Tên (A-Z)</option>
                                <option value="name_desc">Tên (Z-A)</option>
                                <option value="time_asc">Calo (Tăng dần)</option>
                                <option value="time_desc">Calo (Giảm dần)</option>
                            </select>
                        </div>
                    </div>

                    <div className="ingredients-grid-container">
                        {loading ? (
                            <Loading visible={true} text="Đang tải nguyên liệu..." />
                        ) : (
                            <div className="ingredients-grid">
                                {ingredients.map(ingredient => (
                                    <div key={ingredient._id} className="ingredient-card">
                                        <div className="ingredient-image">
                                            <img src={ingredient.ingredientImage} alt={ingredient.nameIngredient} />
                                            <span className="category-badge">{getCategoryTitle(ingredient.ingredientCategory)}</span>
                                        </div>
                                        <div className="ingredient-content">
                                            <h3>{ingredient.nameIngredient}</h3>
                                            <p className="description">{ingredient.description}</p>
                                            <div className="ingredient-info">
                                                <div className="ingredient-commonUses-container">
                                                    {ingredient.commonUses.map((use, index) => (
                                                        <span key={index} className="ingredient-commonUse">
                                                            {use}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal thêm nguyên liệu */}
            <Modal
                title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Thêm món ăn mới</span>}
                open={isModalVisible}
                onCancel={handleCancel}
                width={1600}
                style={{
                    top: 10,
                    maxWidth: '90%',
                    margin: '0 auto'
                }}
                footer={null}
            >
                <IngredientForm
                    form={form}
                    onFinish={handleSubmit}
                    onCancel={handleCancel}
                    allIngredients={ingredients}
                    allIngredientCategories={allIngredientCategories}
                    allMeasureUnits={allMeasureUnits}
                    isEdit={false}
                />
            </Modal>

        </div>
    )
}

export default Ingredients1