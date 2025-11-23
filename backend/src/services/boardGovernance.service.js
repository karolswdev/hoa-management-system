const { BoardTitle, BoardMember, ContactRequest, User } = require('../../models');
const configService = require('./config.service');
const emailService = require('./email.service');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const logger = require('../config/logger');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Get current board roster with visibility enforcement
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @returns {Promise<Array>} Array of current board members with user and title info
 */
const getCurrentRoster = async (isAuthenticated = false) => {
  const visibilityConfig = await configService.getConfigValue('board.visibility');
  const isPublic = visibilityConfig === 'public';

  if (!isPublic && !isAuthenticated) {
    return [];
  }

  const currentMembers = await BoardMember.findAll({
    where: {
      end_date: null
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: BoardTitle,
        as: 'title',
        attributes: ['id', 'title', 'rank']
      }
    ],
    order: [
      [{ model: BoardTitle, as: 'title' }, 'rank', 'ASC']
    ]
  });

  return currentMembers.map(member => ({
    id: member.id,
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email
    },
    title: {
      id: member.title.id,
      title: member.title.title,
      rank: member.title.rank
    },
    start_date: member.start_date,
    bio: member.bio,
    created_at: member.created_at
  }));
};

/**
 * Get board history with visibility enforcement
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @returns {Promise<Array>} Array of historical board members
 */
const getBoardHistory = async (isAuthenticated = false) => {
  const historyVisibilityConfig = await configService.getConfigValue('board.history-visibility');
  const allowHistory = historyVisibilityConfig !== 'members-only' || isAuthenticated;

  if (!allowHistory) {
    throw new Error('Board history is only available to authenticated members');
  }

  const historicalMembers = await BoardMember.findAll({
    where: {
      end_date: {
        [require('sequelize').Op.ne]: null
      }
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: BoardTitle,
        as: 'title',
        attributes: ['id', 'title', 'rank']
      }
    ],
    order: [
      ['end_date', 'DESC'],
      [{ model: BoardTitle, as: 'title' }, 'rank', 'ASC']
    ]
  });

  return historicalMembers.map(member => ({
    id: member.id,
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email
    },
    title: {
      id: member.title.id,
      title: member.title.title,
      rank: member.title.rank
    },
    start_date: member.start_date,
    end_date: member.end_date,
    bio: member.bio,
    created_at: member.created_at
  }));
};

/**
 * Submit a contact request to the board
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.requestor_email - Email of the person contacting the board
 * @param {string} contactData.subject - Subject line
 * @param {string} contactData.message - Message body
 * @param {string} contactData.captcha_token - CAPTCHA token
 * @returns {Promise<Object>} Created contact request
 */
const submitContactRequest = async ({ requestor_email, subject, message, captcha_token }) => {
  const sanitizedSubject = purify.sanitize(subject, { ALLOWED_TAGS: [] });
  const sanitizedMessage = purify.sanitize(message, { ALLOWED_TAGS: [] });

  const contactRequest = await ContactRequest.create({
    requestor_email,
    subject: sanitizedSubject,
    message: sanitizedMessage,
    captcha_token,
    status: 'pending',
    submitted_at: new Date()
  });

  try {
    const currentRoster = await getCurrentRoster(true);
    const boardEmails = currentRoster.map(member => member.user.email);

    if (boardEmails.length === 0) {
      logger.warn('No board members found to send contact request', {
        contactRequestId: contactRequest.id
      });
      await ContactRequest.update(
        { status: 'failed' },
        { where: { id: contactRequest.id } }
      );
      throw new Error('No board members available to receive this message');
    }

    await emailService.sendMail({
      to: boardEmails,
      subject: `[Board Contact] ${sanitizedSubject}`,
      text: `From: ${requestor_email}\n\nSubject: ${sanitizedSubject}\n\nMessage:\n${sanitizedMessage}`,
      html: `
        <h3>Board Contact Request</h3>
        <p><strong>From:</strong> ${requestor_email}</p>
        <p><strong>Subject:</strong> ${sanitizedSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
      `
    });

    await ContactRequest.update(
      { status: 'sent' },
      { where: { id: contactRequest.id } }
    );

    logger.info('Board contact request sent successfully', {
      contactRequestId: contactRequest.id,
      recipientCount: boardEmails.length
    });
  } catch (error) {
    logger.error('Failed to send board contact email', {
      contactRequestId: contactRequest.id,
      error: error.message
    });

    await ContactRequest.update(
      { status: 'failed' },
      { where: { id: contactRequest.id } }
    );

    throw new Error('Failed to send contact request to board members');
  }

  return {
    id: contactRequest.id,
    status: contactRequest.status,
    submitted_at: contactRequest.submitted_at
  };
};

/**
 * Create a new board member (admin only)
 * @param {Object} memberData - Board member data
 * @returns {Promise<Object>} Created board member
 */
const createBoardMember = async (memberData) => {
  const { user_id, title_id, start_date, bio } = memberData;

  const existingActiveMembership = await BoardMember.findOne({
    where: {
      user_id,
      end_date: null
    }
  });

  if (existingActiveMembership) {
    throw new Error('User already has an active board position');
  }

  const boardMember = await BoardMember.create({
    user_id,
    title_id,
    start_date,
    end_date: null,
    bio: bio || null
  });

  return boardMember;
};

/**
 * Update a board member (admin only)
 * @param {number} memberId - Board member ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated board member
 */
const updateBoardMember = async (memberId, updates) => {
  const boardMember = await BoardMember.findByPk(memberId);

  if (!boardMember) {
    throw new Error('Board member not found');
  }

  const allowedUpdates = ['title_id', 'start_date', 'end_date', 'bio'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  await boardMember.update(filteredUpdates);

  return boardMember;
};

/**
 * Delete a board member (admin only)
 * @param {number} memberId - Board member ID
 * @returns {Promise<void>}
 */
const deleteBoardMember = async (memberId) => {
  const boardMember = await BoardMember.findByPk(memberId);

  if (!boardMember) {
    throw new Error('Board member not found');
  }

  await boardMember.destroy();
};

/**
 * Get all board titles
 * @returns {Promise<Array>} Array of board titles
 */
const getAllBoardTitles = async () => {
  return BoardTitle.findAll({
    order: [['rank', 'ASC']]
  });
};

/**
 * Create a board title (admin only)
 * @param {Object} titleData - Board title data
 * @returns {Promise<Object>} Created board title
 */
const createBoardTitle = async (titleData) => {
  const { title, rank } = titleData;

  const existingTitle = await BoardTitle.findOne({
    where: { title }
  });

  if (existingTitle) {
    throw new Error('Board title already exists');
  }

  return BoardTitle.create({ title, rank });
};

/**
 * Update a board title (admin only)
 * @param {number} titleId - Board title ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated board title
 */
const updateBoardTitle = async (titleId, updates) => {
  const boardTitle = await BoardTitle.findByPk(titleId);

  if (!boardTitle) {
    throw new Error('Board title not found');
  }

  const allowedUpdates = ['title', 'rank'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  await boardTitle.update(filteredUpdates);

  return boardTitle;
};

/**
 * Delete a board title (admin only)
 * @param {number} titleId - Board title ID
 * @returns {Promise<void>}
 */
const deleteBoardTitle = async (titleId) => {
  const boardTitle = await BoardTitle.findByPk(titleId);

  if (!boardTitle) {
    throw new Error('Board title not found');
  }

  const membersWithTitle = await BoardMember.count({
    where: { title_id: titleId }
  });

  if (membersWithTitle > 0) {
    throw new Error('Cannot delete board title with active or historical members');
  }

  await boardTitle.destroy();
};

module.exports = {
  getCurrentRoster,
  getBoardHistory,
  submitContactRequest,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember,
  getAllBoardTitles,
  createBoardTitle,
  updateBoardTitle,
  deleteBoardTitle
};
