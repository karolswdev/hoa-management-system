const {
  WorkflowInstance,
  WorkflowTransition,
  WorkflowComment,
  WorkflowAttachment,
  Committee,
  CommitteeMember,
  User
} = require('../../models');
const { Op } = require('sequelize');
const auditService = require('./audit.service');
const logger = require('../config/logger');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// --- State Machine Definition ---

const VALID_STATUSES = [
  'draft', 'submitted', 'under_review', 'approved', 'denied',
  'withdrawn', 'appealed', 'appeal_under_review', 'appeal_approved',
  'appeal_denied', 'expired'
];

const TRANSITIONS = {
  draft:                  ['submitted'],
  submitted:              ['under_review', 'withdrawn'],
  under_review:           ['approved', 'denied', 'withdrawn'],
  denied:                 ['appealed'],
  appealed:               ['appeal_under_review'],
  appeal_under_review:    ['appeal_approved', 'appeal_denied'],
  approved:               ['expired'],
  appeal_approved:        ['expired']
};

// Who can trigger each transition
const TRANSITION_AUTH = {
  'draft->submitted':                       'submitter',
  'submitted->under_review':                'committee',
  'submitted->withdrawn':                   'submitter',
  'under_review->approved':                 'committee',
  'under_review->denied':                   'committee',
  'under_review->withdrawn':                'submitter',
  'denied->appealed':                       'submitter',
  'appealed->appeal_under_review':          'committee',
  'appeal_under_review->appeal_approved':   'committee',
  'appeal_under_review->appeal_denied':     'committee',
  'approved->expired':                      'system',
  'appeal_approved->expired':               'system'
};

/**
 * Validate that a transition is allowed by the state machine.
 */
const isValidTransition = (fromStatus, toStatus) => {
  const allowed = TRANSITIONS[fromStatus];
  return allowed && allowed.includes(toStatus);
};

/**
 * Check who is authorized for a specific transition.
 */
const getTransitionAuthType = (fromStatus, toStatus) => {
  return TRANSITION_AUTH[`${fromStatus}->${toStatus}`] || null;
};

// --- Workflow CRUD ---

/**
 * Create a workflow instance tied to a domain-specific request.
 */
const createWorkflowInstance = async ({ committeeId, requestType, requestId, submittedBy, submitImmediately = true }, transaction = null) => {
  const options = transaction ? { transaction } : {};

  const workflow = await WorkflowInstance.create({
    committee_id: committeeId,
    request_type: requestType,
    request_id: requestId,
    status: submitImmediately ? 'submitted' : 'draft',
    submitted_by: submittedBy,
    appeal_count: 0
  }, options);

  // Record initial transition
  const initialStatus = submitImmediately ? 'submitted' : 'draft';
  await WorkflowTransition.create({
    workflow_id: workflow.id,
    from_status: 'new',
    to_status: initialStatus,
    performed_by: submittedBy,
    comment: submitImmediately ? 'Request submitted' : 'Draft created'
  }, options);

  // Audit logging is deferred to after transaction commit to avoid SQLite BUSY errors.
  // The caller (arcRequest.service) handles audit logging after the transaction.

  return workflow;
};

/**
 * Get a workflow instance by ID with all related data.
 * Performs lazy expiration check.
 */
const getWorkflowById = async (workflowId, { userId = null, isCommitteeMember = false } = {}) => {
  const workflow = await WorkflowInstance.findByPk(workflowId, {
    include: [
      {
        model: Committee,
        as: 'committee',
        attributes: ['id', 'name', 'status', 'approval_expiration_days']
      },
      {
        model: User,
        as: 'submitter',
        attributes: ['id', 'name']
      },
      {
        model: WorkflowTransition,
        as: 'transitions',
        include: [{ model: User, as: 'performer', attributes: ['id', 'name'] }],
        order: [['created_at', 'ASC']]
      },
      {
        model: WorkflowComment,
        as: 'comments',
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
        order: [['created_at', 'ASC']]
      },
      {
        model: WorkflowAttachment,
        as: 'attachments',
        include: [{ model: User, as: 'uploader', attributes: ['id', 'name'] }],
        order: [['created_at', 'ASC']]
      }
    ]
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  // Lazy expiration check
  await checkAndExpire(workflow);

  // Filter internal comments for non-committee members
  if (!isCommitteeMember) {
    workflow.dataValues.comments = workflow.comments.filter(c => !c.is_internal);
  }

  return workflow;
};

/**
 * List workflow instances with filtering.
 */
const listWorkflows = async ({ userId, committeeIds = [], status, page = 1, limit = 20, viewAll = false } = {}) => {
  const where = {};

  if (!viewAll) {
    if (committeeIds.length > 0) {
      // Committee member: see own requests + committee requests
      where[Op.or] = [
        { submitted_by: userId },
        { committee_id: { [Op.in]: committeeIds } }
      ];
    } else {
      // Regular member: only own requests
      where.submitted_by = userId;
    }
  }

  if (status) {
    where.status = status;
  }

  // Exclude drafts from committee views (only submitter sees drafts)
  if (committeeIds.length > 0 && !viewAll) {
    // Already handled by the OR clause — submitter sees their own drafts,
    // committee members see submitted+ for their committee
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await WorkflowInstance.findAndCountAll({
    where,
    include: [
      {
        model: Committee,
        as: 'committee',
        attributes: ['id', 'name']
      },
      {
        model: User,
        as: 'submitter',
        attributes: ['id', 'name']
      }
    ],
    order: [['updated_at', 'DESC']],
    limit,
    offset
  });

  // Lazy expiration check on results
  for (const wf of rows) {
    await checkAndExpire(wf);
  }

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit
    }
  };
};

/**
 * Perform a status transition on a workflow instance.
 */
const performTransition = async (workflowId, toStatus, userId, comment = null, { expirationDays = null } = {}) => {
  const sequelize = WorkflowInstance.sequelize;

  const result = await sequelize.transaction(async (transaction) => {
    // Lock the row for update
    const workflow = await WorkflowInstance.findByPk(workflowId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
      include: [{
        model: Committee,
        as: 'committee',
        attributes: ['id', 'approval_expiration_days']
      }]
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const fromStatus = workflow.status;

    // Validate transition
    if (!isValidTransition(fromStatus, toStatus)) {
      throw new Error(`Invalid transition from '${fromStatus}' to '${toStatus}'`);
    }

    // Validate authorization type
    const authType = getTransitionAuthType(fromStatus, toStatus);
    if (authType === 'submitter' && workflow.submitted_by !== userId) {
      throw new Error('Only the submitter can perform this transition');
    }
    if (authType === 'committee') {
      const isMember = await CommitteeMember.findOne({
        where: { committee_id: workflow.committee_id, user_id: userId },
        transaction
      });
      if (!isMember) {
        throw new Error('Only committee members can perform this transition');
      }
    }
    if (authType === 'system') {
      throw new Error('This transition can only be performed by the system');
    }

    // Handle appeal count
    if (toStatus === 'appealed') {
      if (workflow.appeal_count >= 1) {
        throw new Error('Maximum number of appeals (1) has been reached');
      }
      workflow.appeal_count = 1;
    }

    // Handle expiration for approvals
    if (toStatus === 'approved' || toStatus === 'appeal_approved') {
      const days = expirationDays ?? workflow.committee.approval_expiration_days;
      if (days > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        workflow.expires_at = expiresAt;
      }
    }

    // Update status
    workflow.status = toStatus;
    await workflow.save({ transaction });

    // Record transition
    const transition = await WorkflowTransition.create({
      workflow_id: workflowId,
      from_status: fromStatus,
      to_status: toStatus,
      performed_by: userId,
      comment: comment ? purify.sanitize(comment) : null
    }, { transaction });

    return { workflow, transition, fromStatus };
  });

  // Audit logging after transaction commit to avoid SQLite BUSY errors
  await auditService.logAdminAction(userId, 'workflow_transition', {
    workflow_id: workflowId,
    from_status: result.fromStatus,
    to_status: toStatus
  });

  logger.info('Workflow transition', {
    workflowId,
    fromStatus: result.fromStatus,
    toStatus,
    userId
  });

  return { workflow: result.workflow, transition: result.transition };
};

/**
 * Add a comment to a workflow instance.
 */
const addComment = async (workflowId, userId, content, isInternal = false) => {
  const workflow = await WorkflowInstance.findByPk(workflowId);
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  // Validate that internal comments are only by committee members
  if (isInternal) {
    const isMember = await CommitteeMember.findOne({
      where: { committee_id: workflow.committee_id, user_id: userId }
    });
    if (!isMember) {
      throw new Error('Only committee members can post internal comments');
    }
  }

  const sanitizedContent = purify.sanitize(content);

  const comment = await WorkflowComment.create({
    workflow_id: workflowId,
    user_id: userId,
    content: sanitizedContent,
    is_internal: isInternal
  });

  logger.info('Workflow comment added', {
    workflowId,
    userId,
    isInternal
  });

  return comment;
};

/**
 * Add an attachment to a workflow instance.
 */
const addAttachment = async (workflowId, userId, fileData) => {
  const workflow = await WorkflowInstance.findByPk(workflowId);
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  // Check attachment limit (max 20 per workflow)
  const currentCount = await WorkflowAttachment.count({
    where: { workflow_id: workflowId }
  });
  if (currentCount >= 20) {
    throw new Error('Maximum attachment limit (20) reached for this request');
  }

  const attachment = await WorkflowAttachment.create({
    workflow_id: workflowId,
    uploaded_by: userId,
    file_name: fileData.filename,
    original_file_name: fileData.originalname,
    file_path: fileData.path,
    mime_type: fileData.mimetype,
    file_size: fileData.size
  });

  logger.info('Workflow attachment added', {
    workflowId,
    userId,
    fileName: fileData.originalname
  });

  return attachment;
};

/**
 * Get a single attachment record.
 */
const getAttachment = async (attachmentId) => {
  const attachment = await WorkflowAttachment.findByPk(attachmentId, {
    include: [{
      model: WorkflowInstance,
      as: 'workflow',
      attributes: ['id', 'committee_id', 'submitted_by']
    }]
  });

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  return attachment;
};

/**
 * Lazy expiration check: if an approved request has passed its expiration date,
 * transition it to expired inline.
 */
const checkAndExpire = async (workflow) => {
  const expirableStatuses = ['approved', 'appeal_approved'];
  if (
    expirableStatuses.includes(workflow.status) &&
    workflow.expires_at &&
    new Date() > new Date(workflow.expires_at)
  ) {
    const previousStatus = workflow.status;
    workflow.status = 'expired';
    await workflow.save();

    // Record system transition
    await WorkflowTransition.create({
      workflow_id: workflow.id,
      from_status: previousStatus,
      to_status: 'expired',
      performed_by: workflow.submitted_by,
      comment: 'Approval expired (automated)'
    });

    logger.info('Workflow auto-expired', { workflowId: workflow.id, fromStatus: previousStatus });
  }
};

/**
 * Get workflow instance by polymorphic reference.
 */
const getWorkflowByRequest = async (requestType, requestId) => {
  const workflow = await WorkflowInstance.findOne({
    where: { request_type: requestType, request_id: requestId }
  });
  return workflow;
};

module.exports = {
  VALID_STATUSES,
  TRANSITIONS,
  TRANSITION_AUTH,
  isValidTransition,
  getTransitionAuthType,
  createWorkflowInstance,
  getWorkflowById,
  listWorkflows,
  performTransition,
  addComment,
  addAttachment,
  getAttachment,
  checkAndExpire,
  getWorkflowByRequest
};
