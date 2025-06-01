const httpStatus = require('http-status');
const discussionService = require('../services/discussion.service');
const catchAsync = require('../utils/catchAsync'); // Assuming catchAsync utility for error handling

const createThreadController = catchAsync(async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  const thread = await discussionService.createThread({ title, content }, userId);
  res.status(httpStatus.CREATED).send(thread);
});

const createReplyController = catchAsync(async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  const reply = await discussionService.createReply({ content }, threadId, userId);
  res.status(httpStatus.CREATED).send(reply);
});

const listThreadsController = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const threads = await discussionService.listThreads({ page, limit });
  res.send(threads);
});

const viewThreadController = catchAsync(async (req, res) => {
  const { threadId } = req.params;
  const thread = await discussionService.viewThread(threadId);
  if (!thread) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'Thread not found or is not a main thread' });
  }
  res.send(thread);
});

const deleteThreadController = catchAsync(async (req, res) => {
  const { threadId } = req.params;
  const adminUserId = req.user.id;
  await discussionService.deleteThread(threadId, adminUserId);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteReplyController = catchAsync(async (req, res) => {
  const { replyId } = req.params;
  const adminUserId = req.user.id;
  await discussionService.deleteReply(replyId, adminUserId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createThreadController,
  createReplyController,
  listThreadsController,
  viewThreadController,
  deleteThreadController,
  deleteReplyController,
};