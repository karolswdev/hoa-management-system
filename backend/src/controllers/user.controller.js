const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

/**
 * Controller to get the authenticated user's own profile.
 */
const getOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth.middleware sets req.user.id
    if (!userId) {
      // This case should ideally be caught by auth middleware, but as a safeguard:
      return res.status(401).json({ error: 'Unauthorized - User ID not found in token' });
    }

    const userProfile = await userService.fetchOwnProfile(userId);

    if (!userProfile) {
      // This case implies the user ID from a valid token doesn't exist in DB, which is unusual.
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error in getOwnProfile controller:', error);
    // Generic error for unexpected issues
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
};

/**
 * Controller to update the authenticated user's own profile.
 */
const updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth.middleware sets req.user.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - User ID not found in token' });
    }

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Map errors to the specified format: { "errors": [ { "field": "name", "message": "..." } ] }
      const formattedErrors = errors.array().map(err => ({
        field: err.path, // express-validator uses 'path' for field name
        message: err.msg,
      }));
      return res.status(400).json({ errors: formattedErrors });
    }

    const updateData = req.body;

    // The service layer will handle which fields are actually updatable (e.g., only 'name')
    const updatedUserProfile = await userService.modifyOwnProfile(userId, updateData);

    if (!updatedUserProfile) {
      // This could happen if the user was deleted between auth and this call, or if service validation fails internally
      return res.status(404).json({ error: 'User profile not found or update failed.' });
    }

    res.status(200).json(updatedUserProfile);
  } catch (error) {
    console.error('Error in updateOwnProfile controller:', error);
    if (error.isValidationError) { // Check for custom validation error from service
        return res.status(400).json({ errors: [{ field: error.field || 'general', message: error.message }] });
    }
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
};

/**
 * Controller to change the authenticated user's own password.
 */
const changeOwnPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - User ID not found in token' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Check for specific "currentPassword" or "newPassword" missing errors first
      const missingCurrentPassword = errors.array().find(err => err.path === 'currentPassword' && err.msg.includes('required'));
      const missingNewPassword = errors.array().find(err => err.path === 'newPassword' && err.msg.includes('required'));

      if (missingCurrentPassword || missingNewPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }
      
      // Handle password complexity error specifically
      const complexityError = errors.array().find(err => err.path === 'newPassword' && err.msg.includes('complexity') || err.msg.includes('must include'));
      if (complexityError) {
          return res.status(400).json({ error: "New password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character." });
      }

      // Fallback for other validation errors (though schema is specific)
      const formattedErrors = errors.array().map(err => ({ field: err.path, message: err.msg, }));
      return res.status(400).json({ errors: formattedErrors });
    }

    const { currentPassword, newPassword } = req.body;

    await userService.updateOwnPassword(userId, currentPassword, newPassword);

    res.status(200).json({ message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Error in changeOwnPassword controller:', error);
    if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Incorrect current password.' });
    }
    if (error.statusCode === 400) { // For service-level validation errors if any
        return res.status(400).json({ error: error.message || "Failed to change password due to invalid input." });
    }
    // Default to 500 for other errors
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  changeOwnPassword,
};