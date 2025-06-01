const { Discussion, User, sequelize } = require('../../models'); // Assuming User model is in the same directory
const { Op, fn, col } = require('sequelize');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const ApiError = require('../utils/ApiError'); // Assuming ApiError utility
const auditService = require('./audit.service');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Create a discussion thread
 * @param {Object} threadData
 * @param {ObjectId} userId
 * @returns {Promise<Discussion>}
 */
const createThread = async (threadData, userId) => {
  const sanitizedContent = DOMPurify.sanitize(threadData.content);
  const thread = await Discussion.create({
    title: threadData.title,
    content: sanitizedContent,
    user_id: userId,
    parent_id: null,
  });
  return thread;
};

/**
 * Create a reply to a discussion thread
 * @param {Object} replyData
 * @param {ObjectId} threadId
 * @param {ObjectId} userId
 * @returns {Promise<Discussion>}
 */
const createReply = async (replyData, threadId, userId) => {
  const sanitizedContent = DOMPurify.sanitize(replyData.content);

  const parentThread = await Discussion.findOne({ where: { id: threadId, parent_id: null } });
  if (!parentThread) {
    throw new ApiError(404, 'Parent thread not found or is not a main thread');
  }

  const reply = await Discussion.create({
    content: sanitizedContent,
    user_id: userId,
    parent_id: threadId,
    title: null, // Replies don't have titles
  });
  return reply;
};

/**
 * List all main discussion threads with author and reply count
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Current page
 * @param {number} [options.limit=10] - Maximum number of results per page
 * @returns {Promise<Object>} - Paginated list of thread objects
 */
const listThreads = async (options) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Discussion.findAndCountAll({
    where: { parent_id: null },
    order: [['created_at', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
      },
    ],
    attributes: [
      'id',
      'title',
      'content',
      'created_at',
      [
        sequelize.literal(`(
          SELECT COUNT(*)
          FROM discussions AS reply
          WHERE
            reply.parent_id = discussions.id
        )`),
        'reply_count'
      ]
    ],
    distinct: true, // Important for correct count with includes
  });

  const threads = rows.map(thread => ({
    id: thread.id,
    title: thread.title,
    content: thread.content, // Consider snippet vs full content based on requirements
    created_at: thread.created_at,
    author: thread.author ? { id: thread.author.id, name: thread.author.name } : null,
    reply_count: parseInt(thread.get('reply_count'), 10) || 0,
  }));

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    threads,
  };
};

/**
 * View a specific thread along with all its replies
 * @param {ObjectId} threadId
 * @returns {Promise<Object|null>} - Thread object with replies, or null if not found
 */
const viewThread = async (threadId) => {
  const mainThread = await Discussion.findOne({
    where: { id: threadId, parent_id: null },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!mainThread) {
    return null; // Or throw ApiError(httpStatus.NOT_FOUND, 'Thread not found or is not a main thread');
  }

  const replies = await Discussion.findAll({
    where: { parent_id: threadId },
    order: [['created_at', 'ASC']],
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
      },
    ],
  });

  return {
    mainThread: {
      id: mainThread.id,
      title: mainThread.title,
      content: mainThread.content,
      created_at: mainThread.created_at,
      author: mainThread.author ? { id: mainThread.author.id, name: mainThread.author.name } : null,
    },
    replies: replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      created_at: reply.created_at,
      author: reply.author ? { id: reply.author.id, name: reply.author.name } : null,
    })),
  };
};


/**
 * Delete a discussion thread
 * @param {ObjectId} threadId
 * @param {ObjectId} adminUserId
 * @returns {Promise<void>}
 */
const deleteThread = async (threadId, adminUserId) => {
  const thread = await Discussion.findOne({ where: { id: threadId, parent_id: null } });
  if (!thread) {
    throw new ApiError(404, 'Discussion thread not found or is not a main thread');
  }
  const threadTitle = thread.title; // Store title before destroying
  await thread.destroy();
  // eslint-disable-next-line no-console
  // console.log(`Audit: Admin User ID ${adminUserId} deleted discussion thread ID ${threadId} titled '${thread.title}'`);
  try {
    await auditService.logAdminAction(adminUserId, 'discussion_thread_delete', { threadId, title: threadTitle });
  } catch (auditError) {
    console.error('Failed to log admin action for discussion_thread_delete:', auditError);
  }
};

/**
 * Delete a discussion reply
 * @param {ObjectId} replyId
 * @param {ObjectId} adminUserId
 * @returns {Promise<void>}
 */
const deleteReply = async (replyId, adminUserId) => {
  const reply = await Discussion.findOne({ where: { id: replyId, parent_id: { [Op.ne]: null } } });
  if (!reply) {
    throw new ApiError(404, 'Discussion reply not found or is not a reply');
  }
  await reply.destroy();
  // eslint-disable-next-line no-console
  // console.log(`Audit: Admin User ID ${adminUserId} deleted discussion reply ID ${replyId}`);
  try {
    await auditService.logAdminAction(adminUserId, 'discussion_reply_delete', { replyId });
  } catch (auditError) {
    console.error('Failed to log admin action for discussion_reply_delete:', auditError);
  }
};

module.exports = {
  createThread,
  createReply,
  listThreads,
  viewThread,
  deleteThread,
  deleteReply,
};