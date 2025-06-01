const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { updateProfileSchema, changePasswordSchema, validate } = require('../validators/user.validator');

// Route to get the authenticated user's own profile
// GET /api/users/me
router.get(
  '/me',
  authMiddleware.verifyToken, // Protects the route, ensures req.user is populated
  userController.getOwnProfile
);

// Route to update the authenticated user's own profile
// PUT /api/users/me
router.put(
  '/me',
  authMiddleware.verifyToken, // Protects the route
  updateProfileSchema,        // Apply validation rules
  validate,                   // Middleware to handle validation results
  userController.updateOwnProfile
);

// Route to change the authenticated user's own password
// PUT /api/users/me/password
router.put(
  '/me/password',
  authMiddleware.verifyToken,    // Protects the route
  changePasswordSchema,       // Apply validation rules for password change
  validate,                   // Middleware to handle validation results
  userController.changeOwnPassword
);

module.exports = router;