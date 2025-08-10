const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

class CloudinaryConfig {
  constructor() {
    this.isConfigured = false;
  }

  configure() {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Cloudinary credentials are not properly configured');
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      this.isConfigured = true;
      logger.info('Cloudinary configured successfully');

    } catch (error) {
      logger.error('Failed to configure Cloudinary:', error);
      throw error;
    }
  }

  async uploadImage(fileBuffer, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      const uploadOptions = {
        resource_type: 'image',
        folder: 'marriage-hall',
        ...options,
      };

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(fileBuffer);
      });

      logger.info(`Image uploaded successfully: ${result.public_id}`);
      return result;

    } catch (error) {
      logger.error('Failed to upload image to Cloudinary:', error);
      throw error;
    }
  }

  async deleteImage(publicId) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted successfully: ${publicId}`);
      return result;

    } catch (error) {
      logger.error(`Failed to delete image from Cloudinary: ${publicId}`, error);
      throw error;
    }
  }

  getImageUrl(publicId, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
    };

    return cloudinary.url(publicId, { ...defaultOptions, ...options });
  }
}

module.exports = new CloudinaryConfig();
