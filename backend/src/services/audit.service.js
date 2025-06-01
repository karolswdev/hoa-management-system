'use strict';

const { AuditLog, User } = require('../../models'); // Adjust path as necessary if models/index.js is elsewhere
const { Op } = require('sequelize');

/**
 * Logs an administrative action to the audit_logs table.
 * @param {number} adminId - The ID of the admin user performing the action.
 * @param {string} action - A string describing the action (e.g., 'user_update', 'document_delete').
 * @param {object|string} [details] - Optional details about the action, can be an object or a pre-formatted string.
 */
async function logAdminAction(adminId, action, details) {
  try {
    let detailsToStore = details;
    if (details && typeof details === 'object') {
      // Assuming the 'details' column in the database is TEXT, we need to stringify.
      // If it's a JSON/JSONB type, stringification might not be needed or handled by Sequelize.
      detailsToStore = JSON.stringify(details);
    }

    await AuditLog.create({
      admin_id: adminId,
      action: action,
      details: detailsToStore,
      // created_at is handled by defaultValue in the model/database
    });
  } catch (error) {
    console.error('Failed to log admin action:', {
      adminId,
      action,
      details,
      error: error.message,
    });
    // Do not let audit logging failure block the main operation.
    // Depending on requirements, you might want to notify an admin or use a more robust logging system here.
  }
}

async function getAuditLogs(options) {
  const offset = (options.page - 1) * options.limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    include: [{
      model: User,
      as: 'adminUser', // Ensure this alias matches the association in AuditLog model
      attributes: ['id', 'name', 'username'], // Select only needed user fields
    }],
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: offset,
  });

  const formattedLogs = rows.map(log => {
    let parsedDetails = log.details;
    if (typeof log.details === 'string') {
      try {
        parsedDetails = JSON.parse(log.details);
      } catch (e) {
        // Keep as string if not valid JSON, or handle error
        // console.error('Failed to parse audit log details:', e);
      }
    }
    return {
      id: log.id,
      admin_name: log.adminUser ? (log.adminUser.name || log.adminUser.username) : 'N/A',
      action: log.action,
      details: parsedDetails,
      created_at: log.created_at,
    };
  });

  const totalPages = Math.ceil(count / options.limit);

  return {
    data: formattedLogs,
    pagination: {
      totalItems: count,
      totalPages,
      currentPage: options.page,
      limit: options.limit,
    },
  };
}

module.exports = {
  logAdminAction,
  getAuditLogs,
};