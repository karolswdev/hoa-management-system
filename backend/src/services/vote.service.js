const { Vote, Poll, PollOption } = require('../../models');
const { computeVoteHash, deriveReceiptCode, validateHashChain } = require('../utils/hashChain');
const logger = require('../config/logger');
const { Op } = require('sequelize');

/**
 * Appends a vote to the hash chain with proper prev_hash lookup.
 * MUST be called within a transaction with IMMEDIATE isolation.
 *
 * @param {Object} voteData - Vote data
 * @param {number} voteData.poll_id - Poll ID
 * @param {number|null} voteData.user_id - User ID (null for anonymous)
 * @param {number} voteData.option_id - Poll option ID
 * @param {Object} transaction - Sequelize transaction object
 * @returns {Promise<Object>} Vote hash chain metadata
 */
const appendVoteToChain = async ({ poll_id, user_id, option_id }, transaction) => {
  try {
    // Generate timestamp for this vote
    const timestamp = new Date().toISOString();

    // Fetch the most recent vote for this poll within the transaction
    // This ensures we get the correct prev_hash even under concurrent writes
    const lastVote = await Vote.findOne({
      where: { poll_id },
      order: [['timestamp', 'DESC'], ['id', 'DESC']],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    // Determine prev_hash (null/GENESIS for first vote)
    const prev_hash = lastVote ? lastVote.vote_hash : null;

    // Compute the vote hash using the standard formula
    const vote_hash = computeVoteHash({
      user_id,
      option_id,
      timestamp,
      prev_hash
    });

    // Derive receipt code from vote hash
    const receipt_code = deriveReceiptCode(vote_hash);

    logger.info('Vote hash computed', {
      poll_id,
      option_id,
      prev_hash: prev_hash || 'GENESIS',
      vote_hash,
      receipt_code,
      timestamp
    });

    return {
      vote_hash,
      prev_hash,
      receipt_code,
      timestamp
    };
  } catch (error) {
    logger.error('Failed to append vote to chain', {
      poll_id,
      user_id,
      option_id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Verifies a receipt code and returns vote metadata without exposing user identity.
 *
 * @param {string} receiptCode - Receipt code to verify
 * @returns {Promise<Object|null>} Vote metadata or null if not found
 */
const verifyReceipt = async (receiptCode) => {
  try {
    const vote = await Vote.findOne({
      where: { receipt_code: receiptCode.toUpperCase() },
      include: [
        {
          model: Poll,
          as: 'poll',
          attributes: ['id', 'title', 'type']
        },
        {
          model: PollOption,
          as: 'option',
          attributes: ['id', 'text']
        }
      ]
    });

    if (!vote) {
      return null;
    }

    // Return truncated metadata without user_id
    return {
      poll: {
        id: vote.poll.id,
        title: vote.poll.title,
        type: vote.poll.type
      },
      option: {
        id: vote.option.id,
        text: vote.option.text
      },
      timestamp: vote.timestamp,
      vote_hash: vote.vote_hash,
      prev_hash: vote.prev_hash,
      receipt_code: vote.receipt_code
    };
  } catch (error) {
    logger.error('Failed to verify receipt', {
      receiptCode,
      error: error.message
    });
    throw error;
  }
};

/**
 * Validates the hash chain integrity for a specific poll.
 *
 * @param {number} pollId - Poll ID
 * @returns {Promise<Object>} Validation result
 */
const validatePollHashChain = async (pollId) => {
  try {
    const votes = await Vote.findAll({
      where: { poll_id: pollId },
      order: [['timestamp', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'user_id', 'option_id', 'timestamp', 'prev_hash', 'vote_hash']
    });

    const result = validateHashChain(votes);

    logger.info('Hash chain validation completed', {
      poll_id: pollId,
      valid: result.valid,
      totalVotes: result.totalVotes,
      brokenLinks: result.brokenLinks.length
    });

    return result;
  } catch (error) {
    logger.error('Failed to validate hash chain', {
      poll_id: pollId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Checks if a user has already voted in a poll.
 *
 * @param {number} pollId - Poll ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user has voted
 */
const hasUserVoted = async (pollId, userId) => {
  const existingVote = await Vote.findOne({
    where: {
      poll_id: pollId,
      user_id: userId
    }
  });

  return !!existingVote;
};

module.exports = {
  appendVoteToChain,
  verifyReceipt,
  validatePollHashChain,
  hasUserVoted
};
