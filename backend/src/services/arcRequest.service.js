const { ArcRequest, ArcCategory, User, WorkflowInstance, Committee } = require('../../models');
const workflowService = require('./workflow.service');
const auditService = require('./audit.service');
const logger = require('../config/logger');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const REQUEST_TYPE = 'arc_request';

// --- ARC Request CRUD ---

/**
 * Create an ARC request and its associated workflow instance.
 */
const createArcRequest = async ({ submitterId, propertyAddress, categoryId, description, committeeId, submitImmediately = true }) => {
  const sequelize = ArcRequest.sequelize;

  const result = await sequelize.transaction(async (transaction) => {
    // Validate category
    const category = await ArcCategory.findByPk(categoryId, { transaction });
    if (!category || !category.is_active) {
      throw new Error('Invalid or inactive category');
    }

    // Validate committee
    const committee = await Committee.findByPk(committeeId, { transaction });
    if (!committee || committee.status !== 'active') {
      throw new Error('Invalid or inactive committee');
    }

    // Create the domain-specific request
    const arcRequest = await ArcRequest.create({
      submitter_id: submitterId,
      property_address: purify.sanitize(propertyAddress),
      category_id: categoryId,
      description: purify.sanitize(description)
    }, { transaction });

    // Create the workflow instance
    const workflow = await workflowService.createWorkflowInstance({
      committeeId,
      requestType: REQUEST_TYPE,
      requestId: arcRequest.id,
      submittedBy: submitterId,
      submitImmediately
    }, transaction);

    return { arcRequest, workflow };
  });

  // Audit logging after transaction commit to avoid SQLite BUSY errors
  await auditService.logAdminAction(submitterId, 'arc_request_created', {
    arc_request_id: result.arcRequest.id,
    workflow_id: result.workflow.id,
    category_id: categoryId,
    property_address: propertyAddress
  });

  logger.info('ARC request created', {
    arcRequestId: result.arcRequest.id,
    workflowId: result.workflow.id,
    submitterId
  });

  return result;
};

/**
 * Get an ARC request by ID with workflow data.
 */
const getArcRequestById = async (arcRequestId, { userId, isCommitteeMember = false, isAdmin = false } = {}) => {
  const arcRequest = await ArcRequest.findByPk(arcRequestId, {
    include: [
      {
        model: User,
        as: 'submitter',
        attributes: ['id', 'name']
      },
      {
        model: ArcCategory,
        as: 'category',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!arcRequest) {
    throw new Error('ARC request not found');
  }

  // Get associated workflow
  const workflow = await workflowService.getWorkflowByRequest(REQUEST_TYPE, arcRequestId);
  if (!workflow) {
    throw new Error('Workflow not found for this ARC request');
  }

  // Authorization check
  const isSubmitter = arcRequest.submitter_id === userId;
  if (!isSubmitter && !isCommitteeMember && !isAdmin) {
    throw new Error('Access denied');
  }

  // Draft visibility: only submitter can see drafts
  if (workflow.status === 'draft' && !isSubmitter) {
    throw new Error('Access denied');
  }

  // Get full workflow details
  const workflowDetail = await workflowService.getWorkflowById(workflow.id, {
    userId,
    isCommitteeMember
  });

  return { arcRequest, workflow: workflowDetail };
};

/**
 * List ARC requests with filtering based on user role.
 */
const listArcRequests = async ({ userId, committeeIds = [], isAdmin = false, status, page = 1, limit = 20 } = {}) => {
  // Use workflow service for listing since that's where status lives
  const workflowResult = await workflowService.listWorkflows({
    userId,
    committeeIds,
    status,
    page,
    limit,
    viewAll: isAdmin
  });

  // Filter to only arc_request type
  const arcWorkflows = workflowResult.data.filter(w => w.request_type === REQUEST_TYPE);

  // Enrich with ARC request data
  const enriched = await Promise.all(arcWorkflows.map(async (wf) => {
    const arcRequest = await ArcRequest.findByPk(wf.request_id, {
      include: [
        { model: ArcCategory, as: 'category', attributes: ['id', 'name'] }
      ]
    });
    return {
      id: arcRequest?.id,
      property_address: arcRequest?.property_address,
      category: arcRequest?.category,
      description: arcRequest?.description,
      workflow: {
        id: wf.id,
        status: wf.status,
        committee: wf.committee,
        submitter: wf.submitter,
        expires_at: wf.expires_at,
        created_at: wf.created_at,
        updated_at: wf.updated_at
      }
    };
  }));

  return {
    data: enriched.filter(Boolean),
    pagination: workflowResult.pagination
  };
};

/**
 * Update an ARC request (only in draft status).
 */
const updateArcRequest = async (arcRequestId, data, userId) => {
  const arcRequest = await ArcRequest.findByPk(arcRequestId);
  if (!arcRequest) {
    throw new Error('ARC request not found');
  }

  if (arcRequest.submitter_id !== userId) {
    throw new Error('Only the submitter can update this request');
  }

  const workflow = await workflowService.getWorkflowByRequest(REQUEST_TYPE, arcRequestId);
  if (!workflow || workflow.status !== 'draft') {
    throw new Error('Request can only be updated while in draft status');
  }

  const updates = {};
  if (data.property_address !== undefined) updates.property_address = purify.sanitize(data.property_address);
  if (data.description !== undefined) updates.description = purify.sanitize(data.description);
  if (data.category_id !== undefined) {
    const category = await ArcCategory.findByPk(data.category_id);
    if (!category || !category.is_active) {
      throw new Error('Invalid or inactive category');
    }
    updates.category_id = data.category_id;
  }

  await arcRequest.update(updates);
  return arcRequest;
};

// --- ARC Category CRUD ---

/**
 * List active ARC categories.
 */
const listCategories = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? {} : { is_active: true };
  return await ArcCategory.findAll({
    where,
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

/**
 * Create an ARC category.
 */
const createCategory = async (data, adminId) => {
  const category = await ArcCategory.create({
    name: data.name,
    description: data.description || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    sort_order: data.sort_order || 0
  });

  await auditService.logAdminAction(adminId, 'arc_category_created', {
    category_id: category.id,
    name: category.name
  });

  return category;
};

/**
 * Update an ARC category.
 */
const updateCategory = async (categoryId, data, adminId) => {
  const category = await ArcCategory.findByPk(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

  await category.update(updates);

  await auditService.logAdminAction(adminId, 'arc_category_updated', {
    category_id: categoryId,
    updates
  });

  return category;
};

/**
 * Deactivate an ARC category (soft-delete).
 */
const deactivateCategory = async (categoryId, adminId) => {
  const category = await ArcCategory.findByPk(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }

  await category.update({ is_active: false });

  await auditService.logAdminAction(adminId, 'arc_category_deactivated', {
    category_id: categoryId,
    name: category.name
  });

  return category;
};

module.exports = {
  REQUEST_TYPE,
  createArcRequest,
  getArcRequestById,
  listArcRequests,
  updateArcRequest,
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory
};
