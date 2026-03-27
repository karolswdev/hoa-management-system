const workflowService = require('../services/workflow.service');
const committeeService = require('../services/committee.service');
const ApiError = require('../utils/ApiError');
const path = require('path');

/**
 * GET /api/workflows - List workflow instances
 */
const listWorkflowsController = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get user's committee memberships for filtering
    const memberships = await committeeService.getUserCommittees(userId);
    const committeeIds = memberships.map(m => m.committee_id);

    const result = await workflowService.listWorkflows({
      userId,
      committeeIds,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      viewAll: isAdmin
    });

    res.status(200).json(result);
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve workflows'));
  }
};

/**
 * GET /api/workflows/:id - Get workflow detail
 */
const getWorkflowController = async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);
    const isCommitteeMember = req.workflowAuth?.isCommitteeMember || false;

    const workflow = await workflowService.getWorkflowById(workflowId, {
      userId: req.user.id,
      isCommitteeMember
    });

    res.status(200).json({ workflow });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve workflow'));
  }
};

/**
 * POST /api/workflows/:id/transitions - Perform status transition
 */
const performTransitionController = async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);
    const { to_status, comment, expiration_days } = req.body;

    if (!to_status) {
      return next(new ApiError(400, 'to_status is required'));
    }

    const result = await workflowService.performTransition(
      workflowId,
      to_status,
      req.user.id,
      comment,
      { expirationDays: expiration_days }
    );

    res.status(200).json({
      workflow: result.workflow,
      transition: result.transition
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Invalid transition') || error.message.includes('Maximum number')) {
      return next(new ApiError(400, error.message));
    }
    if (error.message.includes('Only the submitter') || error.message.includes('Only committee members') || error.message.includes('only be performed by the system')) {
      return next(new ApiError(403, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to perform transition'));
  }
};

/**
 * POST /api/workflows/:id/comments - Add comment
 */
const addCommentController = async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);
    const { content, is_internal } = req.body;

    if (!content || !content.trim()) {
      return next(new ApiError(400, 'Comment content is required'));
    }

    const comment = await workflowService.addComment(
      workflowId,
      req.user.id,
      content,
      !!is_internal
    );

    res.status(201).json({ comment });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Only committee members')) {
      return next(new ApiError(403, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to add comment'));
  }
};

/**
 * POST /api/workflows/:id/attachments - Upload attachment(s)
 */
const addAttachmentController = async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);

    if (!req.files || req.files.length === 0) {
      return next(new ApiError(400, 'At least one file is required'));
    }

    const attachments = [];
    for (const file of req.files) {
      const attachment = await workflowService.addAttachment(
        workflowId,
        req.user.id,
        file
      );
      attachments.push(attachment);
    }

    res.status(201).json({ attachments });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    if (error.message.includes('Maximum attachment limit')) {
      return next(new ApiError(400, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to upload attachment'));
  }
};

/**
 * GET /api/workflows/:id/attachments/:attachmentId/download - Download attachment
 */
const downloadAttachmentController = async (req, res, next) => {
  try {
    const attachmentId = parseInt(req.params.attachmentId, 10);
    const attachment = await workflowService.getAttachment(attachmentId);

    res.download(
      path.resolve(attachment.file_path),
      attachment.original_file_name
    );
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ApiError(404, error.message));
    }
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to download attachment'));
  }
};

module.exports = {
  listWorkflowsController,
  getWorkflowController,
  performTransitionController,
  addCommentController,
  addAttachmentController,
  downloadAttachmentController
};
