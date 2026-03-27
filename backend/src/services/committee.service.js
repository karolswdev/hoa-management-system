const { Committee, CommitteeMember, User } = require('../../models');
const auditService = require('./audit.service');
const logger = require('../config/logger');

const MEMBER_ATTRIBUTES = ['id', 'name', 'email'];

/**
 * Create a new committee.
 */
const createCommittee = async (data, adminId) => {
  const committee = await Committee.create({
    name: data.name,
    description: data.description || null,
    status: 'active',
    approval_expiration_days: data.approval_expiration_days ?? 365
  });

  await auditService.logAdminAction(adminId, 'committee_created', {
    committee_id: committee.id,
    name: committee.name
  });

  logger.info('Committee created', { committeeId: committee.id, name: committee.name });
  return committee;
};

/**
 * Update an existing committee.
 */
const updateCommittee = async (committeeId, data, adminId) => {
  const committee = await Committee.findByPk(committeeId);
  if (!committee) {
    throw new Error('Committee not found');
  }

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.approval_expiration_days !== undefined) updates.approval_expiration_days = data.approval_expiration_days;

  await committee.update(updates);

  await auditService.logAdminAction(adminId, 'committee_updated', {
    committee_id: committeeId,
    updates
  });

  return committee;
};

/**
 * Deactivate a committee (soft-delete).
 */
const deactivateCommittee = async (committeeId, adminId) => {
  const committee = await Committee.findByPk(committeeId);
  if (!committee) {
    throw new Error('Committee not found');
  }

  await committee.update({ status: 'inactive' });

  await auditService.logAdminAction(adminId, 'committee_deactivated', {
    committee_id: committeeId,
    name: committee.name
  });

  return committee;
};

/**
 * List all active committees with member counts.
 */
const listCommittees = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? {} : { status: 'active' };

  const committees = await Committee.findAll({
    where,
    include: [{
      model: CommitteeMember,
      as: 'members',
      include: [{
        model: User,
        as: 'user',
        attributes: MEMBER_ATTRIBUTES
      }]
    }],
    order: [['name', 'ASC']]
  });

  return committees;
};

/**
 * Get a single committee with its members.
 */
const getCommitteeById = async (committeeId) => {
  const committee = await Committee.findByPk(committeeId, {
    include: [{
      model: CommitteeMember,
      as: 'members',
      include: [{
        model: User,
        as: 'user',
        attributes: MEMBER_ATTRIBUTES
      }]
    }]
  });

  if (!committee) {
    throw new Error('Committee not found');
  }

  return committee;
};

/**
 * Add a member to a committee.
 */
const addMember = async (committeeId, userId, role, adminId) => {
  const committee = await Committee.findByPk(committeeId);
  if (!committee) {
    throw new Error('Committee not found');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.status !== 'approved') {
    throw new Error('User must be approved to be appointed to a committee');
  }
  if (user.is_system_user) {
    throw new Error('System users cannot be appointed to committees');
  }

  const existing = await CommitteeMember.findOne({
    where: { committee_id: committeeId, user_id: userId }
  });
  if (existing) {
    throw new Error('User is already a member of this committee');
  }

  const membership = await CommitteeMember.create({
    committee_id: committeeId,
    user_id: userId,
    role: role || 'member',
    appointed_at: new Date()
  });

  await auditService.logAdminAction(adminId, 'committee_member_added', {
    committee_id: committeeId,
    user_id: userId,
    role: membership.role
  });

  logger.info('Committee member added', {
    committeeId,
    userId,
    role: membership.role
  });

  return membership;
};

/**
 * Remove a member from a committee.
 */
const removeMember = async (committeeId, userId, adminId) => {
  const membership = await CommitteeMember.findOne({
    where: { committee_id: committeeId, user_id: userId }
  });

  if (!membership) {
    throw new Error('User is not a member of this committee');
  }

  await membership.destroy();

  await auditService.logAdminAction(adminId, 'committee_member_removed', {
    committee_id: committeeId,
    user_id: userId
  });

  logger.info('Committee member removed', { committeeId, userId });
};

/**
 * Check if a user is a member of a specific committee.
 */
const isCommitteeMember = async (userId, committeeId) => {
  const membership = await CommitteeMember.findOne({
    where: { committee_id: committeeId, user_id: userId }
  });
  return !!membership;
};

/**
 * Get all committee memberships for a user.
 */
const getUserCommittees = async (userId) => {
  const memberships = await CommitteeMember.findAll({
    where: { user_id: userId },
    include: [{
      model: Committee,
      as: 'committee',
      where: { status: 'active' }
    }]
  });
  return memberships;
};

module.exports = {
  createCommittee,
  updateCommittee,
  deactivateCommittee,
  listCommittees,
  getCommitteeById,
  addMember,
  removeMember,
  isCommitteeMember,
  getUserCommittees
};
