const fs = require('fs');
const path = require('path');
const { User, Document, sequelize } = require('../../models'); // Adjust path as necessary
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError'); // Added for custom error handling
const auditService = require('./audit.service');

/**
 * Selects and returns publicly safe user profile fields.
 * @param {Object} user - The Sequelize user object.
 * @returns {Object} - An object containing safe user profile fields.
 */
const selectUserProfileFields = (user) => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

/**
 * Fetches the profile of the currently authenticated user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Object|null>} - The user profile or null if not found.
 */
const fetchOwnProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return null; // Or throw an error to be caught by the controller
    }
    return selectUserProfileFields(user);
  } catch (error) {
    console.error('Error fetching own profile:', error);
    throw error;
  }
};

/**
 * Modifies the profile of the currently authenticated user.
 * @param {number} userId - The ID of the user.
 * @param {Object} updateData - The data to update (e.g., { name: "New Name" }).
 * @returns {Promise<Object|null>} - The updated user profile or null if user not found.
 */
const modifyOwnProfile = async (userId, updateData) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return null; // Or throw an error
    }

    // Only allow 'name' to be updated for now
    if (updateData.name !== undefined) {
      // Basic validation: ensure name is not empty if provided
      if (typeof updateData.name !== 'string' || updateData.name.trim() === '') {
        const error = new Error('Name cannot be empty.');
        error.isValidationError = true; // Custom flag for validation errors
        error.field = 'name';
        throw error;
      }
      user.name = updateData.name.trim();
    }

    // Potentially add more updatable fields here in the future,
    // ensuring proper validation for each.
    // For example:
    // if (updateData.bio !== undefined) {
    //   user.bio = updateData.bio;
    // }

    await user.save();
    return selectUserProfileFields(user);
  } catch (error) {
    console.error('Error modifying own profile:', error);
    throw error;
  }
};

/**
 * Updates the password for the currently authenticated user.
 * @param {number} userId - The ID of the user.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password to set.
 * @returns {Promise<void>}
 * @throws {Error} - Throws error if user not found, current password incorrect, or new password invalid.
 */
const updateOwnPassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404; // Or handle as per your app's error strategy
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error('Incorrect current password.');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    // Password complexity validation is handled by express-validator,
    // but a service-level check could be added here if desired for extra safety
    // or if the service is used outside of a validated controller context.

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

  } catch (error) {
    console.error('Error updating own password:', error);
    // Re-throw with a more generic message or specific status code if needed
    if (!error.statusCode) {
        // Default to a server error if not already set
        const serviceError = new Error('Could not update password.');
        serviceError.statusCode = error.isValidationError ? 400 : 500; // Keep 400 for validation
        throw serviceError;
    }
    throw error;
  }
};


/**
 * Lists non-system users with pagination.
 * @param {Object} options - Pagination options.
 * @param {number} [options.limit=10] - Number of users to fetch.
 * @param {number} [options.offset=0] - Number of users to skip.
 * @returns {Promise<Object>} - An object containing 'rows' (users) and 'count' (total non-system users).
 */
const listNonSystemUsers = async ({ limit = 10, offset = 0 }) => {
  try {
    const { count, rows } = await User.findAndCountAll({
      where: {
        is_system_user: false,
      },
      attributes: {
        exclude: ['password'],
        include: ['id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'],
      },
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
    });
    return { rows: rows.map(selectUserProfileFields), count };
  } catch (error) {
    console.error('Error listing non-system users:', error);
    throw error;
  }
};

/**
 * Retrieves a single non-system user by their ID.
 * @param {number} userId - The ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The user object or null if not found or is a system user.
 */
const getNonSystemUserById = async (userId) => {
  try {
    const user = await User.findOne({
      where: {
        id: userId,
        is_system_user: false,
      },
      attributes: {
        exclude: ['password'],
        include: ['id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'],
      },
    });

    if (!user) {
      return null; // User not found or is a system user
    }

    return selectUserProfileFields(user);
  } catch (error) {
    console.error('Error retrieving non-system user by ID:', error);
    throw error;
  }
};


/**
 * Updates the status of a target user. (Admin operation)
 * @param {number} targetUserId - The ID of the user whose status is to be updated.
 * @param {string} newStatus - The new status to set.
 * @param {number} adminUserId - The ID of the admin performing the action.
 * @returns {Promise<Object>} - The updated user profile (excluding password).
 * @throws {ApiError} - Throws error if user not found or is a system user.
 */
const updateUserStatus = async (targetUserId, newStatus, adminUserId) => {
  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }
  if (targetUser.is_system_user === true) {
    throw new ApiError(403, 'System users cannot be modified.');
  }

  targetUser.status = newStatus;
  await targetUser.save();

  try {
    await auditService.logAdminAction(adminUserId, 'user_status_update', { targetUserId: targetUserId, newStatus: newStatus });
  } catch (auditError) {
    console.error('Failed to log admin action for user_status_update:', auditError);
  }

  return selectUserProfileFields(targetUser.toJSON());
};

/**
 * Updates the role of a target user. (Admin operation)
 * @param {number} targetUserId - The ID of the user whose role is to be updated.
 * @param {string} newRole - The new role to set.
 * @param {number} adminUserId - The ID of the admin performing the action.
 * @returns {Promise<Object>} - The updated user profile (excluding password).
 * @throws {ApiError} - Throws error if user not found or is a system user.
 */
const updateUserRole = async (targetUserId, newRole, adminUserId) => {
  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }
  if (targetUser.is_system_user === true) {
    throw new ApiError(403, 'System users cannot be modified.');
  }

  targetUser.role = newRole;
  await targetUser.save();

  try {
    await auditService.logAdminAction(adminUserId, 'user_role_update', { targetUserId: targetUserId, newRole: newRole });
  } catch (auditError) {
    console.error('Failed to log admin action for user_role_update:', auditError);
  }

  return selectUserProfileFields(targetUser.toJSON());
};

/**
 * Deletes a user and their associated documents. (Admin operation)
 * @param {number} targetUserId - The ID of the user to delete.
 * @param {number} adminUserId - The ID of the admin performing the action.
 * @returns {Promise<Object>} - Success object.
 * @throws {ApiError} - Throws error if user not found, is a system user, or deletion fails.
 */
const deleteUser = async (targetUserId, adminUserId) => {
  const t = await sequelize.transaction();

  try {
    const targetUser = await User.findByPk(targetUserId, { transaction: t });

    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    if (targetUser.is_system_user === true) {
      throw new ApiError(403, 'System users cannot be deleted.');
    }

    // Handle Associated Documents
    const userDocuments = await Document.findAll({
      where: { uploaded_by: targetUserId },
      transaction: t,
    });

    for (const doc of userDocuments) {
      if (doc.file_path) {
        // Assuming 'uploads/' is at the project root.
        // backend/src/services -> backend/src -> backend -> project_root
        const filePath = path.join(__dirname, '../../../uploads', doc.file_path);
        try {
          await fs.promises.unlink(filePath);
          console.log(`Successfully deleted physical file: ${filePath}`);
        } catch (fileError) {
          console.error(`Failed to delete physical file ${filePath}:`, fileError.message);
          // IMPORTANT: Re-throw to trigger transaction rollback
          throw new ApiError(500, `Failed to delete associated file ${doc.file_path}. User deletion rolled back.`);
        }
      }
      await doc.destroy({ transaction: t });
    }

    // Delete the User
    await targetUser.destroy({ transaction: t });

    // Commit the transaction
    await t.commit();

    // Audit Log
    try {
      await auditService.logAdminAction(adminUserId, 'user_delete', { targetUserId: targetUserId });
    } catch (auditError) {
      console.error('Failed to log admin action for user_delete:', auditError);
    }

    return { success: true, message: 'User and associated documents deleted successfully.' };
  } catch (error) {
    // Rollback transaction
    await t.rollback();

    // Log the original error for debugging
    console.error(`Failed to delete user [${targetUserId}]:`, error);

    // Re-throw the original ApiError or a new one for other errors
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to delete user. ${error.message}`);
  }
};

/**
 * Changes a user's password by an admin.
 * @param {number} targetUserId - The ID of the user whose password is to be changed.
 * @param {string} newPassword - The new password.
 * @param {number} adminUserId - The ID of the admin performing the action.
 * @returns {Promise&lt;Object&gt;} - Success object.
 * @throws {ApiError} - Throws error if user not found, is a system user, or update fails.
 */
const changeUserPasswordByAdmin = async (targetUserId, newPassword, adminUserId) => {
  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (targetUser.is_system_user === true) {
    throw new ApiError(403, 'System users cannot have their password changed by an admin.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  targetUser.password = hashedPassword;
  await targetUser.save();

  try {
    await auditService.logAdminAction(adminUserId, 'admin_change_user_password', { targetUserId: targetUserId });
  } catch (auditError) {
    console.error('Failed to log admin action for admin_change_user_password:', auditError);
  }

  return { success: true, message: 'Password changed successfully by admin.' };
};

module.exports = {
  fetchOwnProfile,
  modifyOwnProfile,
  updateOwnPassword,
  selectUserProfileFields, // Exporting for potential use in other services/controllers if needed
  listNonSystemUsers,
  getNonSystemUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  changeUserPasswordByAdmin,
};