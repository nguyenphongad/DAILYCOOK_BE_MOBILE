const mongoose = require('mongoose');
const readline = require('readline');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const User = require('./model/UserModel');

// Tải biến môi trường từ file .env
dotenv.config();

// Tạo interface để đọc input từ command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hàm để hỏi thông tin từ người dùng
function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Kết nối đến MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailycook';
    await mongoose.connect(mongoURI);
    console.log('Kết nối MongoDB thành công');
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
}

// Hàm chính để tạo tài khoản admin
async function createAdmin() {
  try {
    await connectDB();

    console.log('\n===== TẠO TÀI KHOẢN ADMIN =====\n');

    // Nhập thông tin cơ bản
    const fullName = await askQuestion('Nhập họ tên: ');
    const userImage = await askQuestion('Nhập URL hình đại diện: ');

    // Nhập và kiểm tra email
    let email;
    let existingUser;
    do {
      email = await askQuestion('Nhập email: ');
      existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('\n⚠️ Email này đã được sử dụng. Vui lòng nhập email khác.\n');
      }
    } while (existingUser);
    
    const password = await askQuestion('Nhập mật khẩu: ');
    const googleId = await askQuestion('Nhập Google ID (hoặc để trống): ');

    // Mã hóa mật khẩu sử dụng bcrypt và JWT_SECRET
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password + process.env.JWT_SECRET, salt);
    
    // Tạo ObjectId cho user
    const userId = new mongoose.Types.ObjectId();
    
    // Tạo user admin mới trong auth service
    const newAdmin = new User({
      _id: userId,
      user_id: userId,
      email,
      passwordAdmin: hashedPassword,
      google_id: googleId || undefined,
      isAdmin: true,
      isActive: true,
      createAt: new Date(),
      updateAt: new Date()
    });

    // Lưu vào database
    await newAdmin.save();

    // Gửi thông tin sang user-service
    try {
      const requestData = {
        _id: userId,
        fullName: fullName,
        userImage: userImage,
        createAt: new Date(),
        updateAt: new Date()
      };

      const requestHeaders = {
        'x-api-key': process.env.API_KEY,
        'Content-Type': 'application/json'
      };

      console.log('📤 Gửi request đến user-service:');
      console.log('URL:', process.env.PORT_CHECK_USER_SERVICE);
      console.log('Headers:', requestHeaders);
      console.log('Data:', JSON.stringify(requestData, null, 2));

      const response = await axios.post(process.env.PORT_CHECK_USER_SERVICE, requestData, {
        headers: requestHeaders
      });

      console.log('📥 Response từ user-service:');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('✅ Thông tin admin đã được gửi đến user-service thành công');
    } catch (userServiceError) {
      console.error('⚠️ Lỗi khi gửi thông tin đến user-service:');
      console.error('Error message:', userServiceError.message);
      if (userServiceError.response) {
        console.error('Response status:', userServiceError.response.status);
        console.error('Response data:', JSON.stringify(userServiceError.response.data, null, 2));
      }
      console.log('Admin đã được tạo trong auth-service nhưng có lỗi khi đồng bộ với user-service');
    }

    console.log('\n✅ Tài khoản admin đã được tạo thành công!');
    console.log(`
    Thông tin tài khoản:
    - Họ tên: ${fullName}
    - Email: ${email}
    - Hình đại diện: ${userImage}
    - Vai trò: Admin
    - Trạng thái: Hoạt động
    - User ID: ${userId}
    `);

  } catch (error) {
    console.error('Lỗi khi tạo tài khoản admin:', error);
  } finally {
    // Đóng readline interface và kết nối database
    rl.close();
    setTimeout(() => {
      mongoose.disconnect();
      console.log('Đã ngắt kết nối database');
    }, 1000);
  }
}

// Chạy hàm tạo admin
createAdmin();