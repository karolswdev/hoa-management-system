const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

/**
 * Controller to get the authenticated user's own profile.
 */
const getOwnProfile = async (req, res, next) => {
    // This function doesn't change, but we add 'next' for consistency
    try {
        const userProfile = await userService.fetchOwnProfile(req.user.id);
        if (!userProfile) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.status(200).json(userProfile);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update the authenticated user's own profile.
 */
const updateOwnProfile = async (req, res, next) => {
  try {
    // The validation is already done by the middleware!
    const updatedUserProfile = await userService.modifyOwnProfile(req.user.id, req.body);
    res.status(200).json(updatedUserProfile);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to change the authenticated user's own password.
 */
const changeOwnPassword = async (req, res, next) => {
  try {
    // The validation is already done! We just call the service.
    const { currentPassword, newPassword } = req.body;
    await userService.updateOwnPassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    // The service throws an error with a statusCode, which we pass to the global handler
    next(error);
  }
};

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  changeOwnPassword,
};