const express = require('express');
const vendorController = require('../controllers/vendor.controller');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middlewares/auth.middleware');
const { defaultLimiter } = require('../config/rate-limit');

const router = express.Router();
const isAdmin = authorizeRoles('admin');
const isMember = authorizeRoles('member', 'admin');

// Public/member routes with optional authentication

// GET /api/vendors/stats - Get vendor statistics (admin only)
// This route must come before /:id to avoid conflicts
router.get('/stats', verifyToken, isAdmin, vendorController.getVendorStatsController);

// GET /api/vendors - Get vendors with filtering
// Accessible to all users (public, members, admins) with different visibility levels
router.get('/', optionalAuth, vendorController.getVendorsController);

// GET /api/vendors/:id - Get vendor details
// Accessible to all users with visibility enforcement
router.get('/:id', optionalAuth, vendorController.getVendorByIdController);

// Member-only routes

// POST /api/vendors - Create a new vendor
// Members can submit for moderation, admins can directly approve
// Rate-limited to prevent abuse
router.post('/', verifyToken, isMember, defaultLimiter, vendorController.createVendorController);

// Admin-only routes

// PUT /api/vendors/:id - Update a vendor
// Admin access required for full vendor updates
router.put('/:id', verifyToken, isAdmin, vendorController.updateVendorController);

// DELETE /api/vendors/:id - Delete a vendor
// Admin access required for deletion
router.delete('/:id', verifyToken, isAdmin, vendorController.deleteVendorController);

// PATCH /api/vendors/:id/moderate - Update vendor moderation state
// Admin access required for moderation workflow
router.patch('/:id/moderate', verifyToken, isAdmin, vendorController.moderateVendorController);

module.exports = router;
