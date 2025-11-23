const express = require('express');
const pollController = require('../controllers/poll.controller');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middlewares/auth.middleware');
const { defaultLimiter } = require('../config/rate-limit');

const router = express.Router();
const isAdmin = authorizeRoles('admin');
const isMember = authorizeRoles('member', 'admin');

// Public/member routes with optional authentication

// GET /api/polls - Get active and scheduled polls
// Accessible to all users (public + authenticated)
router.get('/', optionalAuth, pollController.getPollsController);

// GET /api/polls/receipts/:code - Verify vote receipt
// Public verification endpoint (constant-time response)
router.get('/receipts/:code', pollController.verifyReceiptController);

// GET /api/polls/:id - Get poll details
// Accessible to all users
router.get('/:id', optionalAuth, pollController.getPollByIdController);

// GET /api/polls/:id/results - Get poll results
// Accessible to all for closed polls, admin-only for active polls
router.get('/:id/results', optionalAuth, pollController.getPollResultsController);

// Member-only routes

// POST /api/polls/:id/votes - Cast a vote
// Member access required (authenticated users only)
router.post('/:id/votes', verifyToken, isMember, pollController.castVoteController);

// Admin-only routes

// POST /api/polls - Create a new poll
// Admin access required
router.post('/', verifyToken, isAdmin, pollController.createPollController);

// GET /api/polls/:id/integrity - Validate poll hash chain integrity
// Admin access required for integrity checks
router.get('/:id/integrity', verifyToken, isAdmin, pollController.validatePollIntegrityController);

module.exports = router;
