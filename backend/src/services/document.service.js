const { Document, User, sequelize } = require('../../models'); // Adjust path if models are not in root/models
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const ApiError = require('../utils/ApiError');
const auditService = require('./audit.service');

/**
 * Creates a new document record in the database.
 * @param {object} documentData - Data for the new document.
 * @param {string} documentData.title - Title of the document.
 * @param {string} [documentData.description] - Optional description.
 * @param {string} documentData.originalFileName - The original name of the uploaded file (from Multer's `req.file.originalname`).
 * @param {string} documentData.storedFileName - The unique name of the file as stored on the server (from Multer's `req.file.filename`).
 * @param {string} documentData.filePath - The path to the file on the server.
 * @param {number} documentData.uploadedBy - The ID of the user who uploaded the document.
 * @param {boolean} documentData.isPublic - Whether the document is public.
 * @returns {Promise<object>} The created document object.
 */
async function createDocument(documentData) {
  const {
    title,
    description,
    originalFileName,
    storedFileName, // This is req.file.filename from Multer
    filePath,       // This is req.file.path from Multer
    uploadedBy,
    isPublic,
  } = documentData;

  // Determine 'approved' status based on 'is_public' as per plan
  const approved = !!isPublic; // Converts boolean isPublic to 0 or 1 if DB expects integer, or true/false

  const newDocument = await Document.create({
    title,
    description: description || null, // Ensure null if empty, or handle in model
    file_name: storedFileName, // This is the unique name for storage
    original_file_name: originalFileName, // Added to store the original filename
    file_path: filePath,       // Full path to the file on server
    uploaded_by: uploadedBy,
    is_public: isPublic,
    approved: approved,
    // uploaded_at will be set by Sequelize's `createdAt`
  });

  try {
    await auditService.logAdminAction(uploadedBy, 'document_upload', { documentId: newDocument.id, originalName: newDocument.original_file_name, uploaderUserId: uploadedBy });
  } catch (auditError) {
    console.error('Failed to log admin action for document_upload:', auditError);
  }

  return newDocument.toJSON(); // Return plain JSON object
}

/**
 * Lists documents based on user authentication and role.
 * @param {object} [user] - Optional user object (from req.user).
 * @param {object} options - Pagination options { limit, offset }.
 * @returns {Promise<object>} An object containing the list of documents and count.
 */
async function listDocuments(user, { limit = 10, offset = 0 }) {
  const whereClause = {};
  const includeClause = [{
    model: User,
    as: 'uploader',
    attributes: ['id', 'name'] // Only include uploader's ID and name
  }];

  if (!user) { // Guest user
    whereClause.is_public = true;
    whereClause.approved = true;
  } else if (user.role === 'admin') {
    // Admin sees all documents
  } else { // Authenticated member
    whereClause.approved = true;
    // Members see all approved documents (public and non-public)
  }

  const { count, rows } = await Document.findAndCountAll({
    where: whereClause,
    include: includeClause,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['uploaded_at', 'DESC']],
    attributes: { exclude: ['uploaded_by'] } // Exclude direct foreign key, use include for uploader info
  });

  return { count, documents: rows };
}

/**
 * Retrieves a specific document's metadata by ID, respecting access permissions.
 * @param {number} documentId - The ID of the document.
 * @param {object} [user] - Optional user object (from req.user).
 * @returns {Promise<object|null>} The document metadata or null if not found/not allowed.
 */
async function getDocumentMetadataById(documentId, user) {
  const document = await Document.findByPk(documentId, {
    include: [{
      model: User,
      as: 'uploader',
      attributes: ['id', 'name']
    }],
    attributes: { exclude: ['uploaded_by'] }
  });

  if (!document) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }

  // Access Control
  if (!user) { // Guest
    if (!document.is_public || !document.approved) {
      const error = new Error('Access denied to this document.');
      error.statusCode = 403;
      throw error;
    }
  } else if (user.role !== 'admin') { // Member
    if (!document.approved) {
      const error = new Error('Access denied to this document.');
      error.statusCode = 403;
      throw error;
    }
    // Members can see all approved documents (public or not)
    // If a document is approved, a member can see it.
    // If it's also public, a guest can see it.
    // If it's not public but approved, only members and admins can see it.
    // This logic seems correct.
  }
  // Admin can see everything, no explicit check needed here if previous conditions handle others.

  return document.toJSON();
}

/**
 * Retrieves a document for download, checking permissions.
 * @param {number} documentId - The ID of the document.
 * @param {object} [user] - Optional user object (from req.user).
 * @returns {Promise<object|null>} The document object if download is permitted, otherwise null or throws error.
 * @throws {Error} If access is denied with a specific status code.
 */
async function getDocumentForDownload(documentId, user) {
  const document = await Document.findByPk(documentId);

  if (!document) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }

  // Access Control based on download_document.php logic (User Story 9)
  // 1. If document approved != 1 AND user is not 'admin': Deny access (403).
  // 2. If document is_public != 1 AND user is not authenticated: Deny access (401/403).
  // 3. Otherwise, allow download.

  if (!document.approved && (!user || user.role !== 'admin')) {
    const error = new Error('Access Denied: Document not approved for download.');
    error.statusCode = 403;
    throw error;
  }

  if (!document.is_public && !user) {
    const error = new Error('Access Denied: Authentication required to download this document.');
    error.statusCode = 401; // Or 403, 401 is more specific for "auth required"
    throw error;
  }

  // If all checks pass, return the document object (contains file_path, file_name)
  return document.toJSON();
}


/**
 * Approves a document by its ID.
 * @param {number} documentId - The ID of the document to approve.
 * @param {number} adminUserId - The ID of the admin performing the action.
 * @returns {Promise<object>} The updated document object.
 * @throws {ApiError} If the document is not found.
 */
async function approveDocumentById(documentId, adminUserId) {
  const document = await Document.findByPk(documentId);

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  document.approved = true;
  await document.save();

  try {
    await auditService.logAdminAction(adminUserId, 'document_approve', { documentId });
  } catch (auditError) {
    console.error('Failed to log admin action for document_approve:', auditError);
  }

  return document.toJSON();
}

/**
 * Deletes a document by its ID.
 * This includes deleting the physical file if it exists.
 * @param {number} documentId - The ID of the document to delete.
 * @param {number} adminUserId - The ID of the admin performing the action.
 * @returns {Promise<boolean>} True if deletion was successful.
 * @throws {ApiError} If the document is not found.
 */
async function deleteDocumentById(documentId, adminUserId) {
  const document = await Document.findByPk(documentId);

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  if (document.file_path) {
    // document.file_path is expected to be an absolute path from Multer (req.file.path).
    try {
      await fs.unlink(document.file_path);
      console.log(`Successfully deleted physical file: ${document.file_path}`);
    } catch (err) {
      console.error(`Error deleting physical file ${document.file_path}: `, err);
      // Log error but proceed with DB deletion as per requirements.
    }
  }

  await document.destroy();
  try {
    await auditService.logAdminAction(adminUserId, 'document_delete', { documentId });
  } catch (auditError) {
    console.error('Failed to log admin action for document_delete:', auditError);
  }

  return true;
}


module.exports = {
  createDocument,
  listDocuments,
  getDocumentMetadataById,
  getDocumentForDownload,
  approveDocumentById,
  deleteDocumentById,
};