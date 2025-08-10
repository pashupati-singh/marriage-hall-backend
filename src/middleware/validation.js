const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  // Category validation schemas
  createCategory: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 50 characters',
        'any.required': 'Category name is required',
      }),
    description: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters',
      }),
  }),

  updateCategory: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 50 characters',
      }),
    description: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters',
      }),
  }),

  // Image validation schemas
  createImage: Joi.object({
    title: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Image title must be at least 1 character long',
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Image title is required',
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters',
      }),
    category: Joi.string()
      .required()
      .messages({
        'any.required': 'Category is required',
      }),
    tags: Joi.array()
      .items(Joi.string().max(30))
      .optional()
      .messages({
        'array.items': 'Each tag cannot exceed 30 characters',
      }),
    isFeatured: Joi.boolean()
      .optional(),
  }),

  updateImage: Joi.object({
    title: Joi.string()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Image title must be at least 1 character long',
        'string.max': 'Title cannot exceed 100 characters',
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters',
      }),
    category: Joi.string()
      .optional(),
    tags: Joi.array()
      .items(Joi.string().max(30))
      .optional()
      .messages({
        'array.items': 'Each tag cannot exceed 30 characters',
      }),
    isFeatured: Joi.boolean()
      .optional(),
  }),

  // Query validation schemas
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'title', 'viewCount', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, title, viewCount, updatedAt',
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc',
      }),
  }),

  search: Joi.object({
    search: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search term must be at least 1 character long',
        'string.max': 'Search term cannot exceed 100 characters',
        'any.required': 'Search term is required',
      }),
  }),
};

/**
 * Generic validation middleware
 * @param {string} schemaName - Name of the schema to use
 * @returns {Function} Express middleware function
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`);
      return res.status(500).json({
        success: false,
        message: 'Internal server error: Validation schema not found',
      });
    }

    const dataToValidate = {
      ...req.body,
      ...req.query,
      ...req.params,
    };

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn(`Validation failed for ${schemaName}:`, errorMessages);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    // Replace validated data
    req.body = { ...req.body, ...value };
    req.query = { ...req.query, ...value };
    req.params = { ...req.params, ...value };

    next();
  };
};

/**
 * File upload validation middleware
 * @returns {Function} Express middleware function
 */
const validateFileUpload = () => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      });
    }

    next();
  };
};

/**
 * ObjectId validation middleware
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const objectId = req.params[paramName];
    
    if (!objectId || !/^[0-9a-fA-F]{24}$/.test(objectId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateFileUpload,
  validateObjectId,
  schemas,
};
