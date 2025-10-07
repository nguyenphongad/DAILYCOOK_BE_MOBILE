// controllers/ingredientController.js
const MeasurementUnits = require('../util/MeasurementUnits');

const getAllMeasurementUnits = async (req, res) => {
    try {
        const units = Object.entries(MeasurementUnits).map(([key, value]) => ({
            key,
            label: value
        }));

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách đơn vị đo thành công",
            data: units
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lỗi server khi lấy đơn vị đo",
            error: error.message
        });
    }
};

module.exports = { getAllMeasurementUnits };
