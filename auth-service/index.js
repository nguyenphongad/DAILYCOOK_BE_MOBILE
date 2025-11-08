const express = require('express');
const bodyParser  = require('body-parser');
const mongoose  = require('mongoose');
const dotenv  = require('dotenv');
const cors  = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

// routes
const AuthRoute = require('./routes/AuthRoute');

const app = express();

app.use(express.static('public'));


app.use(bodyParser.json({limit:'30mb',extended: true}));
app.use(bodyParser.urlencoded({limit:'30mb',extended: true}));

// Tăng kích thước giới hạn của JSON
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

// Cấu hình CORS chi tiết hơn
app.use(cors({
  origin: '*',  //  cần giới hạn nguồn gốc khi ở bản tung ra
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

dotenv.config();

// Cấu hình Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Daily Cook Auth Service API',
      version: '1.0.0',
      description: 'API documentation cho Auth Service của ứng dụng Daily Cook',
      contact: {
        name: 'API Support',
        email: 'support@dailycook.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: 'Auth Service Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token vào đây (không cần thêm "Bearer ")',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Đường dẫn đến các file chứa API documentation
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Customization options cho Swagger UI
const swaggerUIOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Daily Cook Auth API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

// Route cho Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUIOptions));

// Route để lấy raw JSON của API spec
app.get('/swagger/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

mongoose
    .connect(process.env.MONGODB_URI) 
    .then(()=>{
        app.listen(process.env.PORT,()=>{
            console.log('server AUTH-SERVICE listening at port ' + process.env.PORT);
            console.log(`Swagger documentation available at http://localhost:${process.env.PORT}/swagger`);
        })
    })
    .catch((error)=>console.log(error));

// Thêm health endpoint ở root level
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Thêm error handling middleware
app.use((err, req, res, next) => {
  console.error('Auth service error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message
  });
});

// Các routes khác
app.use('/api/auth', AuthRoute)