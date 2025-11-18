const { Announcement, User, Sequelize } = require('../../models'); // Adjust path if models are not in root/models
const Op = Sequelize.Op; // Get Op from the Sequelize class/constructor
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const auditService = require('./audit.service');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Creates a new announcement record in the database.
 * @param {object} announcementData - Data for the new announcement.
 * @param {string} announcementData.title - Title of the announcement.
 * @param {string} announcementData.content - Content of the announcement.
 * @param {string} [announcementData.expiresAt] - Optional expiration date in ISO format.
 * @param {number|string} userId - The ID of the admin user creating the announcement.
 * @returns {Promise<object>} The created announcement object.
 * @throws {Error} If there's an error during database interaction.
 */
const emailService = require('./email.service');
const { renderTemplate } = require('../emails/render');

async function createAnnouncement(announcementData, userId) {
  try {
    const { title, content, expiresAt, notify } = announcementData;

    const sanitizedContent = DOMPurify.sanitize(content);

    const dataToCreate = {
      title,
      content: sanitizedContent,
      created_by: userId,
    };

    if (expiresAt) {
      dataToCreate.expires_at = expiresAt; // Assuming model field is expires_at
    }
    // Note: The announcement.model.js provided does not have an 'expires_at' field.
    // If it's intended to be stored, the model and migration need to be updated.
    // For now, this code includes it conditionally based on the task description.
    // If 'expiresAt' is not a field in the DB, Sequelize will ignore it or error depending on strictness.

    const newAnnouncement = await Announcement.create(dataToCreate);

    try {
      await auditService.logAdminAction(userId, 'announcement_create', { announcementId: newAnnouncement.id, title: newAnnouncement.title });
    } catch (auditError) {
      console.error('Failed to log admin action for announcement_create:', auditError);
    }

    const created = newAnnouncement.toJSON();

    // Optional: notify members by email
    if (notify) {
      try {
        const recipients = await User.findAll({
          where: {
            status: 'approved',
            email_verified: true,
            is_system_user: false,
          },
          attributes: ['email', 'name'],
        });

        if (recipients.length > 0) {
          const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
          const html = renderTemplate('announcement.html', {
            title,
            content: sanitizedContent,
            link: `${baseUrl}/announcements`,
          });
          const subject = `New Announcement: ${title}`;
          for (const r of recipients) {
            await emailService.sendMail({
              to: r.email,
              subject,
              html,
              text: `A new announcement has been posted: ${title}\n${baseUrl}/announcements`,
            });
          }
        }
      } catch (notifyErr) {
        console.warn('Announcement created, but failed to send notifications:', notifyErr.message);
      }
    }

    return created; // Return plain JSON object
  } catch (error) {
    // Log the error for server-side debugging if necessary
    // console.error('Error creating announcement:', error);
    throw error; // Re-throw the error to be handled by the controller
  }
}

/**
 * Lists announcements with pagination, filtering, and sorting.
 * @param {object} options - Options for listing announcements.
 * @param {number} [options.page=1] - The current page number.
 * @param {number} [options.limit=10] - The number of items per page.
 * @param {string} [options.status] - Filter by status (e.g., 'active').
 * @param {string} [options.sortBy='createdAt'] - Field to sort by.
 * @param {string} [options.sortOrder='DESC'] - Sort order ('ASC' or 'DESC').
 * @returns {Promise<object>} An object containing the list of announcements and pagination details.
 * @throws {Error} If there's an error during database interaction.
 */
async function listAnnouncements(options) {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt', // Default sort field
      sortOrder = 'DESC', // Default sort order
    } = options;

    // Ensure page and limit are positive integers
    const numPage = parseInt(page, 10);
    const numLimit = parseInt(limit, 10);

    if (isNaN(numPage) || numPage < 1) {
      // Consider throwing a specific error type or handling as per project conventions
      throw new Error('Page number must be a positive integer.');
    }
    if (isNaN(numLimit) || numLimit < 1) {
      throw new Error('Limit must be a positive integer.');
    }

    const offset = (numPage - 1) * numLimit;
    const whereClause = {};

    if (status === 'active') {
      whereClause[Op.or] = [
        { expires_at: { [Op.is]: null } },
        { expires_at: { [Op.gt]: new Date() } },
      ];
    }

    // Validate sortOrder
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    const orderClause = [[sortBy, validSortOrder]];

    const { count, rows } = await Announcement.findAndCountAll({
      where: whereClause,
      limit: numLimit,
      offset,
      order: orderClause,
      include: [{
        model: User,
        as: 'creator', // This alias must match the association in Announcement model
        attributes: ['id', 'name'], // Specify desired user fields
      }],
      distinct: true, // Important for correct count with include and limit
    });

    return {
      data: rows.map(row => row.toJSON()), // Return plain JSON objects
      totalItems: count,
      totalPages: Math.ceil(count / numLimit),
      currentPage: numPage,
      limit: numLimit,
    };
  } catch (error) {
    // Optional: Log error for server-side debugging
    // console.error('Error listing announcements:', error);
    throw error; // Re-throw the error to be handled by the controller/error middleware
  }
}

/**
 * Updates an existing announcement.
 * @param {number|string} announcementId - The ID of the announcement to update.
 * @param {object} updateData - Data to update the announcement with.
 * @param {string} [updateData.title] - New title for the announcement.
 * @param {string} [updateData.content] - New content for the announcement.
 * @param {string|null} [updateData.expires_at] - New expiration date (ISO format) or null to clear.
 * @param {number|string} adminUserId - The ID of the admin user performing the update.
 * @returns {Promise<object>} The updated announcement object.
 * @throws {Error} If announcement not found (statusCode 404) or other database error.
 */
async function updateAnnouncement(announcementId, updateData, adminUserId) {
  try {
    const announcement = await Announcement.findByPk(announcementId);

    if (!announcement) {
      const error = new Error('Announcement not found');
      error.statusCode = 404;
      throw error;
    }

    const updatedFields = [];
    if (updateData.hasOwnProperty('title') && updateData.title !== announcement.title) {
      announcement.title = updateData.title;
      updatedFields.push('title');
    }
    if (updateData.hasOwnProperty('content')) {
      const sanitizedNewContent = DOMPurify.sanitize(updateData.content);
      if (sanitizedNewContent !== announcement.content) {
        announcement.content = sanitizedNewContent;
        updatedFields.push('content');
      }
    }
    // For expires_at, handle explicit null to clear the date
    if (updateData.hasOwnProperty('expires_at') && updateData.expires_at !== announcement.expires_at) {
      // Ensure null is correctly handled if the current value is a date string or vice-versa
      if (updateData.expires_at === null && announcement.expires_at !== null) {
        announcement.expires_at = null;
        updatedFields.push('expires_at');
      } else if (updateData.expires_at !== null && new Date(updateData.expires_at).toISOString() !== (announcement.expires_at ? new Date(announcement.expires_at).toISOString() : null)) {
        announcement.expires_at = updateData.expires_at; // This can be null or a date string
        updatedFields.push('expires_at');
      }
    }

    if (updatedFields.length > 0) {
      await announcement.save();
      // Audit Log
      try {
        await auditService.logAdminAction(adminUserId, 'announcement_update', { announcementId, updatedFields: updatedFields });
      } catch (auditError) {
        console.error('Failed to log admin action for announcement_update:', auditError);
      }
    }

    return announcement.toJSON();
  } catch (error) {
    // console.error('Error updating announcement:', error);
    throw error;
  }
}

/**
 * Deletes an announcement by its ID.
 * @param {number|string} announcementId - The ID of the announcement to delete.
 * @param {number|string} adminUserId - The ID of the admin user performing the deletion.
 * @returns {Promise<boolean>} True if deletion was successful.
 * @throws {Error} If announcement not found (statusCode 404) or other database error.
 */
async function deleteAnnouncement(announcementId, adminUserId) {
  try {
    const announcement = await Announcement.findByPk(announcementId);

    if (!announcement) {
      const error = new Error('Announcement not found');
      error.statusCode = 404;
      throw error;
    }

    await announcement.destroy();
    // Audit Log
    try {
      await auditService.logAdminAction(adminUserId, 'announcement_delete', { announcementId });
    } catch (auditError) {
      console.error('Failed to log admin action for announcement_delete:', auditError);
    }
    return true; // Or return nothing for a 204 No Content response handling in controller
  } catch (error) {
    // console.error('Error deleting announcement:', error);
    throw error;
  }
}

module.exports = {
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};
