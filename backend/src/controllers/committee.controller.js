const committeeService = require('../services/committee.service');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/committees - List all active committees
 */
const listCommitteesController = async (req, res, next) => {
  try {
    const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
    const committees = await committeeService.listCommittees({ includeInactive });
    res.status(200).json({ committees });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve committees'));
  }
};

/**
 * GET /api/committees/:id - Get committee detail with members
 */
const getCommitteeController = async (req, res, next) => {
  try {
    const committee = await committeeService.getCommitteeById(parseInt(req.params.id, 10));
    res.status(200).json({ committee });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve committee'));
  }
};

/**
 * POST /api/committees - Create committee (admin only)
 */
const createCommitteeController = async (req, res, next) => {
  try {
    const { name, description, approval_expiration_days } = req.body;
    if (!name) {
      return next(new ApiError(400, 'Committee name is required'));
    }

    const committee = await committeeService.createCommittee(
      { name, description, approval_expiration_days },
      req.user.id
    );
    res.status(201).json({ committee });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(409, 'A committee with this name already exists'));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to create committee'));
  }
};

/**
 * PUT /api/committees/:id - Update committee (admin only)
 */
const updateCommitteeController = async (req, res, next) => {
  try {
    const { name, description, status, approval_expiration_days } = req.body;
    const committee = await committeeService.updateCommittee(
      parseInt(req.params.id, 10),
      { name, description, status, approval_expiration_days },
      req.user.id
    );
    res.status(200).json({ committee });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(409, 'A committee with this name already exists'));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to update committee'));
  }
};

/**
 * DELETE /api/committees/:id - Deactivate committee (admin only)
 */
const deactivateCommitteeController = async (req, res, next) => {
  try {
    await committeeService.deactivateCommittee(parseInt(req.params.id, 10), req.user.id);
    res.status(200).json({ message: 'Committee deactivated' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to deactivate committee'));
  }
};

/**
 * POST /api/committees/:id/members - Add member to committee (admin only)
 */
const addMemberController = async (req, res, next) => {
  try {
    const { user_id, role } = req.body;
    if (!user_id) {
      return next(new ApiError(400, 'user_id is required'));
    }
    if (role && !['member', 'chair'].includes(role)) {
      return next(new ApiError(400, 'Role must be "member" or "chair"'));
    }

    const membership = await committeeService.addMember(
      parseInt(req.params.id, 10),
      parseInt(user_id, 10),
      role,
      req.user.id
    );
    res.status(201).json({ membership });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('already a member')) {
      return next(new ApiError(409, error.message));
    }
    if (error.message.includes('must be approved') || error.message.includes('System users')) {
      return next(new ApiError(400, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to add member'));
  }
};

/**
 * DELETE /api/committees/:id/members/:userId - Remove member from committee (admin only)
 */
const removeMemberController = async (req, res, next) => {
  try {
    await committeeService.removeMember(
      parseInt(req.params.id, 10),
      parseInt(req.params.userId, 10),
      req.user.id
    );
    res.status(200).json({ message: 'Member removed from committee' });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to remove member'));
  }
};

module.exports = {
  listCommitteesController,
  getCommitteeController,
  createCommitteeController,
  updateCommitteeController,
  deactivateCommitteeController,
  addMemberController,
  removeMemberController
};
