const express = require('express');
const documentController = require('../controllers/document.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Middleware to make authentication optional for these routes
router.use(optionalAuth);

// GET /api/documents
router.get('/', documentController.listDocuments);

// GET /api/documents/:documentId
router.get('/:documentId', documentController.getDocumentMetadata);

// GET /api/documents/:documentId/download
router.get('/:documentId/download', documentController.downloadDocument);

module.exports = router;