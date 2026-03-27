const express = require('express');
const arcCategoryController = require('../controllers/arcCategory.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const isAdmin = authorizeRoles('admin');
const isMember = authorizeRoles('member', 'admin');

// List categories (members can view active ones)
router.get('/', verifyToken, isMember, arcCategoryController.listCategoriesController);

// Admin routes - manage categories
router.post('/', verifyToken, isAdmin, arcCategoryController.createCategoryController);
router.put('/:id', verifyToken, isAdmin, arcCategoryController.updateCategoryController);
router.delete('/:id', verifyToken, isAdmin, arcCategoryController.deactivateCategoryController);

module.exports = router;
