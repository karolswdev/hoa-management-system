const express = require('express');
const boardController = require('../controllers/board.controller');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middlewares/auth.middleware');
const verifyTurnstile = require('../middlewares/captcha.middleware');
const { boardContactLimiter } = require('../config/rate-limit');

const router = express.Router();
const isAdmin = authorizeRoles('admin');

// Public/member routes with optional authentication

// GET /api/board - Get current board roster
// Visibility enforced by service layer based on auth status
router.get('/', optionalAuth, boardController.getCurrentRosterController);

// GET /api/board/history - Get board history
// Members-only access enforced by service layer
router.get('/history', optionalAuth, boardController.getBoardHistoryController);

// POST /api/board/contact - Submit contact request
// Public with CAPTCHA and rate limiting
router.post(
  '/contact',
  boardContactLimiter,
  verifyTurnstile,
  boardController.submitContactRequestController
);

// Admin-only routes for board member CRUD

// GET /api/board/titles - Get all board titles (public)
router.get('/titles', boardController.getAllBoardTitlesController);

// POST /api/board/titles - Create board title (admin only)
router.post('/titles', verifyToken, isAdmin, boardController.createBoardTitleController);

// PUT /api/board/titles/:id - Update board title (admin only)
router.put('/titles/:id', verifyToken, isAdmin, boardController.updateBoardTitleController);

// DELETE /api/board/titles/:id - Delete board title (admin only)
router.delete('/titles/:id', verifyToken, isAdmin, boardController.deleteBoardTitleController);

// POST /api/board/members - Create board member (admin only)
router.post('/members', verifyToken, isAdmin, boardController.createBoardMemberController);

// PUT /api/board/members/:id - Update board member (admin only)
router.put('/members/:id', verifyToken, isAdmin, boardController.updateBoardMemberController);

// DELETE /api/board/members/:id - Delete board member (admin only)
router.delete('/members/:id', verifyToken, isAdmin, boardController.deleteBoardMemberController);

module.exports = router;
