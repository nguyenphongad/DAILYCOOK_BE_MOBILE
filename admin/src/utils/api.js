// Mock API cho đăng nhập
export const loginAPI = (credentials) => {
  return new Promise((resolve, reject) => {
    // Giả lập API call
    setTimeout(() => {
      // Kiểm tra credentials
      if (credentials.email === 'user@example.com' && credentials.password === 'password123') {
        resolve({
          success: true,
          user: {
            id: 1,
            name: credentials.name,
            email: credentials.email,
            avatar: credentials.avatar,
          }
        })
      } else {
        reject({ message: 'Email hoặc mật khẩu không đúng!' })
      }
    }, 1000)
  })
}
