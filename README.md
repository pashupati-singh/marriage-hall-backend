# Marriage Hall Backend

A scalable Node.js backend for marriage hall image management built with Express, MongoDB, and Cloudinary. This application follows SOLID principles, clean architecture, and separation of concerns.

## 🚀 Features

- **Image Management**: Upload, store, and manage images with Cloudinary integration
- **Category Management**: Organize images into categories with CRUD operations
- **Scalable Architecture**: Built with clean architecture and SOLID principles
- **Security**: Rate limiting, CORS, helmet, and input validation
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Centralized error handling with custom error classes
- **Validation**: Request validation using Joi
- **Performance**: Compression, caching, and optimized database queries

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Cloudinary account

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd marriage-hall-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Security
   JWT_SECRET=your_jwt_secret
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # File Upload
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
   ```

4. **Create logs directory**
   ```bash
   mkdir logs
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Categories

#### Get Homepage Data (20 images per category)
```http
GET /images/homepage
```

#### Get All Categories
```http
GET /categories
```

#### Get Images by Category Name
```http
GET /images/category/:categoryName
```

#### Add Image with Category
```http
POST /images/with-category
Content-Type: multipart/form-data

{
  "title": "Image Title",
  "description": "Image Description",
  "categoryName": "New Category",
  "categoryDescription": "Category Description",
  "tags": "tag1,tag2,tag3",
  "isFeatured": "true",
  "image": [file]
}
```

#### Add Image to Existing Category
```http
POST /images
Content-Type: multipart/form-data

{
  "title": "Image Title",
  "description": "Image Description",
  "category": "category_id",
  "tags": "tag1,tag2,tag3",
  "isFeatured": "true",
  "image": [file]
}
```

#### Update Category Text
```http
PATCH /categories/:id
Content-Type: application/json

{
  "name": "Updated Category Name",
  "description": "Updated Description"
}
```

#### Delete Image
```http
DELETE /images/:id
```

#### Delete Category (and all its images)
```http
DELETE /categories/:id
```

### Additional Endpoints

#### Get All Images with Pagination
```http
GET /images?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

#### Search Images
```http
GET /images/search?q=search_term&page=1&limit=20
```

#### Get Featured Images
```http
GET /images/featured?limit=20
```

#### Get Image Statistics
```http
GET /images/stats
```

#### Get Category Statistics
```http
GET /categories/stats
```

## 🏗️ Architecture

### Directory Structure
```
src/
├── config/          # Configuration files
│   ├── database.js  # MongoDB connection
│   └── cloudinary.js # Cloudinary configuration
├── controllers/     # Request handlers
│   ├── CategoryController.js
│   └── ImageController.js
├── middleware/      # Express middleware
│   ├── errorHandler.js
│   ├── security.js
│   └── validation.js
├── models/          # Mongoose models
│   ├── Category.js
│   └── Image.js
├── routes/          # API routes
│   ├── categoryRoutes.js
│   └── imageRoutes.js
├── services/        # Business logic
│   ├── CategoryService.js
│   └── ImageService.js
├── utils/           # Utility functions
│   └── logger.js
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **Controller Pattern**: Request/response handling
- **Middleware Pattern**: Cross-cutting concerns
- **Factory Pattern**: Object creation
- **Singleton Pattern**: Configuration instances

## 🔒 Security Features

- **Rate Limiting**: API and upload rate limiting
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **File Upload Security**: File type and size validation
- **Error Handling**: Secure error responses

## 📊 Performance Features

- **Database Indexing**: Optimized MongoDB queries
- **Compression**: Response compression
- **Caching**: Cloudinary image optimization
- **Pagination**: Efficient data retrieval
- **Connection Pooling**: MongoDB connection management

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

The application uses Winston for comprehensive logging:

- **Error Logs**: `logs/error.log`
- **Combined Logs**: `logs/combined.log`
- **Console Logs**: Development environment

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_production_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_secure_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Deployment
```bash
# Build image
docker build -t marriage-hall-backend .

# Run container
docker run -p 3000:3000 --env-file .env marriage-hall-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@marriagehall.com or create an issue in the repository.