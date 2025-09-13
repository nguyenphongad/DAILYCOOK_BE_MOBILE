const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Bổ sung middleware để ghi log request body
app.use((req, res, next) => {
  if (req.body) {
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  }
  next();
});

// Áp dụng middleware cơ bản
app.use(helmet()); // Bảo mật header
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Tăng giới hạn kích thước body
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Giới hạn tốc độ request
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // giới hạn mỗi IP tối đa 100 request trong khoảng thời gian
  message: {
    status: 429,
    message: 'Quá nhiều request, vui lòng thử lại sau.'
  }
});
app.use('/api/', apiLimiter);

// Endpoint kiểm tra trạng thái
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Gateway đang hoạt động' });
});

// Kiểm tra auth service
app.get('/check-auth-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.auth.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến auth service: ${error.message}` });
  }
});

// Chuyển tiếp đến service xác thực - KHÔNG yêu cầu xác thực để đăng nhập
// Đặt trước các middleware khác để đảm bảo không bị chặn
app.use('/api/auth', createProxyMiddleware({ 
  target: config.services.auth.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'  // Đảm bảo đường dẫn được viết lại đúng
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Nếu body là JSON và có dữ liệu
    if (req.body && Object.keys(req.body).length > 0) {
      // Chuyển đổi body thành chuỗi
      const bodyData = JSON.stringify(req.body);
      // Đặt lại headers
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Ghi body vào proxyReq
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (auth service): ${err.message}`);
    res.status(500).json({ 
      status: 'error',
      message: 'Gateway không thể kết nối đến service xác thực',
      error: err.message
    });
  }
}));

// Chuyển tiếp đến service người dùng
app.use('/api/users', authMiddleware, createProxyMiddleware({
  target: config.services.user.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error (user service): ${err.message}`);
    res.status(500).json({ 
      status: 'error',
      message: 'Gateway không thể kết nối đến service người dùng'
    });
  }
}));

// Chuyển tiếp đến service công thức
app.use('/api/recipes', authMiddleware, createProxyMiddleware({ 
  target: config.services.recipe.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/recipes': '/api/recipes'
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error (recipe service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service công thức'
    });
  }
}));

// Chuyển tiếp đến service nguyên liệu
app.use('/api/ingredients', authMiddleware, createProxyMiddleware({ 
  target: config.services.ingredient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/ingredients': '/api/ingredients'
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error (ingredient service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service nguyên liệu'
    });
  }
}));

// Chuyển tiếp đến service món ăn
app.use('/api/meals', authMiddleware, createProxyMiddleware({
  target: config.services.meal.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/meals': '/api/meals'
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error (meal service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service món ăn'
    });
  }
}));

// Chuyển tiếp đến service kế hoạch bữa ăn
app.use('/api/mealplans', authMiddleware, createProxyMiddleware({
  target: config.services.mealplan.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/mealplans': '/api/mealplans'
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error (mealplan service): ${err.message}`);
    res.status(500).json({
      status: 'error', 
      message: 'Gateway không thể kết nối đến service kế hoạch bữa ăn'
    });
  }
}));

// Chuyển tiếp đến service mua sắm
app.use('/api/shopping', authMiddleware, createProxyMiddleware({
  target: config.services.shopping.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/shopping': '/api/shoping'
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error (shopping service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service mua sắm'
    });
  }
}));

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  logger.error(`Gateway error: ${err.stack}`);
  res.status(500).json({
    status: 'error',
    message: 'Đã xảy ra lỗi trên máy chủ',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Xử lý các route không tồn tại
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Không tìm thấy endpoint',
    path: req.originalUrl
  });
});

// Khởi động server
app.listen(PORT, () => {
  logger.info(`Gateway đang chạy tại cổng ${PORT}`);
  logger.info(`Auth service URL: ${config.services.auth.url}`);
  logger.info(`User service URL: ${config.services.user.url}`);
  logger.info(`Recipe service URL: ${config.services.recipe.url}`);
  logger.info(`Ingredient service URL: ${config.services.ingredient.url}`);
  logger.info(`Meal service URL: ${config.services.meal.url}`);
  logger.info(`MealPlan service URL: ${config.services.mealplan.url}`);
  logger.info(`Shopping service URL: ${config.services.shopping.url}`);
});

module.exports = app;
