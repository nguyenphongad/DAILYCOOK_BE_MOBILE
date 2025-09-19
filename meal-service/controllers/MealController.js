const MealCategoryModel = require("../model/MealCategoryModel");
const Meal = require("../models/Meal");
// const { getIngredientById } = require("./services/ingredientService");
const { addRecipe } = require("./services/recipeService");

const addMeal = async (req, res) => {
    try {
        const { nameMeal, description, mealCategory, mealImage, portionSize, dietaryCompatibility, ingredients, recipe, popularity, isActive } = req.body;

        // Kiêm tra các trường bắt buộc
        if (!nameMeal || !mealCategory || !Array.isArray(ingredients) || ingredients.length === 0 || !recipe) {
            return res.status(400).json({
                stype: "meal",
                message: "Thiếu trường bắt buộc",
                status: false
            });
        }

        // Kiểm tra tồn tại danh mục bữa ăn
        const mealCategoryExists = await MealCategoryModel.findById(mealCategory);
        if (!mealCategoryExists) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh mục bữa ăn không tồn tại",
                status: false
            });
        }

        // Tạo công thức nấu ăn mới thông qua Recipe Service
        const recipeCreated = await addRecipe(recipe);

        const newMeal = new Meal({
            nameMeal,
            description,
            mealCategory,
            mealImage,
            portionSize,
            dietaryCompatibility,
            ingredients,
            recipe: {
                recipe_id: recipeCreated._id,
                cookingEffect: recipeCreated.cookingEffect
            },
            popularity,
            isActive
        });

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
                    recipes: result.recipes,
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

module.exports = { addMeal };
