// routes/index.js
const express = require('express');
const multer = require('multer');
const { cloudinary, uploadBuffer } = require('../config/cloudinary');
const Image = require('../model/Image');
const Category = require('../model/Category');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Different upload configs for different endpoints
const uploadMultipleImages = multer({ storage: multer.memoryStorage() }).array('images', 10);
const uploadMultipleFiles = multer({ storage: multer.memoryStorage() }).array('files', 10);

// POST: Create new category with array of images (max 10)
router.post('/categories-with-images', uploadMultipleImages, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate category name
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    // Validate images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one image is required' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ success: false, error: 'Maximum 10 images allowed' });
    }

    // Create category ONCE
    const category = await Category.create({ 
      name: name.trim().toLowerCase() 
    });

    // Upload ALL images using the SAME category ID
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Upload to Cloudinary
        const result = await uploadBuffer(file.buffer, {
          folder: `myapp/${category.name}`,
          resource_type: 'image',
        });

        // Save image to database using the SAME category._id
        const image = await Image.create({
          category: category._id, // Use the same category ID for all images
          image: result.secure_url,
        });

        return image;
      } catch (error) {
        console.error(`Error uploading image ${index + 1}:`, error);
        throw error;
      }
    });

    // Wait for ALL images to upload
    const images = await Promise.all(uploadPromises);

    res.status(201).json({ 
      success: true, 
      data: {
        category: category,
        images: images,
        totalImages: images.length
      }
    });

  } catch (error) {
    console.error(error);
    
    // Handle duplicate category name
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Category name already exists' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create category with images' 
    });
  }
});

// POST: Add images to existing category (max 10)
router.post('/categories/:categoryId/images', uploadMultipleImages, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Validate images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one image is required' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ success: false, error: 'Maximum 10 images allowed' });
    }

    // Upload images to Cloudinary and save to database
    const uploadPromises = req.files.map(async (file) => {
      try {
        // Upload to Cloudinary
        const result = await uploadBuffer(file.buffer, {
          folder: `myapp/${category.name}`,
          resource_type: 'image',
        });

        // Save image to database
        const image = await Image.create({
          category: categoryId,
          image: result.secure_url,
        });

        return image;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    });

    const images = await Promise.all(uploadPromises);

    res.status(201).json({ 
      success: true, 
      data: {
        category: category,
        images: images,
        totalImages: images.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to upload images' 
    });
  }
});

// GET: Home page - All categories with their latest 20 images (desc by createdAt)
router.get('/home', async (req, res) => {
  try {
    const data = await Category.aggregate([
      // Get all categories
      {
        $lookup: {
          from: 'images',
          localField: '_id',
          foreignField: 'category',
          as: 'allImages'
        }
      },
      // Sort images by createdAt desc and take only 20
      {
        $addFields: {
          images: {
            $slice: [
              {
                $sortArray: {
                  input: '$allImages',
                  sortBy: { createdAt: -1 }
                }
              },
              20
            ]
          }
        }
      },
      // Clean up the response
      {
  $project: {
    _id: 1,
    name: 1,
    createdAt: 1,
    updatedAt: 1,
    images: {
      $map: {
        input: '$images',
        as: 'img',
        in: {
          _id: '$$img._id',
          image: '$$img.image',
          createdAt: '$$img.createdAt'
        }
      }
    },
    totalImages: { $size: '$allImages' }
  }
},
      // Sort categories by createdAt desc
      { $sort: { createdAt: -1 } }
    ]);

    res.json({ 
      success: true, 
      data: {
        categories: data,
        totalCategories: data.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch home data' 
    });
  }
});


// GET: All images by category ID
router.get('/categories/:categoryId/images', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Get all images for this category sorted by createdAt desc
    const images = await Image.find({ category: categoryId })
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: {
        category: category,
        images: images,
        totalImages: images.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch images' 
    });
  }
});

// PATCH: Update category name
router.patch('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    
    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Update category name
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name: name.trim().toLowerCase() },
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      data: {
        category: updatedCategory,
        message: 'Category name updated successfully'
      }
    });

  } catch (error) {
    console.error(error);
    
    // Handle duplicate category name
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Category name already exists' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update category' 
    });
  }
});

// DELETE: Delete single image by imageId
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // Find image
    const image = await Image.findById(imageId).populate('category', 'name');
    if (!image) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    // Extract public_id from Cloudinary URL for deletion
    try {
      const urlParts = image.image.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      const folderPath = `myapp/${image.category.name}`;
      const fullPublicId = `${folderPath}/${publicId}`;

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(fullPublicId, { resource_type: 'image' });
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue with DB deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Image.findByIdAndDelete(imageId);
    
    res.json({ 
      success: true, 
      data: {
        message: 'Image deleted successfully',
        deletedImage: {
          _id: image._id,
          image: image.image,
          category: image.category.name
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete image' 
    });
  }
});

// DELETE: Delete category and all its images
router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Find all images in this category
    const images = await Image.find({ category: categoryId });
    
    // Delete all images from Cloudinary
    const cloudinaryDeletionPromises = images.map(async (image) => {
      try {
        const urlParts = image.image.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const folderPath = `myapp/${category.name}`;
        const fullPublicId = `${folderPath}/${publicId}`;

        await cloudinary.uploader.destroy(fullPublicId, { resource_type: 'image' });
      } catch (cloudinaryError) {
        console.error(`Failed to delete image from Cloudinary: ${image._id}`, cloudinaryError);
        // Continue even if some Cloudinary deletions fail
      }
    });

    // Wait for all Cloudinary deletions (best effort)
    await Promise.allSettled(cloudinaryDeletionPromises);

    // Delete all images from database
    await Image.deleteMany({ category: categoryId });

    // Delete category from database
    await Category.findByIdAndDelete(categoryId);

    // Try to delete the folder from Cloudinary (optional)
    try {
      await cloudinary.api.delete_folder(`myapp/${category.name}`);
    } catch (folderError) {
      console.error('Failed to delete Cloudinary folder:', folderError);
      // This is not critical, continue
    }

    res.json({ 
      success: true, 
      data: {
        message: 'Category and all its images deleted successfully',
        deletedCategory: {
          _id: category._id,
          name: category.name
        },
        deletedImagesCount: images.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete category' 
    });
  }
});

module.exports = router;