const arcRequestService = require('../services/arcRequest.service');
const committeeService = require('../services/committee.service');
const configService = require('../services/config.service');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/arc-requests - List ARC requests
 */
const listArcRequestsController = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get user's committee memberships
    const memberships = await committeeService.getUserCommittees(userId);
    const committeeIds = memberships.map(m => m.committee_id);

    const result = await arcRequestService.listArcRequests({
      userId,
      committeeIds,
      isAdmin,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.status(200).json(result);
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve ARC requests'));
  }
};

/**
 * GET /api/arc-requests/:id - Get ARC request detail
 */
const getArcRequestController = async (req, res, next) => {
  try {
    const arcRequestId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Check committee membership
    const memberships = await committeeService.getUserCommittees(userId);
    const committeeIds = memberships.map(m => m.committee_id);

    // We need to check if user is a committee member for the specific request's committee
    // This is determined inside the service, but we pass a hint
    const result = await arcRequestService.getArcRequestById(arcRequestId, {
      userId,
      isCommitteeMember: committeeIds.length > 0,
      isAdmin
    });

    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Access denied')) {
      return next(new ApiError(403, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve ARC request'));
  }
};

/**
 * POST /api/arc-requests - Create ARC request
 */
const createArcRequestController = async (req, res, next) => {
  try {
    const { property_address, category_id, description, submit_immediately } = req.body;

    if (!property_address || !category_id || !description) {
      return next(new ApiError(400, 'property_address, category_id, and description are required'));
    }

    // Get default ARC committee from config
    const defaultCommitteeId = await configService.getConfigValue('arc_default_committee_id');
    if (!defaultCommitteeId) {
      return next(new ApiError(500, 'ARC committee not configured. Contact an administrator.'));
    }

    const result = await arcRequestService.createArcRequest({
      submitterId: req.user.id,
      propertyAddress: property_address,
      categoryId: parseInt(category_id, 10),
      description,
      committeeId: parseInt(defaultCommitteeId, 10),
      submitImmediately: submit_immediately !== false
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('Invalid or inactive')) {
      return next(new ApiError(400, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create ARC request'));
  }
};

/**
 * PUT /api/arc-requests/:id - Update ARC request (draft only)
 */
const updateArcRequestController = async (req, res, next) => {
  try {
    const arcRequestId = parseInt(req.params.id, 10);
    const { property_address, category_id, description } = req.body;

    const arcRequest = await arcRequestService.updateArcRequest(
      arcRequestId,
      { property_address, category_id, description },
      req.user.id
    );

    res.status(200).json({ arcRequest });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Only the submitter') || error.message.includes('only be updated')) {
      return next(new ApiError(403, error.message));
    }
    if (error.message.includes('Invalid or inactive')) {
      return next(new ApiError(400, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update ARC request'));
  }
};

module.exports = {
  listArcRequestsController,
  getArcRequestController,
  createArcRequestController,
  updateArcRequestController
};
