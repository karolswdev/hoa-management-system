const arcRequestService = require('../services/arcRequest.service');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/arc-categories - List active categories
 */
const listCategoriesController = async (req, res, next) => {
  try {
    const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
    const categories = await arcRequestService.listCategories({ includeInactive });
    res.status(200).json({ categories });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve categories'));
  }
};

/**
 * POST /api/arc-categories - Create category (admin only)
 */
const createCategoryController = async (req, res, next) => {
  try {
    const { name, description, sort_order } = req.body;
    if (!name) {
      return next(new ApiError(400, 'Category name is required'));
    }

    const category = await arcRequestService.createCategory(
      { name, description, sort_order },
      req.user.id
    );
    res.status(201).json({ category });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(409, 'A category with this name already exists'));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create category'));
  }
};

/**
 * PUT /api/arc-categories/:id - Update category (admin only)
 */
const updateCategoryController = async (req, res, next) => {
  try {
    const { name, description, is_active, sort_order } = req.body;
    const category = await arcRequestService.updateCategory(
      parseInt(req.params.id, 10),
      { name, description, is_active, sort_order },
      req.user.id
    );
    res.status(200).json({ category });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(409, 'A category with this name already exists'));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update category'));
  }
};

/**
 * DELETE /api/arc-categories/:id - Deactivate category (admin only)
 */
const deactivateCategoryController = async (req, res, next) => {
  try {
    await arcRequestService.deactivateCategory(parseInt(req.params.id, 10), req.user.id);
    res.status(200).json({ message: 'Category deactivated' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to deactivate category'));
  }
};

module.exports = {
  listCategoriesController,
  createCategoryController,
  updateCategoryController,
  deactivateCategoryController
};
