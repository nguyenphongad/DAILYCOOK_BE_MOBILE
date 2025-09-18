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

        console.log("vv" + checkUser)

        if (!checkUser) {
            return res.status(404).json({ message: "Email không tồn tại!", status: false });
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


const checkToken = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        // nếu token không có
        if (!token) {
            return res.status(401).json({
                isLogin: false,
                message: "Không có token, không được phép truy cập",
                status: false
            })
        }

        // giải mã token
        const decode = jwt.verify(token, process.env.JWT_SECRET);


        // tim ng dùng theo id
        const user = await UserModel.findById(decode._id).select("-passwordAdmin");


        if (!user) {
            return res.status(404).json({
                isLogin: false,
                message: "Người dùng không tồn tại",
                status: false
            })
        }

        return res.status(200).json({
            isLogin: true, // Thay đổi từ false thành true
            message: "Truy vấn thông tin người dùng từ token thành công",
            user: user
        })

    } catch (error) {
        console.error("Lỗi xác thực token, lỗi: ", error);
        return res.status(401).json({
            isLogin: false,
            message: "token hết hạn , xác thực không hợp lệ (server bị lỗi/chưa khởi động)"
        })
    }
}




module.exports = { loginUser, checkToken }