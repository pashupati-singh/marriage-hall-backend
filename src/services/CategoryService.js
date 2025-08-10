const Category = require('../models/Category');
const Image = require('../models/Image');
const logger = require('../utils/logger');

class CategoryService {
  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const category = new Category(categoryData);
      await category.save();
      
      logger.info(`Category created: ${category.name}`);
      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Get all active categories
   * @returns {Promise<Array>} List of categories
   */
  async getAllCategories() {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ name: 1 })
        .select('-__v');
      
      return categories;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Category object
   */
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findOne({ 
        _id: categoryId, 
        isActive: true 
      }).populate('images');
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      logger.error(`Error fetching category by ID ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get category by name
   * @param {string} categoryName - Category name
   * @returns {Promise<Object>} Category object
   */
  async getCategoryByName(categoryName) {
    try {
      const category = await Category.findOne({ 
        name: { $regex: new RegExp(categoryName, 'i') }, 
        isActive: true 
      });
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      logger.error(`Error fetching category by name ${categoryName}:`, error);
      throw error;
    }
  }

  /**
   * Get category by slug
   * @param {string} slug - Category slug
   * @returns {Promise<Object>} Category object
   */
  async getCategoryBySlug(slug) {
    try {
      const category = await Category.findBySlug(slug);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      logger.error(`Error fetching category by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Update category
   * @param {string} categoryId - Category ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(categoryId, updateData) {
    try {
      const category = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      );
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      logger.info(`Category updated: ${category.name}`);
      return category;
    } catch (error) {
      logger.error(`Error updating category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete category and all its images
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCategory(categoryId) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      // Delete all images in this category
      const Image = require('../models/Image');
      const deletedImages = await Image.deleteMany({ category: categoryId });
      
      // Delete the category
      await Category.findByIdAndDelete(categoryId);
      
      logger.info(`Category deleted: ${category.name} with ${deletedImages.deletedCount} images`);
      
      return {
        category: category.name,
        deletedImagesCount: deletedImages.deletedCount,
      };
    } catch (error) {
      logger.error(`Error deleting category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get category statistics
   * @returns {Promise<Object>} Category statistics
   */
  async getCategoryStats() {
    try {
      const stats = await Category.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalCategories: { $sum: 1 },
            totalImages: { $sum: '$imageCount' },
            averageImagesPerCategory: { $avg: '$imageCount' },
          },
        },
      ]);

      return stats[0] || {
        totalCategories: 0,
        totalImages: 0,
        averageImagesPerCategory: 0,
      };
    } catch (error) {
      logger.error('Error fetching category stats:', error);
      throw error;
    }
  }

  /**
   * Search categories
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching categories
   */
  async searchCategories(searchTerm) {
    try {
      const categories = await Category.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
            ],
          },
        ],
      })
        .sort({ name: 1 })
        .select('-__v');

      return categories;
    } catch (error) {
      logger.error(`Error searching categories with term ${searchTerm}:`, error);
      throw error;
    }
  }
}

module.exports = new CategoryService();
