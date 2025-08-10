const ImageService = require('../services/ImageService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ImageController {
  /**
   * Upload image with category
   * POST /api/images
   */
  uploadImage = asyncHandler(async (req, res) => {
    const imageData = {
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      isFeatured: req.body.isFeatured === 'true',
      originalFileName: req.file.originalname,
    };

    const image = await ImageService.uploadImage(
      req.file.buffer,
      imageData,
      req.body.category
    );
    
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: image,
    });
  });

  /**
   * Upload image and create category
   * POST /api/images/with-category
   */
  uploadImageWithCategory = asyncHandler(async (req, res) => {
    // First create the category
    const CategoryService = require('../services/CategoryService');
    const category = await CategoryService.createCategory({
      name: req.body.categoryName,
      description: req.body.categoryDescription,
    });

    // Then upload the image
    const imageData = {
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      isFeatured: req.body.isFeatured === 'true',
      originalFileName: req.file.originalname,
    };

    const image = await ImageService.uploadImage(
      req.file.buffer,
      imageData,
      category._id
    );
    
    res.status(201).json({
      success: true,
      message: 'Image and category created successfully',
      data: {
        image,
        category,
      },
    });
  });

  /**
   * Get homepage data (20 images per category)
   * GET /api/images/homepage
   */
  getHomepageData = asyncHandler(async (req, res) => {
    const homepageData = await ImageService.getHomepageData();
    
    res.status(200).json({
      success: true,
      message: 'Homepage data retrieved successfully',
      data: homepageData,
    });
  });

  /**
   * Get images by category name
   * GET /api/images/category/:categoryName
   */
  getImagesByCategory = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const images = await ImageService.getImagesByCategory(
      req.params.categoryName,
      limit ? parseInt(limit) : null
    );
    
    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully',
      data: images,
    });
  });

  /**
   * Get image by ID
   * GET /api/images/:id
   */
  getImageById = asyncHandler(async (req, res) => {
    const image = await ImageService.getImageById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: image,
    });
  });

  /**
   * Get all images with pagination and filters
   * GET /api/images
   */
  getAllImages = asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      category: req.query.category,
      featured: req.query.featured,
      search: req.query.search,
    };

    const result = await ImageService.getAllImages(options);
    
    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully',
      data: result.images,
      pagination: result.pagination,
    });
  });

  /**
   * Update image
   * PATCH /api/images/:id
   */
  updateImage = asyncHandler(async (req, res) => {
    const image = await ImageService.updateImage(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: image,
    });
  });

  /**
   * Delete image
   * DELETE /api/images/:id
   */
  deleteImage = asyncHandler(async (req, res) => {
    const result = await ImageService.deleteImage(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: result,
    });
  });

  /**
   * Get featured images
   * GET /api/images/featured
   */
  getFeaturedImages = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const images = await ImageService.getFeaturedImages(
      limit ? parseInt(limit) : 20
    );
    
    res.status(200).json({
      success: true,
      message: 'Featured images retrieved successfully',
      data: images,
    });
  });

  /**
   * Search images
   * GET /api/images/search?q=searchTerm
   */
  searchImages = asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await ImageService.searchImages(req.query.q, options);
    
    res.status(200).json({
      success: true,
      message: 'Image search completed successfully',
      data: result.images,
      pagination: result.pagination,
    });
  });

  /**
   * Get image statistics
   * GET /api/images/stats
   */
  getImageStats = asyncHandler(async (req, res) => {
    const stats = await ImageService.getImageStats();
    
    res.status(200).json({
      success: true,
      message: 'Image statistics retrieved successfully',
      data: stats,
    });
  });
}

module.exports = new ImageController();
