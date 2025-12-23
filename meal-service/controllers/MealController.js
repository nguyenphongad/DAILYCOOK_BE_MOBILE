const DietTypeModel = require("../models/DietTypeModel");
const MealCategoryModel = require("../models/MealCategoryModel");
const MealModel = require("../models/MealModel");
const { getIngredientById } = require("../services/IngredientService");
// const { getIngredientById } = require("./services/ingredientService");
const { addRecipe, updateRecipe } = require("../services/RecipeService");

// Thêm mới meal
const addMeal = async (req, res) => {
    try {
        // Lấy dữ liệu từ body request
        const {
            code,
            nameMeal,
            name_en,
            description,
            image,
            total_energy,
            category_id,
            category_name,
            category_name_en,
            category_description,
            food_area_id,
            popularity, // ✅ Thêm popularity
            nutritional_components,
            ingredients,
            dish_components,
            prepTimeMinutes,
            cookTimeMinutes,
            difficulty,
            steps,
            isActive
        } = req.body;

        // Lấy token từ header (Bearer token)
        const tokenHeader = req.headers.authorization || "";
        const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.split(" ")[1] : tokenHeader;
        if (!token) {
            return res.status(401).json({
                stype: "meal",
                message: "Unauthorized: No token provided",
                status: false
            });
        }

        // Kiểm tra chi tiết các trường bắt buộc
        const missingFields = [];

        if (!nameMeal) missingFields.push("nameMeal");
        if (!category_id) missingFields.push("category_id");

        // Kiểm tra nguyên liệu (ingredients hoặc dish_components)
        if (!ingredients && !dish_components) {
            missingFields.push("ingredients hoặc dish_components");
        } else if (ingredients) {
            if (!Array.isArray(ingredients)) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Trường 'ingredients' phải là một mảng",
                    status: false
                });
            }
            // Kiểm tra ingredients từ Ingredient Service
            for (const ingredient of ingredients) {
                if (!ingredient.ingredient_id || !ingredient.quantity || !ingredient.unit) {
                    return res.status(400).json({
                        stype: "meal",
                        message: "Mỗi ingredient cần có ingredient_id, quantity và unit",
                        status: false
                    });
                }
                // Kiểm tra ingredient tồn tại
                try {
                    const ingredientExists = await getIngredientById(ingredient.ingredient_id, token);
                    if (!ingredientExists) {
                        return res.status(400).json({
                            stype: "meal",
                            message: `Nguyên liệu ${ingredient.ingredient_id} không tồn tại`,
                            status: false
                        });
                    }
                } catch (error) {
                    return res.status(400).json({
                        stype: "meal",
                        message: "Lỗi khi kiểm tra nguyên liệu",
                        status: false,
                        error: error.message
                    });
                }
            }
        }

        // Kiểm tra các bước nấu (nếu có)
        if (steps && Array.isArray(steps)) {
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                if (!step.title || !step.description) {
                    return res.status(400).json({
                        stype: "meal",
                        message: `Bước ${i + 1} thiếu title hoặc description`,
                        status: false
                    });
                }
            }
        }

        // Nếu có trường bắt buộc bị thiếu
        if (missingFields.length > 0) {
            return res.status(400).json({
                stype: "meal",
                message: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
                status: false
            });
        }

        // Validate popularity nếu có
        if (popularity !== undefined) {
            if (popularity < 1 || popularity > 5) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Popularity phải từ 1 đến 5",
                    status: false
                });
            }
        }

        const newMeal = new MealModel({
            code,
            nameMeal,
            name_en,
            description,
            image,
            total_energy,
            category_id,
            category_name,
            category_name_en,
            category_description,
            food_area_id,
            popularity: popularity || 1, // ✅ Mặc định là 1 nếu không có
            nutritional_components,
            ingredients: ingredients || [],
            dish_components: dish_components || [],
            prepTimeMinutes,
            cookTimeMinutes,
            difficulty,
            steps: steps || [],
            isActive: isActive !== undefined ? isActive : true
        });

        const result = await newMeal.save();
        return res.status(201).json({
            stype: "meal",
            message: "Thêm món ăn thành công!",
            status: true,
            data: result
        });

    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
};

// update meal
const updateMeal = async (req, res) => {
    try {
        const { meal_id } = req.params;
        const {
            code,
            nameMeal,
            name_en,
            description,
            image,
            total_energy,
            category_id,
            category_name,
            category_name_en,
            category_description,
            food_area_id,
            popularity,
            nutritional_components,
            ingredients,
            dish_components,
            prepTimeMinutes,
            cookTimeMinutes,
            difficulty,
            steps,
            isActive
        } = req.body;

        // Lấy token từ header
        const tokenHeader = req.headers.authorization || "";
        const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.split(" ")[1] : tokenHeader;
        if (!token) {
            return res.status(401).json({
                stype: "meal",
                message: "Unauthorized: No token provided",
                status: false
            });
        }

        const meal = await MealModel.findById(meal_id);
        if (!meal) {
            return res.status(404).json({
                stype: "meal",
                message: "Món ăn không tồn tại",
                status: false
            });
        }

        // ============= KHAI BÁO updateFields TRƯỚC KHI SỬ DỤNG =============
        const updateFields = {};

        // Validate popularity nếu có
        if (popularity !== undefined) {
            if (popularity < 1 || popularity > 5) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Popularity phải từ 1 đến 5",
                    status: false
                });
            }
            updateFields.popularity = popularity;
        }

        // Gom các field cần update
        if (code !== undefined) updateFields.code = code;
        if (nameMeal) updateFields.nameMeal = nameMeal;
        if (name_en !== undefined) updateFields.name_en = name_en;
        if (description !== undefined) updateFields.description = description;
        if (image !== undefined) updateFields.image = image;
        if (total_energy !== undefined) updateFields.total_energy = total_energy;
        if (category_id) updateFields.category_id = category_id;
        if (category_name !== undefined) updateFields.category_name = category_name;
        if (category_name_en !== undefined) updateFields.category_name_en = category_name_en;
        if (category_description !== undefined) updateFields.category_description = category_description;
        if (food_area_id !== undefined) updateFields.food_area_id = food_area_id;
        if (Array.isArray(nutritional_components)) updateFields.nutritional_components = nutritional_components;
        
        // Xử lý ingredients
        if (Array.isArray(ingredients)) {
            updateFields.ingredients = ingredients.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity: item.quantity,
                unit: item.unit
            }));
        }
        
        if (Array.isArray(dish_components)) updateFields.dish_components = dish_components;
        if (prepTimeMinutes !== undefined) updateFields.prepTimeMinutes = prepTimeMinutes;
        if (cookTimeMinutes !== undefined) updateFields.cookTimeMinutes = cookTimeMinutes;
        if (difficulty !== undefined) updateFields.difficulty = difficulty;
        if (Array.isArray(steps)) updateFields.steps = steps;
        if (typeof isActive === 'boolean') updateFields.isActive = isActive;

        // Kiểm tra xem có trường nào được cập nhật không
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                stype: "meal",
                message: "Không có trường nào để cập nhật!",
                status: false
            });
        }

        // Thực hiện cập nhật
        const updatedMeal = await MealModel.findByIdAndUpdate(
            meal_id,
            updateFields,
            { new: true }
        );
        
        if (updatedMeal) {
            return res.status(200).json({
                stype: "meal",
                message: "Cập nhật món ăn thành công!",
                status: true,
                data: updatedMeal
            });
        }
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
};

// delete meal
const deleteMeal = async (req, res) => {
    try {
        const { meal_id } = req.params;
        const meal = await MealModel.findById(meal_id);
        if (!meal) {
            return res.status(404).json({
                stype: "meal",
                message: "Món ăn không tồn tại",
                status: false
            });
        }
        await MealModel.findByIdAndDelete(meal_id);
        return res.status(200).json({
            stype: "meal",
            message: "Xóa bữa ăn thành công!",
            status: true
        });
    }
    catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

const findByIdMeal = async (req, res) => {
    try {
        const { meal_id } = req.params;

        // Lấy token từ header
        const tokenHeader = req.headers.authorization || "";
        const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.split(" ")[1] : tokenHeader;

        const meal = await MealModel.findById(meal_id);

        if (!meal) {
            return res.status(404).json({
                stype: "meal",
                message: "Món ăn không tồn tại",
                status: false
            });
        }

        // Chuyển đổi meal sang plain object
        const mealObject = meal.toObject();

        // Lấy chi tiết từng ingredient nếu có token
        if (token && mealObject.ingredients && mealObject.ingredients.length > 0) {
            const ingredientsWithDetails = [];

            for (const ingredient of mealObject.ingredients) {
                try {
                    // Gọi service lấy chi tiết ingredient
                    const ingredientDetail = await getIngredientById(ingredient.ingredient_id, token);

                    if (ingredientDetail && ingredientDetail.data) {
                        ingredientsWithDetails.push({
                            ingredient_id: ingredient.ingredient_id,
                            quantity: ingredient.quantity,
                            unit: ingredient.unit,
                            // Thêm chi tiết đầy đủ của ingredient
                            detail: {
                                _id: ingredientDetail.data._id,
                                nameIngredient: ingredientDetail.data.nameIngredient,
                                name_en: ingredientDetail.data.name_en,
                                description: ingredientDetail.data.description,
                                ingredientImage: ingredientDetail.data.ingredientImage,
                                ingredientCategory: ingredientDetail.data.ingredientCategory,
                                energy: ingredientDetail.data.energy,
                                nutrition: ingredientDetail.data.nutrition
                            }
                        });
                    } else {
                        ingredientsWithDetails.push({
                            ingredient_id: ingredient.ingredient_id,
                            quantity: ingredient.quantity,
                            unit: ingredient.unit,
                            detail: null
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching ingredient ${ingredient.ingredient_id}:`, error.message);
                    ingredientsWithDetails.push({
                        ingredient_id: ingredient.ingredient_id,
                        quantity: ingredient.quantity,
                        unit: ingredient.unit,
                        detail: null
                    });
                }
            }

            // Thay thế ingredients cũ bằng ingredients có chi tiết
            mealObject.ingredients = ingredientsWithDetails;
        }

        return res.status(200).json({
            stype: "meal",
            message: "Lấy thông tin món ăn thành công!",
            status: true,
            data: mealObject
        });
    }
    catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

const getListMeals = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const total = await MealModel.countDocuments();
        const meals = await MealModel.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1, _id: -1 }); // Thêm _id để sắp xếp ổn định
        return res.status(200).json({
            stype: "meal",
            message: "Lấy danh sách món ăn thành công!",
            status: true,
            data: {
                total,
                page,
                limit,
                meals
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

// Lấy tổng số món ăn - truy vấn tối ưu
const getTotalMeals = async (req, res) => {
    try {
        // Đếm tổng số món ăn
        const totalMeals = await MealModel.countDocuments();

        // Lấy 5 món ăn mới nhất
        const recentMeals = await MealModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('nameMeal image createdAt popularity');

        const result = {
            totalMeals: totalMeals,
            exactCount: totalMeals,
            recentMeals: recentMeals
        };

        res.status(200).json({
            stype: "meal",
            message: "Lấy tổng số món ăn thành công!",
            status: true,
            data: result
        });

    } catch (error) {
        console.error("Get total meals error:", error);
        res.status(500).json({
            stype: "meal",
            message: "Lỗi server khi lấy tổng số món ăn",
            status: false,
            error: error.message
        });
    }
};

// Lấy danh sách món ăn theo danh mục với phân trang
const getMealsByCategory = async (req, res) => {
    try {
        const { meal_category_id } = req.params;
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        // Kiểm tra danh mục tồn tại
        const categoryExists = await MealCategoryModel.findById(meal_category_id);
        if (!categoryExists) {
            return res.status(404).json({
                stype: "meal",
                message: "Danh mục bữa ăn không tồn tại",
                status: false
            });
        }

        const skip = (page - 1) * limit;

        // ✅ FIX: Tìm theo category_id thay vì mealCategory
        const total = await MealModel.countDocuments({ category_id: meal_category_id });

        // ✅ FIX: Lấy danh sách món ăn theo category_id
        const meals = await MealModel.find({ category_id: meal_category_id })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1, _id: -1 });

        return res.status(200).json({
            stype: "meal",
            message: "Lấy danh sách món ăn theo danh mục thành công!",
            status: true,
            data: {
                category: categoryExists,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                meals
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
};

// Lấy danh sách món ăn RANDOM (cho trang đề xuất/khám phá)
const getRandomMeals = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        
        // Đếm tổng số món ăn
        const total = await MealModel.countDocuments();
        
        // Sử dụng MongoDB aggregation để random
        const meals = await MealModel.aggregate([
            { $sample: { size: limit } }, // Random lấy 'limit' documents
            {
                $lookup: {
                    from: 'mealcategories', // Tên collection category
                    localField: 'mealCategory',
                    foreignField: '_id',
                    as: 'categoryDetail'
                }
            },
            {
                $unwind: {
                    path: '$categoryDetail',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'diettypes', // Tên collection diet type
                    localField: 'dietaryCompatibility',
                    foreignField: '_id',
                    as: 'dietDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    nameMeal: 1,
                    description: 1,
                    image: 1,
                    mealCategory: 1,
                    'categoryDetail.title': 1,
                    'categoryDetail.keyword': 1,
                    portionSize: 1,
                    dietaryCompatibility: 1,
                    dietDetails: {
                        _id: 1,
                        title: 1,
                        keyword: 1
                    },
                    ingredients: 1,
                    recipe: 1,
                    popularity: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        return res.status(200).json({
            stype: "meal",
            message: "Lấy danh sách món ăn random thành công!",
            status: true,
            data: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                meals,
                note: "Mỗi lần gọi API sẽ trả về món ăn khác nhau (random)"
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lấy danh sách món ăn random thất bại!",
            status: false,
            error: error.message
        });
    }
};

// Lấy danh sách món ăn random theo category
const getRandomMealsByCategory = async (req, res) => {
    try {
        const { meal_category_id } = req.params;
        let { limit = 10 } = req.query;
        limit = parseInt(limit);

        // Kiểm tra category tồn tại
        const categoryExists = await MealCategoryModel.findById(meal_category_id);
        if (!categoryExists) {
            return res.status(404).json({
                stype: "meal",
                message: "Danh mục món ăn không tồn tại",
                status: false
            });
        }

        const totalInCategory = await MealModel.countDocuments({ 
            mealCategory: meal_category_id 
        });

        if (totalInCategory === 0) {
            return res.status(404).json({
                stype: "meal",
                message: "Không tìm thấy món ăn nào trong danh mục này",
                status: false
            });
        }

        // Random món ăn trong category
        const meals = await MealModel.aggregate([
            { $match: { mealCategory: mongoose.Types.ObjectId(meal_category_id) } },
            { $sample: { size: Math.min(limit, totalInCategory) } },
            {
                $lookup: {
                    from: 'mealcategories',
                    localField: 'mealCategory',
                    foreignField: '_id',
                    as: 'categoryDetail'
                }
            },
            {
                $unwind: {
                    path: '$categoryDetail',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'diettypes',
                    localField: 'dietaryCompatibility',
                    foreignField: '_id',
                    as: 'dietDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    nameMeal: 1,
                    description: 1,
                    image: 1,
                    categoryDetail: 1,
                    portionSize: 1,
                    dietDetails: 1,
                    ingredients: 1,
                    recipe: 1,
                    popularity: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        return res.status(200).json({
            stype: "meal",
            message: "Lấy món ăn random theo danh mục thành công!",
            status: true,
            data: {
                category: categoryExists,
                total: totalInCategory,
                limit,
                meals,
                note: "Mỗi lần gọi API sẽ trả về món ăn khác nhau (random)"
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lấy món ăn random theo danh mục thất bại!",
            status: false,
            error: error.message
        });
    }
};

module.exports = { 
    addMeal, 
    updateMeal, 
    deleteMeal, 
    findByIdMeal, 
    getListMeals, 
    getTotalMeals, 
    getMealsByCategory,
    getRandomMeals, // ✅ Export API mới
    getRandomMealsByCategory // ✅ Export API mới
};
