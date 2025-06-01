const express = require('express');
const documentController = require('../controllers/document.controller');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware'); // Multer upload middleware

const router = express.Router();

// --- Admin Document Routes ---

/**
 * @swagger
 * /api/admin/documents: // This path is for admin actions, distinct from public /api/documents
 *   post:
 *     summary: Upload a new document (Admin only)
 *     tags: [Documents Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documentFile
 *               - title
 *               - is_public
 *             properties:
 *               documentFile:
 *                 type: string
 *                 format: binary
 *                 description: The document file to upload.
 *               title:
 *                 type: string
 *                 example: Meeting Minutes Q1
 *               description:
 *                 type: string
 *                 example: Detailed minutes from the first quarter HOA meeting.
 *               is_public:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Document uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document:
 *                   $ref: '#/components/schemas/DocumentResponse' # To be defined
 *       400:
 *         description: Validation failed, no file uploaded, file type not allowed, or file too large.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  upload.single('documentFile'), // 'documentFile' is the field name in the form-data
  documentController.uploadDocument
);

// Other admin document routes (approve, delete) will be added here later.

/**
 * @swagger
 * /api/documents/{id}/approve:
 *   put:
 *     summary: Approve a document (Admin only)
 *     tags: [Documents Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the document to approve
 *     responses:
 *       200:
 *         description: Document approved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentResponse'
 *       400:
 *         description: Invalid document ID format.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Document not found.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/:id/approve',
  verifyToken,
  authorizeRoles('admin'),
  documentController.adminApproveDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document (Admin only)
 *     tags: [Documents Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the document to delete
 *     responses:
 *       204:
 *         description: Document deleted successfully.
 *       400:
 *         description: Invalid document ID format.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Document not found.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  documentController.adminDeleteDocument
);


// --- Public/User Document Routes ---

// Middleware to make authentication optional for the following routes
// The controller/service will handle logic based on whether req.user exists
router.use(optionalAuth);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List available documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: [] # Optional
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: A list of documents.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DocumentResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', documentController.listDocuments);

/**
 * @swagger
 * /api/documents/{documentId}:
 *   get:
 *     summary: Get a specific document's metadata
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: [] # Optional
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the document
 *     responses:
 *       200:
 *         description: Document metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentResponse'
 *       400:
 *         description: Invalid document ID format
 *       404:
 *         description: Document not found or access denied
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:documentId', documentController.getDocumentMetadata);

/**
 * @swagger
 * /api/documents/{documentId}/download:
 *   get:
 *     summary: Download a specific document file
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: [] # Optional, but required for non-public or unapproved (for admin)
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the document to download
 *     responses:
 *       200:
 *         description: Document file. Content-Type will vary.
 *         content:
 *           application/*: # Represents various file types
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid document ID format
 *       401:
 *         description: Authentication required for this document
 *       403:
 *         description: Access denied to this document
 *       404:
 *         description: Document not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:documentId/download', documentController.downloadDocument);


// Placeholder for DocumentResponse schema (to be defined in Swagger setup or a common schemas file)
// components:
//   schemas:
//     DocumentResponse:
//       type: object
//       properties:
//         id:
//           type: integer
//         title:
//           type: string
//         description:
//           type: string
//         file_name:
//           type: string
//         file_path:
//           type: string
//         uploaded_by:
//           type: integer
//         uploaded_at:
//           type: string
//           format: date-time
//         approved:
//           type: boolean
//         is_public:
//           type: boolean
//         updated_at:
//           type: string
//           format: date-time


module.exports = router;