require('dotenv').config();
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

// Giới hạn tốc độ request - loại trừ health endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tăng giới hạn lên 1000 request
  message: {
    status: 429,
    message: 'Quá nhiều request, vui lòng thử lại sau.'
  },
  // Loại trừ health endpoints khỏi rate limiting
  skip: (req, res) => {
    return req.path.includes('/health') || 
           req.path === '/health' ||
           req.path.endsWith('/health');
  }
});

// Chỉ áp dụng rate limiting cho các API endpoints (không phải health)
app.use('/api/', (req, res, next) => {
  // Nếu là health endpoint thì bỏ qua rate limiting
  if (req.path.includes('/health')) {
    return next();
  }
  return apiLimiter(req, res, next);
});

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

// Kiểm tra user service
app.get('/check-user-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.user.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến user service: ${error.message}` });
  }
});

// Kiểm tra ingredient service
app.get('/check-ingredients-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.ingredient.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến ingredients service: ${error.message}` });
  }
});

// Kiểm tra recipe service
app.get('/check-recipe-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.recipe.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến recipe service: ${error.message}` });
  }
});

// Kiểm tra meal service
app.get('/check-meal-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.meal.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến meal service: ${error.message}` });
  }
});

// Kiểm tra mealplan service
app.get('/check-mealplan-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.mealplan.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến mealplan service: ${error.message}` });
  }
});

// Kiểm tra shopping service
app.get('/check-shopping-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.shopping.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến shopping service: ${error.message}` });
  }
});

// Kiểm tra survey service
app.get('/check-survey-service', async (req, res) => {
  try {
    const response = await fetch(`${config.services.survey.url}/health`);
    const data = await response.json();
    res.status(200).json({ status: 'ok', serviceStatus: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Không thể kết nối đến survey service: ${error.message}` });
  }
});

// Kiểm tra tất cả service
app.get('/check-all-services', async (req, res) => {
  const services = [
    { name: 'auth', url: config.services.auth.url },
    { name: 'user', url: config.services.user.url },
    { name: 'ingredients', url: config.services.ingredient.url },
    { name: 'recipe', url: config.services.recipe.url },
    { name: 'meal', url: config.services.meal.url },
    { name: 'mealplan', url: config.services.mealplan.url },
    { name: 'shopping', url: config.services.shopping.url },
    { name: 'survey', url: config.services.survey.url }
  ];

  const results = {};
  let allHealthy = true;

  for (const service of services) {
    try {
      const response = await fetch(`${service.url}/health`);
      const data = await response.json();
      results[service.name] = { status: 'ok', data };
    } catch (error) {
      results[service.name] = { status: 'error', message: error.message };
      allHealthy = false;
    }
  }

  res.status(allHealthy ? 200 : 500).json({
    status: allHealthy ? 'ok' : 'partial',
    message: allHealthy ? 'Tất cả service đang hoạt động' : 'Một số service gặp sự cố',
    services: results
  });
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
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (user service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service người dùng',
      error: err.message
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
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (ingredients service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service nguyên liệu',
      error: err.message
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
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (recipe service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service công thức',
      error: err.message
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
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (meal service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service món ăn',
      error: err.message
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
  onProxyReq: (proxyReq, req, res) => {
    // Tự động thêm API key nếu mealplan service cần
    if (process.env.API_KEY) {
      proxyReq.setHeader('x-api-key', process.env.API_KEY);
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (mealplan service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service kế hoạch bữa ăn',
      error: err.message
    });
  }
}));

// Chuyển tiếp đến service mua sắm
app.use('/api/shopping', authMiddleware, createProxyMiddleware({
  target: config.services.shopping.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/shopping': '/api/shopping'  // Sửa typo từ '/api/shoping' thành '/api/shopping'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (shopping service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service mua sắm',
      error: err.message
    });
  }
}));

// Chuyển tiếp đến service khao sát
app.use('/api/surveys', authMiddleware, createProxyMiddleware({
  target: config.services.survey.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/surveys': '/api/surveys'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Tự động thêm API key từ env
    proxyReq.setHeader('x-api-key', process.env.API_KEY);
    
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error (surveys service): ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Gateway không thể kết nối đến service khảo sát',
      error: err.message
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
  logger.info(`Survey service URL: ${config.services.survey.url}`);
});

module.exports = app;