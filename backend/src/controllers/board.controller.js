const boardGovernanceService = require('../services/boardGovernance.service');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/board - Get current board roster
 * Public/Member access based on visibility config
 */
const getCurrentRosterController = async (req, res, next) => {
  try {
    const isAuthenticated = !!req.user;
    const roster = await boardGovernanceService.getCurrentRoster(isAuthenticated);

    res.status(200).json({
      roster,
      count: roster.length
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve board roster'));
  }
};

/**
 * GET /api/board/history - Get board history
 * Members-only access based on visibility config
 */
const getBoardHistoryController = async (req, res, next) => {
  try {
    const isAuthenticated = !!req.user;
    const history = await boardGovernanceService.getBoardHistory(isAuthenticated);

    res.status(200).json({
      history,
      count: history.length
    });
  } catch (error) {
    if (error.message.includes('only available to authenticated members')) {
      return next(new ApiError(403, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve board history'));
  }
};

/**
 * POST /api/board/contact - Submit contact request to board
 * Public access with CAPTCHA and rate limiting
 */
const submitContactRequestController = async (req, res, next) => {
  try {
    const { requestor_email, subject, message, captcha_token } = req.body;

    if (!requestor_email || !subject || !message) {
      return next(new ApiError(400, 'Missing required fields: requestor_email, subject, message'));
    }

    const result = await boardGovernanceService.submitContactRequest({
      requestor_email,
      subject,
      message,
      captcha_token
    });

    res.status(201).json({
      message: 'Contact request submitted successfully',
      ...result
    });
  } catch (error) {
    if (error.message.includes('No board members available')) {
      return next(new ApiError(503, 'Unable to process contact request at this time'));
    }
    if (error.message.includes('Failed to send contact request')) {
      return next(new ApiError(502, 'Failed to send contact request to board members'));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to submit contact request'));
  }
};

/**
 * POST /api/board/members - Create new board member (admin only)
 */
const createBoardMemberController = async (req, res, next) => {
  try {
    const { user_id, title_id, start_date, bio } = req.body;

    if (!user_id || !title_id || !start_date) {
      return next(new ApiError(400, 'Missing required fields: user_id, title_id, start_date'));
    }

    const boardMember = await boardGovernanceService.createBoardMember({
      user_id,
      title_id,
      start_date,
      bio
    });

    res.status(201).json({
      message: 'Board member created successfully',
      boardMember
    });
  } catch (error) {
    if (error.message.includes('already has an active board position')) {
      return next(new ApiError(409, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create board member'));
  }
};

/**
 * PUT /api/board/members/:id - Update board member (admin only)
 */
const updateBoardMemberController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const boardMember = await boardGovernanceService.updateBoardMember(parseInt(id, 10), updates);

    res.status(200).json({
      message: 'Board member updated successfully',
      boardMember
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update board member'));
  }
};

/**
 * DELETE /api/board/members/:id - Delete board member (admin only)
 */
const deleteBoardMemberController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await boardGovernanceService.deleteBoardMember(parseInt(id, 10));

    res.status(200).json({
      message: 'Board member deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to delete board member'));
  }
};

/**
 * GET /api/board/titles - Get all board titles
 */
const getAllBoardTitlesController = async (req, res, next) => {
  try {
    const titles = await boardGovernanceService.getAllBoardTitles();

    res.status(200).json({
      titles,
      count: titles.length
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve board titles'));
  }
};

/**
 * POST /api/board/titles - Create board title (admin only)
 */
const createBoardTitleController = async (req, res, next) => {
  try {
    const { title, rank } = req.body;

    if (!title || rank === undefined) {
      return next(new ApiError(400, 'Missing required fields: title, rank'));
    }

    const boardTitle = await boardGovernanceService.createBoardTitle({ title, rank });

    res.status(201).json({
      message: 'Board title created successfully',
      boardTitle
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return next(new ApiError(409, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create board title'));
  }
};

/**
 * PUT /api/board/titles/:id - Update board title (admin only)
 */
const updateBoardTitleController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const boardTitle = await boardGovernanceService.updateBoardTitle(parseInt(id, 10), updates);

    res.status(200).json({
      message: 'Board title updated successfully',
      boardTitle
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update board title'));
  }
};

/**
 * DELETE /api/board/titles/:id - Delete board title (admin only)
 */
const deleteBoardTitleController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await boardGovernanceService.deleteBoardTitle(parseInt(id, 10));

    res.status(200).json({
      message: 'Board title deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Cannot delete board title')) {
      return next(new ApiError(409, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to delete board title'));
  }
};

module.exports = {
  getCurrentRosterController,
  getBoardHistoryController,
  submitContactRequestController,
  createBoardMemberController,
  updateBoardMemberController,
  deleteBoardMemberController,
  getAllBoardTitlesController,
  createBoardTitleController,
  updateBoardTitleController,
  deleteBoardTitleController
};
