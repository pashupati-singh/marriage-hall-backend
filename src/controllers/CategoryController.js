const CategoryService = require('../services/CategoryService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class CategoryController {
  /**
   * Create a new category
   * POST /api/categories
   */
  createCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.createCategory(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  });

  /**
   * Get all categories
   * GET /api/categories
   */
  getAllCategories = asyncHandler(async (req, res) => {
    const categories = await CategoryService.getAllCategories();
    
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    });
  });

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  getCategoryById = asyncHandler(async (req, res) => {
    const category = await CategoryService.getCategoryById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  });

  /**
   * Get category by name
   * GET /api/categories/name/:name
   */
  getCategoryByName = asyncHandler(async (req, res) => {
    const category = await CategoryService.getCategoryByName(req.params.name);
    
    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  });

  /**
   * Update category
   * PATCH /api/categories/:id
   */
  updateCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  });

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  deleteCategory = asyncHandler(async (req, res) => {
    const result = await CategoryService.deleteCategory(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: result,
    });
  });

  /**
   * Get category statistics
   * GET /api/categories/stats
   */
  getCategoryStats = asyncHandler(async (req, res) => {
    const stats = await CategoryService.getCategoryStats();
    
    res.status(200).json({
      success: true,
      message: 'Category statistics retrieved successfully',
      data: stats,
    });
  });

  /**
   * Search categories
   * GET /api/categories/search?q=searchTerm
   */
  searchCategories = asyncHandler(async (req, res) => {
    const categories = await CategoryService.searchCategories(req.query.q);
    
    res.status(200).json({
      success: true,
      message: 'Categories search completed successfully',
      data: categories,
    });
  });
}

module.exports = new CategoryController();
