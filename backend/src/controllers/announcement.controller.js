const announcementService = require('../services/announcement.service.js');

/**
 * Handles the creation of a new announcement.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function createAnnouncement(req, res, next) {
  try {
    const announcementData = req.body; // Contains title, content, expiresAt (optional)
    const userId = req.user.id; // Assuming auth middleware sets req.user

    const newAnnouncement = await announcementService.createAnnouncement(announcementData, userId);

    res.status(201).json(newAnnouncement);
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
}

/**
 * Handles listing announcements with pagination, filtering, and sorting.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function listAnnouncements(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status || 'active';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    if (page <= 0) {
      return res.status(400).json({ message: 'Page must be a positive integer.' });
    }
    if (limit <= 0) {
      return res.status(400).json({ message: 'Limit must be a positive integer.' });
    }

    const allowedSortOrders = ['ASC', 'DESC'];
    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({ message: `sortOrder must be one of: ${allowedSortOrders.join(', ')}` });
    }
    // TODO: Add validation for allowed values of status and sortBy if specified in plan
    // Example: const allowedSortByFields = ['createdAt', 'title', 'expires_at'];
    // if (!allowedSortByFields.includes(sortBy)) {
    //   return res.status(400).json({ message: `sortBy must be one of: ${allowedSortByFields.join(', ')}` });
    // }

    const options = { page, limit, status, sortBy, sortOrder };

    const result = await announcementService.listAnnouncements(options);
    // Ensure the controller correctly uses the key returned by the service.
    // If the service now returns data, the controller should reflect that
    // when constructing the response.
    res.status(200).json({
      data: result.data,
      pagination: {
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        limit: result.limit,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles updating an existing announcement.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function updateAnnouncement(req, res, next) {
  try {
    const { id: announcementId } = req.params;
    const updateData = req.body; // Contains optional title, content, expires_at
    const adminUserId = req.user.id; // Assuming auth middleware sets req.user

    // Input validation for req.body is handled by Joi middleware via routes
    // Sanitization for content (if HTML) would be here or in service. Assuming plain text.

    const updatedAnnouncement = await announcementService.updateAnnouncement(announcementId, updateData, adminUserId);
    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    // For other errors, including potential validation errors from service if not caught by Joi
    // or other DB errors.
    // The technical spec mentions 400 for validation errors, but Joi middleware handles that before this controller.
    // If service layer throws a validation error (e.g. invalid date format not caught by Joi),
    // it might not have a statusCode.
    // For simplicity, passing to generic error handler which might result in 500.
    // A more robust error handling might map specific error types to 400 here.
    next(error);
  }
}

/**
 * Handles deleting an announcement.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function deleteAnnouncement(req, res, next) {
  try {
    const { id: announcementId } = req.params;
    const adminUserId = req.user.id; // Assuming auth middleware sets req.user

    await announcementService.deleteAnnouncement(announcementId, adminUserId);
    res.status(204).send(); // No content to send back
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error); // Pass to generic error handler
  }
}

module.exports = {
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};