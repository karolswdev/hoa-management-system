const democracyService = require('../services/democracy.service');
const voteService = require('../services/vote.service');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/polls - Get active and scheduled polls
 * Public/Member access with optional filtering
 */
const getPollsController = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const isAuthenticated = !!req.user;

    const polls = await democracyService.getPolls({ type, status }, isAuthenticated);

    res.status(200).json({
      polls,
      count: polls.length,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve polls'));
  }
};

/**
 * GET /api/polls/:id - Get poll details by ID
 * Public/Member access
 */
const getPollByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeResults = req.query.include_results === 'true';

    const poll = await democracyService.getPollById(parseInt(id, 10), includeResults);

    res.status(200).json({
      poll
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve poll'));
  }
};

/**
 * POST /api/polls - Create a new poll (admin only)
 */
const createPollController = async (req, res, next) => {
  try {
    const { title, description, type, is_anonymous, notify_members, start_at, end_at, options } = req.body;

    // Validate required fields
    if (!title || !type || !start_at || !end_at || !options) {
      return next(new ApiError(400, 'Missing required fields: title, type, start_at, end_at, options'));
    }

    if (!Array.isArray(options) || options.length < 2) {
      return next(new ApiError(400, 'Poll must have at least 2 options'));
    }

    const poll = await democracyService.createPoll({
      title,
      description,
      type,
      is_anonymous,
      notify_members,
      start_at,
      end_at,
      options
    }, req.user.id);

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    if (error.message.includes('Invalid poll type')) {
      return next(new ApiError(400, error.message));
    }
    if (error.message.includes('End date must be after start date')) {
      return next(new ApiError(400, error.message));
    }
    if (error.message.includes('currently disabled')) {
      return next(new ApiError(403, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create poll'));
  }
};

/**
 * POST /api/polls/:id/votes - Cast a vote in a poll
 * Member access required
 */
const castVoteController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { option_id } = req.body;

    if (!option_id) {
      return next(new ApiError(400, 'Missing required field: option_id'));
    }

    // Generate correlation ID for audit trail
    const correlationId = uuidv4();

    const result = await democracyService.castVote({
      poll_id: parseInt(id, 10),
      user_id: req.user.id,
      option_id: parseInt(option_id, 10)
    }, correlationId);

    res.status(201).json({
      message: 'Vote cast successfully',
      ...result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('not started yet')) {
      return next(new ApiError(400, error.message));
    }
    if (error.message.includes('already closed')) {
      return next(new ApiError(400, error.message));
    }
    if (error.message.includes('Invalid poll option')) {
      return next(new ApiError(400, error.message));
    }
    if (error.message.includes('already voted')) {
      return next(new ApiError(409, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to cast vote'));
  }
};

/**
 * GET /api/polls/receipts/:code - Verify a vote receipt
 * Public access for verification
 */
const verifyReceiptController = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 16) {
      return next(new ApiError(400, 'Invalid receipt code format'));
    }

    const receipt = await voteService.verifyReceipt(code);

    if (!receipt) {
      // Return 404 in constant time to prevent timing attacks
      return res.status(404).json({
        message: 'Receipt not found'
      });
    }

    res.status(200).json({
      message: 'Receipt verified',
      receipt
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to verify receipt'));
  }
};

/**
 * GET /api/polls/:id/integrity - Validate hash chain integrity for a poll
 * Admin access only
 */
const validatePollIntegrityController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const validation = await voteService.validatePollHashChain(parseInt(id, 10));

    res.status(200).json({
      message: 'Hash chain validation completed',
      validation
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to validate poll integrity'));
  }
};

/**
 * GET /api/polls/:id/results - Get poll results (admin only, or public for closed polls)
 */
const getPollResultsController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const poll = await democracyService.getPollById(parseInt(id, 10), false);

    // Only allow results for closed polls or admins
    const isAdmin = req.user && req.user.role === 'admin';
    if (poll.status !== 'closed' && !isAdmin) {
      return next(new ApiError(403, 'Poll results are only available after the poll closes'));
    }

    const results = await democracyService.getVoteCounts(parseInt(id, 10));

    res.status(200).json({
      poll: {
        id: poll.id,
        title: poll.title,
        type: poll.type,
        status: poll.status
      },
      results
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve poll results'));
  }
};

module.exports = {
  getPollsController,
  getPollByIdController,
  createPollController,
  castVoteController,
  verifyReceiptController,
  validatePollIntegrityController,
  getPollResultsController
};
