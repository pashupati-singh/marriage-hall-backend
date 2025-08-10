const Image = require('../models/Image');
const Category = require('../models/Category');
const cloudinaryConfig = require('../config/cloudinary');
const logger = require('../utils/logger');

class ImageService {
  /**
   * Upload image to Cloudinary and save to database
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {Object} imageData - Image metadata
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Created image
   */
  async uploadImage(fileBuffer, imageData, categoryId) {
    try {
      // Verify category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Upload to Cloudinary
      const cloudinaryResult = await cloudinaryConfig.uploadImage(fileBuffer, {
        public_id: `marriage-hall/${category.name.toLowerCase()}/${Date.now()}`,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 800, height: 600, crop: 'limit' },
        ],
      });

      // Create thumbnail URL
      const thumbnailUrl = cloudinaryConfig.getImageUrl(cloudinaryResult.public_id, {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto',
      });

      // Create image document
      const image = new Image({
        ...imageData,
        category: categoryId,
        cloudinaryId: cloudinaryResult.public_id,
        imageUrl: cloudinaryResult.secure_url,
        thumbnailUrl,
        originalFileName: imageData.originalFileName,
        fileSize: cloudinaryResult.bytes,
        mimeType: cloudinaryResult.format,
        dimensions: {
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
        },
      });

      await image.save();
      
      logger.info(`Image uploaded successfully: ${image.title}`);
      return image;
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get homepage data with 20 images per category
   * @returns {Promise<Array>} Homepage data
   */
  async getHomepageData() {
    try {
      const homepageData = await Image.getHomepageData();
      logger.info('Homepage data fetched successfully');
      return homepageData;
    } catch (error) {
      logger.error('Error fetching homepage data:', error);
      throw error;
    }
  }

  /**
   * Get images by category name
   * @param {string} categoryName - Category name
   * @param {number} limit - Limit number of images
   * @returns {Promise<Array>} Images in category
   */
  async getImagesByCategory(categoryName, limit = null) {
    try {
      const images = await Image.findByCategoryName(categoryName, limit);
      logger.info(`Fetched ${images.length} images for category: ${categoryName}`);
      return images;
    } catch (error) {
      logger.error(`Error fetching images for category ${categoryName}:`, error);
      throw error;
    }
  }

  /**
   * Get image by ID
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} Image object
   */
  async getImageById(imageId) {
    try {
      const image = await Image.findById(imageId)
        .populate('category', 'name slug description');
      
      if (!image) {
        throw new Error('Image not found');
      }

      // Increment view count
      await image.incrementViewCount();
      
      return image;
    } catch (error) {
      logger.error(`Error fetching image by ID ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Get all images with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated images
   */
  async getAllImages(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        category,
        featured,
        search,
      } = options;

      const query = { isActive: true };

      if (category) {
        query.category = category;
      }

      if (featured !== undefined) {
        query.isFeatured = featured;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [images, total] = await Promise.all([
        Image.find(query)
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Image.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        images,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error fetching all images:', error);
      throw error;
    }
  }

  /**
   * Update image
   * @param {string} imageId - Image ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated image
   */
  async updateImage(imageId, updateData) {
    try {
      const image = await Image.findByIdAndUpdate(
        imageId,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('category', 'name slug');
      
      if (!image) {
        throw new Error('Image not found');
      }
      
      logger.info(`Image updated: ${image.title}`);
      return image;
    } catch (error) {
      logger.error(`Error updating image ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Delete image from database and Cloudinary
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(imageId) {
    try {
      const image = await Image.findById(imageId);
      
      if (!image) {
        throw new Error('Image not found');
      }

      // Delete from Cloudinary
      await cloudinaryConfig.deleteImage(image.cloudinaryId);
      
      // Delete from database
      await Image.findByIdAndDelete(imageId);
      
      logger.info(`Image deleted: ${image.title}`);
      
      return {
        title: image.title,
        cloudinaryId: image.cloudinaryId,
      };
    } catch (error) {
      logger.error(`Error deleting image ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Get featured images
   * @param {number} limit - Number of images to return
   * @returns {Promise<Array>} Featured images
   */
  async getFeaturedImages(limit = 20) {
    try {
      const images = await Image.findFeatured(limit);
      logger.info(`Fetched ${images.length} featured images`);
      return images;
    } catch (error) {
      logger.error('Error fetching featured images:', error);
      throw error;
    }
  }

  /**
   * Search images
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchImages(searchTerm, options = {}) {
    try {
      const searchOptions = {
        ...options,
        search: searchTerm,
      };

      const results = await this.getAllImages(searchOptions);
      logger.info(`Search completed for term: ${searchTerm}`);
      return results;
    } catch (error) {
      logger.error(`Error searching images with term ${searchTerm}:`, error);
      throw error;
    }
  }

  /**
   * Get image statistics
   * @returns {Promise<Object>} Image statistics
   */
  async getImageStats() {
    try {
      const stats = await Image.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
            averageViews: { $avg: '$viewCount' },
            featuredImages: { $sum: { $cond: ['$isFeatured', 1, 0] } },
            totalFileSize: { $sum: '$fileSize' },
          },
        },
      ]);

      return stats[0] || {
        totalImages: 0,
        totalViews: 0,
        averageViews: 0,
        featuredImages: 0,
        totalFileSize: 0,
      };
    } catch (error) {
      logger.error('Error fetching image stats:', error);
      throw error;
    }
  }
}

module.exports = new ImageService();
