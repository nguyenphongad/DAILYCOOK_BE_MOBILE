const mongoose = require('mongoose');
const readline = require('readline');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
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
    const phoneNumber = await askQuestion('Nhập số điện thoại: ');
    const userImage = await askQuestion('Nhập URL hình đại diện: ');

    // Thông tin cá nhân
    console.log('\n--- Thông tin cá nhân ---');
    const height = await askQuestion('Nhập chiều cao (cm): ');
    const weight = await askQuestion('Nhập cân nặng (kg): ');
    const age = await askQuestion('Nhập tuổi: ');
    const gender = await askQuestion('Nhập giới tính (male/female/other): ');

    // Mã hóa mật khẩu sử dụng bcrypt và JWT_SECRET
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password + process.env.JWT_SECRET, salt);
    
    // Tạo user admin mới
    const newAdmin = new User({
      fullName,
      email,
      passwordAdmin: hashedPassword,
      userImage,
      phoneNumber,
      isAdmin: true,
      personalInfo: {
        height: parseInt(height),
        weight: parseInt(weight),
        age: parseInt(age),
        gender
      },
      familyInfo: {
        children: 0,
        teenagers: 0,
        adults: 1,
        elderly: 0
      },
      dietaryPreferences: {
        allergies: [],
        dislikeIngredients: []
      },
      nutritionGoals: {
        caloriesPerDay: 2000,
        proteinPercentage: 20,
        carbPercentage: 50,
        fatPercentage: 30,
        waterIntakeGoal: 2
      },
      waterReminders: {
        enabled: false,
        frequency: 2,
        startTime: "08:00",
        endTime: "20:00"
      },
      isOnboardingCompleted: true
    });

    // Lưu vào database
    await newAdmin.save();

    console.log('\n✅ Tài khoản admin đã được tạo thành công!');
    console.log(`
    Thông tin tài khoản:
    - Họ tên: ${fullName}
    - Email: ${email}
    - Vai trò: Admin
    - Trạng thái: Hoạt động
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