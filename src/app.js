const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Import middleware
const {
  apiLimiter,
  uploadLimiter,
  corsOptions,
  securityHeaders,
  morganLogger,
  requestLogger,
  responseTime,
  healthCheck,
} = require('./middleware/security');

const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const categoryRoutes = require('./routes/categoryRoutes');
const imageRoutes = require('./routes/imageRoutes');

// Import logger
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup all middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(securityHeaders);
    this.app.use(cors(corsOptions));
    
    // Compression middleware
    this.app.use(compression());
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging middleware
    this.app.use(morganLogger);
    this.app.use(requestLogger);
    this.app.use(responseTime);
    
    // Rate limiting
    this.app.use('/api/', apiLimiter);
    this.app.use('/api/images', uploadLimiter);
  }

  /**
   * Setup all routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', healthCheck);
    
    // API routes
    this.app.use('/api/categories', categoryRoutes);
    this.app.use('/api/images', imageRoutes);
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Marriage Hall Backend API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          categories: '/api/categories',
          images: '/api/images',
          health: '/health',
        },
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      const database = require('./config/database');
      await database.connect();
      
      // Configure Cloudinary
      const cloudinaryConfig = require('./config/cloudinary');
      cloudinaryConfig.configure();
      
      // Start server
      this.app.listen(this.port, () => {
        logger.info(`Server is running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
      });
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }
}

module.exports = App;
