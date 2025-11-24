const crypto = require('crypto');

/**
 * Computes a vote hash using SHA256 according to the formula:
 * SHA256(user_id + option_id + timestamp + prev_hash)
 *
 * @param {Object} voteData - Vote data for hashing
 * @param {number|null} voteData.user_id - User ID (null for anonymous votes)
 * @param {number} voteData.option_id - Poll option ID
 * @param {string} voteData.timestamp - ISO timestamp
 * @param {string|null} voteData.prev_hash - Previous vote hash (null for first vote)
 * @returns {string} SHA256 hash in hexadecimal format
 */
const computeVoteHash = ({ user_id, option_id, timestamp, prev_hash }) => {
  // Normalize inputs for consistent hashing
  const userId = user_id !== null && user_id !== undefined ? String(user_id) : '';
  const optionId = String(option_id);
  const ts = timestamp instanceof Date ? timestamp.toISOString() : String(timestamp);
  const previousHash = prev_hash || 'GENESIS';

  // Concatenate components
  const dataToHash = userId + optionId + ts + previousHash;

  // Compute SHA256 hash
  const hash = crypto.createHash('sha256');
  hash.update(dataToHash);
  return hash.digest('hex');
};

/**
 * Derives a receipt code from a vote hash.
 * Uses the first 16 characters of the hash for readability.
 *
 * @param {string} voteHash - Full vote hash
 * @returns {string} Shortened receipt code
 */
const deriveReceiptCode = (voteHash) => {
  if (!voteHash || voteHash.length < 16) {
    throw new Error('Invalid vote hash for receipt generation');
  }
  // Use first 16 characters for shorter receipt codes
  return voteHash.substring(0, 16).toUpperCase();
};

/**
 * Verifies the integrity of a vote by recomputing its hash.
 *
 * @param {Object} voteData - Vote data to verify
 * @param {number|null} voteData.user_id - User ID
 * @param {number} voteData.option_id - Poll option ID
 * @param {string} voteData.timestamp - ISO timestamp
 * @param {string|null} voteData.prev_hash - Previous vote hash
 * @param {string} voteData.vote_hash - Stored vote hash to verify against
 * @returns {boolean} True if hash is valid
 */
const verifyVoteHash = ({ user_id, option_id, timestamp, prev_hash, vote_hash }) => {
  const computedHash = computeVoteHash({ user_id, option_id, timestamp, prev_hash });
  return computedHash === vote_hash;
};

/**
 * Validates hash chain integrity for a sequence of votes.
 *
 * @param {Array<Object>} votes - Array of votes ordered by timestamp
 * @returns {Object} Validation result with status and any broken links
 */
const validateHashChain = (votes) => {
  if (!votes || votes.length === 0) {
    return { valid: true, message: 'Empty chain is valid' };
  }

  const brokenLinks = [];

  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i];
    const timestamp = vote.timestamp instanceof Date
      ? vote.timestamp.toISOString()
      : vote.timestamp;

    // Verify individual vote hash
    const hashValid = verifyVoteHash({
      user_id: vote.user_id,
      option_id: vote.option_id,
      timestamp,
      prev_hash: vote.prev_hash,
      vote_hash: vote.vote_hash
    });

    if (!hashValid) {
      brokenLinks.push({
        index: i,
        voteId: vote.id,
        reason: 'Hash mismatch - vote data may have been tampered with'
      });
    }

    // Verify chain linkage (except for first vote)
    if (i > 0) {
      const expectedPrevHash = votes[i - 1].vote_hash;
      if (vote.prev_hash !== expectedPrevHash) {
        brokenLinks.push({
          index: i,
          voteId: vote.id,
          reason: 'Chain break - prev_hash does not match previous vote_hash'
        });
      }
    } else {
      // First vote should have null or 'GENESIS' prev_hash
      if (vote.prev_hash !== null && vote.prev_hash !== 'GENESIS') {
        brokenLinks.push({
          index: i,
          voteId: vote.id,
          reason: 'First vote has invalid prev_hash'
        });
      }
    }
  }

  return {
    valid: brokenLinks.length === 0,
    totalVotes: votes.length,
    brokenLinks,
    message: brokenLinks.length === 0
      ? 'Hash chain is valid'
      : `Found ${brokenLinks.length} integrity issues`
  };
};

module.exports = {
  computeVoteHash,
  deriveReceiptCode,
  verifyVoteHash,
  validateHashChain
};
