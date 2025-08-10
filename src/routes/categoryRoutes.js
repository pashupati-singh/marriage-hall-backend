const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const { validate, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Apply validation middleware
const { validate: validateCategory } = require('../middleware/validation');

// Category routes
router.post('/', validate('createCategory'), CategoryController.createCategory);
router.get('/', CategoryController.getAllCategories);
router.get('/stats', CategoryController.getCategoryStats);
router.get('/search', CategoryController.searchCategories);
router.get('/name/:name', CategoryController.getCategoryByName);
router.get('/:id', validateObjectId('id'), CategoryController.getCategoryById);
router.patch('/:id', validateObjectId('id'), validate('updateCategory'), CategoryController.updateCategory);
router.delete('/:id', validateObjectId('id'), CategoryController.deleteCategory);

module.exports = router;
