const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware'); // Custom validation middleware
const { updateProfileSchema, changePasswordSchema } = require('../validators/user.validator');

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
  validate(updateProfileSchema),        // Apply validation rules
  userController.updateOwnProfile
);

// Route to change the authenticated user's own password
// PUT /api/users/me/password
router.put(
  '/me/password',
  authMiddleware.verifyToken,    // Protects the route
  validate(changePasswordSchema),
  userController.changeOwnPassword
);

module.exports = router;