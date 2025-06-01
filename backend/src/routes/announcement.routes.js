const express = require('express');
const router = express.Router();
const { verifyToken: authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const isAdmin = authorizeRoles('admin'); // Create isAdmin middleware
const { createAnnouncementSchema, updateAnnouncementSchema } = require('../validators/announcement.validator');
const announcementController = require('../controllers/announcement.controller'); // Or import specific function
const validate = require('../middlewares/validate.middleware'); // Import validate middleware

// POST / (will be /api/admin/announcements/ when mounted) - Create a new announcement
router.post(
  '/',
  authenticateToken,
  isAdmin,
  validate(createAnnouncementSchema), // Wrap schema with validate middleware
  announcementController.createAnnouncement // Ensure this matches your controller export
);

// GET / (will be /api/announcements/ when mounted) - List announcements for users
router.get(
  '/',
  authenticateToken, // Assuming authenticated users can list
  announcementController.listAnnouncements
);

module.exports = router;

// PUT /:id - Update an announcement (Admin only)
router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  validate(updateAnnouncementSchema), // Wrap schema with validate middleware
  announcementController.updateAnnouncement
);

// DELETE /:id - Delete an announcement (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  announcementController.deleteAnnouncement
);