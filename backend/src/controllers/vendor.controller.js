const vendorDirectoryService = require('../services/vendorDirectory.service');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/vendors - Get vendors with filtering
 * Public/Member/Admin access with different visibility levels
 */
const getVendorsController = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const isAuthenticated = !!req.user;
    const userRole = req.user?.role || null;

    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (status) filters.status = status; // Admin-only filter

    const vendors = await vendorDirectoryService.getVendors(filters, isAuthenticated, userRole);

    res.status(200).json({
      vendors,
      count: vendors.length,
      filters: {
        category,
        search,
        status: userRole === 'admin' ? status : undefined
      }
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve vendors'));
  }
};

/**
 * GET /api/vendors/:id - Get vendor details by ID
 * Public/Member/Admin access with visibility enforcement
 */
const getVendorByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAuthenticated = !!req.user;
    const userRole = req.user?.role || null;

    const vendor = await vendorDirectoryService.getVendorById(parseInt(id, 10), isAuthenticated, userRole);

    res.status(200).json({
      vendor
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve vendor'));
  }
};

/**
 * POST /api/vendors - Create a new vendor
 * Members submit for moderation, admins can directly approve
 */
const createVendorController = async (req, res, next) => {
  try {
    const { name, service_category, contact_info, rating, notes, visibility_scope } = req.body;

    // Validate required fields
    if (!name || !service_category) {
      return next(new ApiError(400, 'Missing required fields: name, service_category'));
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return next(new ApiError(400, 'Rating must be between 1 and 5'));
      }
    }

    // Validate visibility_scope if provided
    if (visibility_scope && !['public', 'members', 'admins'].includes(visibility_scope)) {
      return next(new ApiError(400, 'Invalid visibility_scope. Must be: public, members, or admins'));
    }

    const vendor = await vendorDirectoryService.createVendor(
      {
        name,
        service_category,
        contact_info,
        rating: rating ? parseInt(rating, 10) : null,
        notes,
        visibility_scope
      },
      req.user.id,
      req.user.role
    );

    const statusCode = req.user.role === 'admin' ? 201 : 202; // 202 Accepted for pending moderation
    const message = req.user.role === 'admin'
      ? 'Vendor created successfully'
      : 'Vendor submitted for moderation';

    res.status(statusCode).json({
      message,
      vendor
    });
  } catch (error) {
    if (error.message.includes('required')) {
      return next(new ApiError(400, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create vendor'));
  }
};

/**
 * PUT /api/vendors/:id - Update a vendor (admin only)
 */
const updateVendorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate rating if provided
    if (updates.rating !== undefined && updates.rating !== null) {
      const ratingNum = parseInt(updates.rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return next(new ApiError(400, 'Rating must be between 1 and 5'));
      }
      updates.rating = ratingNum;
    }

    // Validate visibility_scope if provided
    if (updates.visibility_scope && !['public', 'members', 'admins'].includes(updates.visibility_scope)) {
      return next(new ApiError(400, 'Invalid visibility_scope. Must be: public, members, or admins'));
    }

    // Validate moderation_state if provided
    if (updates.moderation_state && !['pending', 'approved', 'denied'].includes(updates.moderation_state)) {
      return next(new ApiError(400, 'Invalid moderation_state. Must be: pending, approved, or denied'));
    }

    const vendor = await vendorDirectoryService.updateVendor(
      parseInt(id, 10),
      updates,
      req.user.id
    );

    res.status(200).json({
      message: 'Vendor updated successfully',
      vendor
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update vendor'));
  }
};

/**
 * DELETE /api/vendors/:id - Delete a vendor (admin only)
 */
const deleteVendorController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await vendorDirectoryService.deleteVendor(parseInt(id, 10), req.user.id);

    res.status(200).json({
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to delete vendor'));
  }
};

/**
 * PATCH /api/vendors/:id/moderate - Update vendor moderation state (admin only)
 */
const moderateVendorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { moderation_state } = req.body;

    if (!moderation_state) {
      return next(new ApiError(400, 'Missing required field: moderation_state'));
    }

    if (!['pending', 'approved', 'denied'].includes(moderation_state)) {
      return next(new ApiError(400, 'Invalid moderation_state. Must be: pending, approved, or denied'));
    }

    const vendor = await vendorDirectoryService.updateModerationState(
      parseInt(id, 10),
      moderation_state,
      req.user.id
    );

    res.status(200).json({
      message: 'Vendor moderation state updated successfully',
      vendor
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Invalid moderation state')) {
      return next(new ApiError(400, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to moderate vendor'));
  }
};

/**
 * GET /api/vendors/stats - Get vendor statistics (admin only)
 */
const getVendorStatsController = async (req, res, next) => {
  try {
    const stats = await vendorDirectoryService.getVendorStats();

    res.status(200).json({
      stats
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve vendor statistics'));
  }
};

module.exports = {
  getVendorsController,
  getVendorByIdController,
  createVendorController,
  updateVendorController,
  deleteVendorController,
  moderateVendorController,
  getVendorStatsController
};
