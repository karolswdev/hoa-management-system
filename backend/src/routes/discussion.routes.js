const express = require('express');
const discussionController = require('../controllers/discussion.controller');
const validate = require('../middlewares/validate.middleware');
const { createThreadSchema, createReplySchema, listThreadsSchema } = require('../validators/discussion.validator');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const isAdmin = authorizeRoles('admin');

const router = express.Router();

router.post(
  '/',
  verifyToken,
  validate(createThreadSchema),
  discussionController.createThreadController
);

router.post(
  '/:threadId/replies',
  verifyToken,
  validate(createReplySchema),
  discussionController.createReplyController
);

// GET /api/discussions - List all main discussion threads
router.get(
  '/',
  verifyToken,
  validate(listThreadsSchema, 'query'), // Validate query parameters
  discussionController.listThreadsController
);

// GET /api/discussions/:threadId - View a specific thread with its replies
router.get(
  '/:threadId',
  verifyToken,
  discussionController.viewThreadController
);

// DELETE a discussion thread (Admin only)
router.delete(
  '/:threadId',
  verifyToken,
  isAdmin,
  discussionController.deleteThreadController
);

// DELETE a specific reply (Admin only)
router.delete(
  '/replies/:replyId',
  verifyToken,
  isAdmin,
  discussionController.deleteReplyController
);

// GET /api/discussions/code-of-conduct/acceptance - Get user's CoC acceptance status
router.get(
  '/code-of-conduct/acceptance',
  verifyToken,
  discussionController.getCodeOfConductAcceptanceController
);

// POST /api/discussions/code-of-conduct/accept - Accept Code of Conduct
router.post(
  '/code-of-conduct/accept',
  verifyToken,
  discussionController.acceptCodeOfConductController
);

module.exports = router;