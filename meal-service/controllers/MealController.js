const DietTypeModel = require("../model/DietTypeModel");
const MealCategoryModel = require("../model/MealCategoryModel");
const MealModel = require("../model/MealModel");
const { getIngredientById } = require("../services/IngredientService");
// const { getIngredientById } = require("./services/ingredientService");
const { addRecipe, updateRecipe } = require("../services/recipeService");

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
            popularity: popularity || 1, // Mặc định là 1 nếu không có
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

        // Cập nhật recipe nếu có thay đổi
        if (recipe && meal.recipe && meal.recipe.recipe_id) {
            await updateRecipe(meal.recipe.recipe_id, recipe, token);
            updateFields.recipe = {
                recipe_id: meal.recipe.recipe_id,
                cookingEffect: recipe.cookingEffect || meal.recipe.cookingEffect
            };
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
                message: "Cập nhật bữa ăn thành công!",
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
        const meal = await MealModel.findById(meal_id)
        if (!meal) {
            return res.status(404).json({
                stype: "meal",
                message: "Món ăn không tồn tại",
                status: false
            });
        }
        return res.status(200).json({
            stype: "meal",
            message: "Lấy thông tin món ăn thành công!",
            status: true,
            data: meal
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

module.exports = { addMeal, updateMeal, deleteMeal, findByIdMeal, getListMeals, getTotalMeals };
