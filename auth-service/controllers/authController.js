const UserModel = require('../model/UserModel');
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const loginUser = async (req, res) => {
    try {
        // Log thông tin request để debug
        // console.log('Received login request:', {
        //     headers: req.headers,
        //     body: req.body
        // });

        const { email, passwordAdmin } = req.body;

        if (!email || !passwordAdmin) {
            return res.status(400).json({ message: "Các trường không được để trống!", status: false });
        }

        
        const checkUser = await UserModel.findOne({ email });

        console.log("vv"+ checkUser)

        if (!checkUser) {
            return res.status(404).json({ message: "email không tồn tại!", status: false });
        }

        // Thêm JWT_SECRET vào password trước khi so sánh (để khớp với cách tạo hash trong createAdmin.js)
        const isPasswordValid = await bcrypt.compare(passwordAdmin + process.env.JWT_SECRET, checkUser.passwordAdmin);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password không chính xác!", status: false });
        }
        const token = jwt.sign(
            { email: checkUser.email, _id: checkUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "48h" }
        );

        res.status(200).json({
            message: "Đăng nhập thành công",
            user: { email: checkUser.email, _id: checkUser._id },
            status: true,
            token
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

module.exports = { loginUser }