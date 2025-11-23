const { Poll, PollOption, Vote, User, EmailAudit, ResidentNotificationLog, sequelize } = require('../../models');
const { Op } = require('sequelize');
const configService = require('./config.service');
const emailService = require('./email.service');
const voteService = require('./vote.service');
const auditService = require('./audit.service');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const logger = require('../config/logger');
const crypto = require('crypto');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Get active and scheduled polls with filtering options.
 *
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by poll type (informal, binding, straw-poll)
 * @param {string} options.status - Filter by status (active, scheduled, closed)
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @returns {Promise<Array>} Array of polls with options
 */
const getPolls = async ({ type, status } = {}, isAuthenticated = false) => {
  try {
    const where = {};
    const now = new Date();

    // Apply type filter if provided
    if (type) {
      where.type = type;
    }

    // Apply status filter
    if (status === 'active') {
      where.start_at = { [Op.lte]: now };
      where.end_at = { [Op.gte]: now };
    } else if (status === 'scheduled') {
      where.start_at = { [Op.gt]: now };
    } else if (status === 'closed') {
      where.end_at = { [Op.lt]: now };
    }

    const polls = await Poll.findAll({
      where,
      include: [
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'order_index'],
          separate: true,
          order: [['order_index', 'ASC']]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [['start_at', 'DESC']]
    });

    // Format response
    return polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      is_anonymous: poll.is_anonymous,
      start_at: poll.start_at,
      end_at: poll.end_at,
      status: getPollStatus(poll),
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        order_index: opt.order_index
      })),
      created_by: poll.creator ? poll.creator.name : 'Unknown',
      created_at: poll.created_at
    }));
  } catch (error) {
    logger.error('Failed to fetch polls', { error: error.message });
    throw error;
  }
};

/**
 * Get a single poll by ID with detailed information.
 *
 * @param {number} pollId - Poll ID
 * @param {boolean} includeResults - Whether to include vote counts
 * @returns {Promise<Object>} Poll details
 */
const getPollById = async (pollId, includeResults = false) => {
  try {
    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'order_index'],
          separate: true,
          order: [['order_index', 'ASC']]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    const result = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      is_anonymous: poll.is_anonymous,
      start_at: poll.start_at,
      end_at: poll.end_at,
      status: getPollStatus(poll),
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        order_index: opt.order_index
      })),
      created_by: poll.creator ? poll.creator.name : 'Unknown',
      created_at: poll.created_at
    };

    // Include vote counts if requested and poll is closed
    if (includeResults && getPollStatus(poll) === 'closed') {
      const voteCounts = await getVoteCounts(pollId);
      result.results = voteCounts;
    }

    return result;
  } catch (error) {
    logger.error('Failed to fetch poll', { pollId, error: error.message });
    throw error;
  }
};

/**
 * Create a new poll with options (admin only).
 *
 * @param {Object} pollData - Poll data
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<Object>} Created poll
 */
const createPoll = async (pollData, adminUserId) => {
  const transaction = await sequelize.transaction();

  try {
    const { title, description, type, is_anonymous, notify_members, start_at, end_at, options } = pollData;

    // Sanitize inputs
    const sanitizedTitle = purify.sanitize(title, { ALLOWED_TAGS: [] });
    const sanitizedDescription = description ? purify.sanitize(description, { ALLOWED_TAGS: [] }) : null;

    // Validate poll type
    const validTypes = ['informal', 'binding', 'straw-poll'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid poll type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate dates
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Check feature flags for binding polls
    if (type === 'binding') {
      const bindingEnabled = await configService.getConfigValue('polls.binding-enabled');
      if (bindingEnabled !== 'true') {
        throw new Error('Binding polls are currently disabled');
      }
    }

    // Create poll
    const poll = await Poll.create({
      title: sanitizedTitle,
      description: sanitizedDescription,
      type,
      is_anonymous: is_anonymous || false,
      notify_members: notify_members || false,
      start_at: startDate,
      end_at: endDate,
      created_by: adminUserId
    }, { transaction });

    // Create poll options
    if (!options || options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }

    const pollOptions = await Promise.all(
      options.map((option, index) =>
        PollOption.create({
          poll_id: poll.id,
          text: purify.sanitize(option.text, { ALLOWED_TAGS: [] }),
          order_index: option.order_index !== undefined ? option.order_index : index
        }, { transaction })
      )
    );

    await transaction.commit();

    // Log poll creation
    await auditService.logAdminAction(adminUserId, 'poll_create', {
      pollId: poll.id,
      title: poll.title,
      type: poll.type,
      optionCount: pollOptions.length
    });

    logger.info('Poll created successfully', {
      pollId: poll.id,
      title: poll.title,
      type: poll.type,
      createdBy: adminUserId
    });

    // Send notifications if requested
    if (notify_members) {
      await sendPollNotifications(poll.id, adminUserId);
    }

    return {
      ...poll.toJSON(),
      options: pollOptions
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to create poll', { error: error.message });
    throw error;
  }
};

/**
 * Cast a vote in a poll with hash chain integrity.
 *
 * @param {Object} voteData - Vote data
 * @param {number} voteData.poll_id - Poll ID
 * @param {number} voteData.user_id - User ID (null for anonymous)
 * @param {number} voteData.option_id - Poll option ID
 * @param {string} correlationId - Request correlation ID for logging
 * @returns {Promise<Object>} Vote receipt
 */
const castVote = async ({ poll_id, user_id, option_id }, correlationId = null) => {
  // Use IMMEDIATE transaction for serialized access
  const transaction = await sequelize.transaction({
    type: sequelize.Sequelize.Transaction.TYPES.IMMEDIATE
  });

  try {
    // Fetch poll with lock
    const poll = await Poll.findByPk(poll_id, {
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    // Verify poll is open
    const now = new Date();
    if (now < new Date(poll.start_at)) {
      throw new Error('Poll has not started yet');
    }
    if (now > new Date(poll.end_at)) {
      throw new Error('Poll has already closed');
    }

    // Verify option belongs to poll
    const option = await PollOption.findOne({
      where: {
        id: option_id,
        poll_id: poll_id
      },
      transaction
    });

    if (!option) {
      throw new Error('Invalid poll option');
    }

    // Check if user already voted (for non-anonymous polls)
    if (!poll.is_anonymous && user_id) {
      const hasVoted = await voteService.hasUserVoted(poll_id, user_id);
      if (hasVoted) {
        throw new Error('User has already voted in this poll');
      }
    }

    // Append vote to hash chain
    const { vote_hash, prev_hash, receipt_code, timestamp } = await voteService.appendVoteToChain(
      {
        poll_id,
        user_id: poll.is_anonymous ? null : user_id,
        option_id
      },
      transaction
    );

    // Persist vote
    const vote = await Vote.create({
      poll_id,
      user_id: poll.is_anonymous ? null : user_id,
      option_id,
      timestamp,
      prev_hash,
      vote_hash,
      receipt_code
    }, { transaction });

    await transaction.commit();

    // Log vote event
    await auditService.logAdminAction(user_id || 0, 'vote_cast', {
      pollId: poll_id,
      optionId: option_id,
      receiptCode: receipt_code,
      correlationId
    });

    logger.info('Vote cast successfully', {
      pollId: poll_id,
      optionId: option_id,
      userId: poll.is_anonymous ? 'anonymous' : user_id,
      receiptCode: receipt_code,
      correlationId
    });

    return {
      receipt: receipt_code,
      submitted_at: timestamp,
      integrity: {
        vote_hash,
        prev_hash: prev_hash || 'GENESIS'
      }
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to cast vote', {
      pollId: poll_id,
      userId: user_id,
      optionId: option_id,
      error: error.message,
      correlationId
    });
    throw error;
  }
};

/**
 * Send email notifications to members about a new poll.
 *
 * @param {number} pollId - Poll ID
 * @param {number} adminUserId - Admin user ID
 */
const sendPollNotifications = async (pollId, adminUserId) => {
  try {
    const notifyEnabled = await configService.getConfigValue('polls.notify-members-enabled');
    if (notifyEnabled !== 'true') {
      logger.info('Poll notifications disabled by feature flag', { pollId });
      return;
    }

    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    // Get all approved members
    const members = await User.findAll({
      where: {
        status: 'approved',
        role: 'member'
      },
      attributes: ['id', 'email', 'name']
    });

    if (members.length === 0) {
      logger.warn('No members to notify', { pollId });
      return;
    }

    const memberEmails = members.map(m => m.email);

    // Create email audit record
    const payloadHash = crypto.createHash('sha256')
      .update(JSON.stringify({ pollId, memberEmails }))
      .digest('hex');

    const emailAudit = await EmailAudit.create({
      template: 'poll_notification',
      recipient_count: memberEmails.length,
      request_payload_hash: payloadHash,
      sent_at: new Date(),
      status: 'pending'
    });

    // Send email
    try {
      await emailService.sendMail({
        to: memberEmails,
        subject: `[New Poll] ${poll.title}`,
        text: `A new poll has been created: ${poll.title}\n\nDescription: ${poll.description || 'No description provided'}\n\nPoll opens: ${poll.start_at}\nPoll closes: ${poll.end_at}\n\nLog in to cast your vote!`,
        html: `
          <h3>New Poll: ${poll.title}</h3>
          <p>${poll.description || 'No description provided'}</p>
          <p><strong>Type:</strong> ${poll.type}</p>
          <p><strong>Opens:</strong> ${new Date(poll.start_at).toLocaleString()}</p>
          <p><strong>Closes:</strong> ${new Date(poll.end_at).toLocaleString()}</p>
          <p>Log in to the HOA portal to cast your vote!</p>
        `
      });

      // Update email audit status
      await EmailAudit.update(
        { status: 'sent' },
        { where: { id: emailAudit.id } }
      );

      // Create resident notification log entries
      await Promise.all(
        members.map(member =>
          ResidentNotificationLog.create({
            user_id: member.id,
            email_audit_id: emailAudit.id,
            subject: `[New Poll] ${poll.title}`,
            sent_at: new Date(),
            status: 'sent'
          })
        )
      );

      logger.info('Poll notifications sent', {
        pollId,
        recipientCount: memberEmails.length
      });
    } catch (error) {
      await EmailAudit.update(
        { status: 'failed' },
        { where: { id: emailAudit.id } }
      );
      throw error;
    }
  } catch (error) {
    logger.error('Failed to send poll notifications', {
      pollId,
      error: error.message
    });
    // Don't throw - notification failure shouldn't block poll creation
  }
};

/**
 * Helper function to determine poll status.
 *
 * @param {Object} poll - Poll object
 * @returns {string} Poll status (scheduled, active, closed)
 */
const getPollStatus = (poll) => {
  const now = new Date();
  const start = new Date(poll.start_at);
  const end = new Date(poll.end_at);

  if (now < start) return 'scheduled';
  if (now > end) return 'closed';
  return 'active';
};

/**
 * Get vote counts for a poll (only for closed polls).
 *
 * @param {number} pollId - Poll ID
 * @returns {Promise<Array>} Vote counts by option
 */
const getVoteCounts = async (pollId) => {
  const votes = await Vote.findAll({
    where: { poll_id: pollId },
    include: [
      {
        model: PollOption,
        as: 'option',
        attributes: ['id', 'text', 'order_index']
      }
    ]
  });

  const counts = {};
  votes.forEach(vote => {
    const optionId = vote.option_id;
    counts[optionId] = (counts[optionId] || 0) + 1;
  });

  const options = await PollOption.findAll({
    where: { poll_id: pollId },
    order: [['order_index', 'ASC']]
  });

  return options.map(option => ({
    option_id: option.id,
    text: option.text,
    vote_count: counts[option.id] || 0
  }));
};

module.exports = {
  getPolls,
  getPollById,
  createPoll,
  castVote,
  sendPollNotifications,
  getVoteCounts
};
