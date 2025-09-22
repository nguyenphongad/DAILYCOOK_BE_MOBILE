const MealCategoryModel = require("../model/MealCategoryModel");
const MealModel = require("../model/MealModel");
// const { getIngredientById } = require("./services/ingredientService");
const { addRecipe } = require("../services/recipeService");

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

        // Kiểm tra các trường bắt buộc
        if (!nameMeal || !mealCategory || !Array.isArray(ingredients) || ingredients.length === 0 || !recipe) {
            return res.status(400).json({
                stype: "meal",
                message: "Thiếu trường bắt buộc",
                status: false
            });
        }

        // Kiểm tra xem danh mục bữa ăn có tồn tại hay không
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

        // Tạo công thức nấu ăn mới thông qua Recipe Service
        const recipeCreated = await addRecipe(recipe, token);

        // Lấy cookingEffect từ request body
        const { cookingEffect } = recipe;
        // // Lấy thông tin dinh dưỡng từ recipe
        // const nutrition = recipeCreated.data.nutrition;

        // // Tính cookingEffect dựa trên portionSize
        // const cookingEffect = {
        //     calories: nutrition.calories,
        //     protein: nutrition.protein,
        //     carbs: nutrition.carbs,
        //     fat: nutrition.fat
        // };

        // if (portionSize?.amount) {
        //     cookingEffect = {
        //         calories: nutrition.calories * portionSize.amount,
        //         protein: nutrition.protein * portionSize.amount,
        //         carbs: nutrition.carbs * portionSize.amount,
        //         fat: nutrition.fat * portionSize.amount
        //     };
        // }

        // Tạo đối tượng Meal mới
        const newMeal = new MealModel({
            nameMeal,
            description,
            mealCategory: mealCategoryExists._id,
            mealImage,
            portionSize,
            dietaryCompatibility,
            ingredients,
            // Lưu thông tin recipe_id và cookingEffect vào meal
            recipe: {
                recipe_id: recipeCreated.data._id,
                cookingEffect: cookingEffect || {} // Nếu không có, mặc định rỗng
            },
            popularity,
            isActive
        });

        // Lưu meal vào DB
        const result = await newMeal.save();
        if (result) {
            return res.status(201).json({
                stype: "meal",
                message: "Thêm bữa ăn thành công!",
                status: true,
                data: {
                    _id: result._id,
                    nameMeal: result.nameMeal,
                    description: result.description,
                    mealCategory: result.mealCategory,
                    mealImage: result.mealImage,
                    portionSize: result.portionSize,
                    dietaryCompatibility: result.dietaryCompatibility,
                    ingredients: result.ingredients,
                    recipes: result.recipe,
                    popularity: result.popularity,
                    isActive: result.isActive,
                    createAt: result.createdAt,
                    updateAt: result.updatedAt
                }
            })
        }
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

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


        // Lấy token từ header (Bearer token)
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

        // Kiểm tra xem danh mục bữa ăn có tồn tại hay không
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

        // Cập nhật các trường nếu có trong request body
        if (nameMeal) meal.nameMeal = nameMeal;
        if (description) meal.description = description;
        if (mealImage) meal.mealImage = mealImage;
        if (portionSize) meal.portionSize = portionSize;
        if (Array.isArray(dietaryCompatibility)) meal.dietaryCompatibility = dietaryCompatibility;
        if (Array.isArray(ingredients) && ingredients.length > 0) meal.ingredients = ingredients;
        if (typeof popularity === 'number') meal.popularity = popularity;
        if (typeof isActive === 'boolean') meal.isActive = isActive;

        // Cập nhật recipe nếu có
        if (recipe) {
            // Gọi dịch vụ cập nhật công thức nấu ăn (nếu cần)
            // Giả sử bạn có hàm updateRecipe trong recipeService
            // const updatedRecipe = await updateRecipe(meal.recipe.recipe_id, recipe, token);
            // meal.recipe.recipe_id = updatedRecipe.data._id;
            // meal.recipe.cookingEffect = updatedRecipe.data.nutrition; // Cập nhật thông tin dinh dưỡng mới
            const updatedRecipe = await addRecipe(recipe, token);
            meal.recipe.recipe_id = updatedRecipe.data._id;
            meal.recipe.cookingEffect = recipe.cookingEffect || {};
        }

        const updatedMeal = await meal.save();
        if (updatedMeal) {
            return res.status(200).json({
                stype: "meal",
                message: "Cập nhật bữa ăn thành công!",
                status: true,
                data: {
                    _id: updatedMeal._id,
                    nameMeal: updatedMeal.nameMeal,
                    description: updatedMeal.description,
                    mealCategory: updatedMeal.mealCategory,
                    mealImage: updatedMeal.mealImage,
                    portionSize: updatedMeal.portionSize,
                    dietaryCompatibility: updatedMeal.dietaryCompatibility,
                    ingredients: updatedMeal.ingredients,
                    recipes: updatedMeal.recipe,
                    popularity: updatedMeal.popularity,
                    isActive: updatedMeal.isActive,
                    createAt: updatedMeal.createdAt,
                    updateAt: updatedMeal.updatedAt
                }
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
}

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
            .sort({ createdAt: -1 });
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

module.exports = { addMeal, updateMeal, deleteMeal, findByIdMeal, getListMeals };
