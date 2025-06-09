const userService = require('../services/user.service');
const { updateUserStatusSchema, updateUserRoleSchema, changePasswordSchema } = require('../validators/admin.user.validator');

/**
 * Handles listing all non-system users for admin.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function listUsers(req, res, next) {
  try {
    const { limit, offset } = req.query; // For pagination
    const result = await userService.listNonSystemUsers({ limit, offset });
    // Transform response to match frontend expectations: { users, count }
    return res.status(200).json({
      users: result.rows,
      count: result.count
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handles retrieving a specific non-system user by ID for admin.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function getUserById(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const user = await userService.getNonSystemUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found or is a system user.' });
    }
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles updating a user's status by admin.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function updateUserStatus(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const { error, value } = updateUserStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: error.details.map(d => d.message)
      });
    }

    const updatedUser = await userService.updateUserStatus(userId, value.status, req.user.id);
    // Audit logging will be handled by the service or a dedicated audit middleware/service later
    return res.status(200).json(updatedUser);

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * Handles updating a user's role by admin.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function updateUserRole(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const { error, value } = updateUserRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: error.details.map(d => d.message)
      });
    }

    const updatedUser = await userService.updateUserRole(userId, value.role, req.user.id);
    // Audit logging will be handled by the service or a dedicated audit middleware/service later
    return res.status(200).json(updatedUser);

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * Handles deleting a user by admin.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    await userService.deleteUser(userId, req.user.id);
    // Audit logging will be handled by the service or a dedicated audit middleware/service later
    return res.status(200).json({ message: 'User and associated data deleted successfully.' });
    // Or return res.status(204).send(); for No Content response

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * Handles changing a user's password by admin.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function changeUserPasswordByAdmin(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: error.details.map(d => d.message)
      });
    }

    await userService.changeUserPasswordByAdmin(userId, value.newPassword, req.user.id);
    // Audit logging will be handled by the service or a dedicated audit middleware/service later
    return res.status(200).json({ message: 'User password changed successfully.' });

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  changeUserPasswordByAdmin,
};