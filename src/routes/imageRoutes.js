const express = require('express');
const multer = require('multer');
const ImageController = require('../controllers/ImageController');
const { validate, validateObjectId, validateFileUpload } = require('../middleware/validation');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
});

// Image routes
router.post('/', 
  upload.single('image'), 
  validateFileUpload(), 
  validate('createImage'), 
  ImageController.uploadImage
);

router.post('/with-category', 
  upload.single('image'), 
  validateFileUpload(), 
  ImageController.uploadImageWithCategory
);

router.get('/homepage', ImageController.getHomepageData);
router.get('/featured', ImageController.getFeaturedImages);
router.get('/category/:categoryName', ImageController.getImagesByCategory);
router.get('/search', ImageController.searchImages);
router.get('/stats', ImageController.getImageStats);
router.get('/:id', validateObjectId('id'), ImageController.getImageById);
router.get('/', ImageController.getAllImages);
router.patch('/:id', validateObjectId('id'), validate('updateImage'), ImageController.updateImage);
router.delete('/:id', validateObjectId('id'), ImageController.deleteImage);

module.exports = router;
