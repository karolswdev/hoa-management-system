const express = require('express');
const documentController = require('../controllers/document.controller');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware'); // Multer upload middleware
const multer = require('multer'); // Ensure multer is imported for error handling

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

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'File type not allowed.' });
    }
    // You can handle other multer errors here as well, e.g., file size limit
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large.' });
    }
    // For any other multer error.
    return res.status(400).json({ message: err.message });
  }
  // If the error is not a Multer error, pass it to the next (global) error handler.
  next(err);
});

module.exports = router;