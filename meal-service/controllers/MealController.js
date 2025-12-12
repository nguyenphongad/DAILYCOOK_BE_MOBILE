const DietTypeModel = require("../model/DietTypeModel");
const MealCategoryModel = require("../model/MealCategoryModel");
const MealModel = require("../model/MealModel");
const { getIngredientById } = require("../services/IngredientService");
// const { getIngredientById } = require("./services/ingredientService");
const { addRecipe, updateRecipe } = require("../services/RecipeService");

// Thêm mới meal
const addMeal = async (req, res) => {
    try {
        // Lấy dữ liệu từ body request
        const {
            nameMeal,
            description,
            mealCategory,
            mealImage,
            portionSize,
            dietaryCompatibility,
            ingredients,
            recipe,
            popularity,
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

        // Kiểm tra chi tiết các trường bắt buộc và trả về thông báo cụ thể
        const missingFields = [];

        if (!nameMeal) missingFields.push("nameMeal");
        if (!mealCategory) missingFields.push("mealCategory");

        // Kiểm tra nguyên liệu
        if (!ingredients) {
            missingFields.push("ingredients");
        } else if (!Array.isArray(ingredients)) {
            return res.status(400).json({
                stype: "meal",
                message: "Trường 'ingredients' phải là một mảng",
                status: false
            });
        } else if (ingredients.length === 0) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh sách nguyên liệu không thể để trống",
                status: false
            });
        }

        // Kiểm tra công thức
        if (!recipe) {
            missingFields.push("recipe");
        } else {
            if (!recipe.steps || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Công thức phải chứa ít nhất một bước (recipe.steps)",
                    status: false
                });
            }

            // Kiểm tra các bước trong công thức
            for (let i = 0; i < recipe.steps.length; i++) {
                const step = recipe.steps[i];
                if (!step.title || !step.description) {
                    return res.status(400).json({
                        stype: "meal",
                        message: `Bước ${i + 1} trong công thức thiếu title hoặc description`,
                        status: false
                    });
                }
            }
        }

        // Nếu có trường bắt buộc bị thiếu, trả về thông báo lỗi với danh sách các trường
        if (missingFields.length > 0) {
            return res.status(400).json({
                stype: "meal",
                message: `Thiếu các trường bắt buộc : ${missingFields.join(', ')}`,
                status: false
            });
        }

        // Kiểm tra danh mục bữa ăn
        const mealCategoryExists = await MealCategoryModel.findOne({
            $or: [
                { keyword: { $regex: new RegExp(`^${mealCategory}$`, 'i') } },
                { title: { $regex: new RegExp(`^${mealCategory}$`, 'i') } }
            ]
        });
        if (!mealCategoryExists) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh mục bữa ăn không tồn tại",
                status: false
            });
        }

        // Kiểm tra chế độ ăn uống
        let dietTypeIds = [];
        for (const diet of dietaryCompatibility) {
            const dietTypeExists = await DietTypeModel.findOne({
                $or: [
                    { keyword: { $regex: new RegExp(`^${diet}$`, 'i') } },
                    { title: { $regex: new RegExp(`^${diet}$`, 'i') } }
                ]
            });
            if (!dietTypeExists) {
                return res.status(400).json({
                    stype: "meal",
                    message: `Chế độ ăn uống '${diet}' không tồn tại`,
                    status: false
                });
            }
            dietTypeIds.push(dietTypeExists._id);
        }

        // Kiểm tra nguyên liệu
        for (const ingredient of ingredients) {
            let ingredientExists = null;
            try {
                ingredientExists = await getIngredientById(ingredient.ingredient_id, token);
                if (!ingredientExists) {
                    return res.status(400).json({
                        stype: "meal",
                        message: "Nguyên liệu không tồn tại",
                        status: false,
                        error: error.message
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

        const recipeCreated = await addRecipe(recipe, token);

        // Lấy cookingEffect từ request body
        const { cookingEffect } = recipe;

        // Kiểm tra popularity
        if (popularity !== undefined) {
            if (!Number.isInteger(popularity) || popularity < 1 || popularity > 5) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Độ phổ biến phải là số nguyên từ 1 đến 5",
                    status: false
                });
            }
        }

        const newMeal = new MealModel({
            nameMeal,
            description,
            mealCategory: mealCategoryExists._id,
            mealImage,
            portionSize,
            dietaryCompatibility: dietTypeIds,
            ingredients: ingredients.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity: item.quantity || 0,
                unit: item.unit || ""
            })),
            recipe: {
                recipe_id: recipeCreated?.data?._id || null,
                cookingEffect: cookingEffect || {}
            },
            popularity: popularity || 1,
            isActive
        });

        const result = await newMeal.save();
        return res.status(201).json({
            stype: "meal",
            message: "Thêm bữa ăn thành công!",
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
            nameMeal,
            description,
            mealCategory,
            mealImage,
            portionSize,
            dietaryCompatibility,
            ingredients,
            recipe,
            popularity,
            isActive
        } = req.body;

        // Lấy token từ header
        const tokenHeader = req.headers.authorization || "";
        const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.split(" ")[1] : tokenHeader;
        if (!token) {
            return res.status(401).json({
                stype: "meal",
                message: "Unauthorized : No token provided",
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

        // Kiểm tra mealCategory
        if (mealCategory) {
            const mealCategoryExists = await MealCategoryModel.findOne({
                $or: [
                    { keyword: { $regex: new RegExp(`^${mealCategory}$`, 'i') } },
                    { title: { $regex: new RegExp(`^${mealCategory}$`, 'i') } }
                ]
            });
            if (!mealCategoryExists) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Danh mục bữa ăn không tồn tại",
                    status: false
                });
            }
            meal.mealCategory = mealCategoryExists._id;
        }

        // Kiểm tra popularity nếu có trong request
        if (popularity !== undefined) {
            if (!Number.isInteger(popularity) || popularity < 1 || popularity > 5) {
                return res.status(400).json({
                    stype: "meal",
                    message: "Độ phổ biến phải là số nguyên từ 1 đến 5",
                    status: false
                });
            }
        }

        // Gom field cần update
        const updateFields = {};
        if (nameMeal) updateFields.nameMeal = nameMeal;
        if (description) updateFields.description = description;
        if (mealImage) updateFields.mealImage = mealImage;
        if (portionSize) updateFields.portionSize = portionSize;
        if (Array.isArray(dietaryCompatibility)) updateFields.dietaryCompatibility = dietaryCompatibility;

        // Xử lý ingredients
        if (Array.isArray(ingredients)) {
            updateFields.ingredients = ingredients.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity: item.quantity || 0,
                unit: item.unit || ""
            }));
        }

        if (typeof popularity === 'number') updateFields.popularity = popularity;
        if (typeof isActive === 'boolean') updateFields.isActive = isActive;

        // Cập nhật recipe nếu có thay đổi - CHỈ UPDATE NẾU THÀNH CÔNG
        let recipeUpdateSuccess = false;
        if (recipe && meal.recipe && meal.recipe.recipe_id) {
            try {
                console.log("=== UPDATE RECIPE ATTEMPT ===");
                console.log("Recipe ID:", meal.recipe.recipe_id);
                console.log("Recipe Data:", JSON.stringify(recipe, null, 2));
                
                const result = await updateRecipe(meal.recipe.recipe_id.toString(), recipe, token);

                console.log("=== UPDATE RECIPE SUCCESS ===");
                console.log("Result:", result);

                // Chỉ cập nhật recipe field nếu update thành công
                if (result && result.status === 'success') {
                    updateFields.recipe = {
                        recipe_id: meal.recipe.recipe_id,
                        cookingEffect: recipe.cookingEffect || meal.recipe.cookingEffect
                    };
                    recipeUpdateSuccess = true;
                }
            } catch (recipeError) {
                console.log("=== UPDATE RECIPE FAILED ===");
                console.log("Error message:", recipeError.message);
                console.log("Error details:", recipeError.response?.data);
                
                // KHÔNG cập nhật meal nếu recipe update fail
                return res.status(500).json({
                    stype: "meal",
                    message: "Không thể cập nhật công thức. Vui lòng kiểm tra Recipe Service.",
                    status: false,
                    error: recipeError.message,
                    details: recipeError.response?.data || "Recipe service không phản hồi"
                });
            }
        }

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
                message: recipeUpdateSuccess 
                    ? "Cập nhật bữa ăn và công thức thành công!" 
                    : "Cập nhật bữa ăn thành công!",
                status: true,
                data: updatedMeal
            });
        }
    } catch (error) {
        console.log("=== UPDATE MEAL FAILED ===");
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);

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

        const meal = await MealModel.findById(meal_id)
            .populate('mealCategory', 'keyword title description')
            .populate('dietaryCompatibility', 'keyword title description');

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
                                description: ingredientDetail.data.description,
                                ingredientImage: ingredientDetail.data.ingredientImage,
                                ingredientCategory: ingredientDetail.data.ingredientCategory,
                                nutrition: ingredientDetail.data.nutrition,
                                allergenInfo: ingredientDetail.data.allergenInfo,
                                storageInstructions: ingredientDetail.data.storageInstructions,
                                shelfLife: ingredientDetail.data.shelfLife
                            }
                        });
                    } else {
                        // Nếu không lấy được detail, giữ nguyên info cơ bản
                        ingredientsWithDetails.push({
                            ingredient_id: ingredient.ingredient_id,
                            quantity: ingredient.quantity,
                            unit: ingredient.unit,
                            detail: null
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching ingredient ${ingredient.ingredient_id}:`, error.message);
                    // Nếu có lỗi, vẫn giữ info cơ bản
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
            .select('nameMeal mealImage createdAt popularity');

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

        // Đếm tổng số món ăn trong danh mục
        const total = await MealModel.countDocuments({ mealCategory: meal_category_id });

        // Lấy danh sách món ăn theo danh mục
        const meals = await MealModel.find({ mealCategory: meal_category_id })
            .populate('mealCategory', 'keyword title')
            .populate('dietaryCompatibility', 'keyword title')
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
                    mealImage: 1,
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
                    mealImage: 1,
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
