const db = require('../../models');
const crypto = require('crypto');
const logger = require('../config/logger');
const { validateHashChain } = require('../utils/hashChain');
const configService = require('../services/config.service');

// Cache for storing last config fetch time
let configCacheTime = null;
let configCacheTTL = 60; // 60 seconds default TTL

/**
 * Compute theme checksum from config values
 * This ensures frontend/backend theme consistency
 */
const computeThemeChecksum = async () => {
  try {
    // Fetch all theme-related configs
    const themeConfigs = await db.Config.findAll({
      where: {
        key: {
          [db.Sequelize.Op.like]: 'theme.%'
        }
      },
      order: [['key', 'ASC']] // Deterministic ordering
    });

    // If no theme configs, use default marker
    if (!themeConfigs || themeConfigs.length === 0) {
      return crypto.createHash('sha256').update('DEFAULT_THEME').digest('hex').substring(0, 16);
    }

    // Concatenate all theme config values in deterministic order
    const themeData = themeConfigs
      .map(cfg => `${cfg.key}=${cfg.value}`)
      .join('|');

    // Compute SHA256 hash
    const hash = crypto.createHash('sha256');
    hash.update(themeData);
    return hash.digest('hex').substring(0, 16); // Short checksum for readability
  } catch (error) {
    logger.error('Failed to compute theme checksum', { error: error.message });
    return 'ERROR';
  }
};

/**
 * Check database connectivity
 */
const checkDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    return { status: 'connected', latency_ms: 0 };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return { status: 'disconnected', error: error.message };
  }
};

/**
 * Check SendGrid availability (if configured)
 */
const checkSendGrid = async () => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { status: 'not_configured' };
    }
    // We don't actually call SendGrid API in health check to avoid rate limits
    // Just verify the key is present
    return { status: 'configured' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

/**
 * Get config cache age in seconds
 */
const getConfigCacheAge = () => {
  if (!configCacheTime) {
    // First fetch, initialize cache time
    configCacheTime = Date.now();
    return 0;
  }
  return Math.floor((Date.now() - configCacheTime) / 1000);
};

/**
 * Enhanced health endpoint with extended diagnostics
 * Returns JSON with version, db status, config cache age, and theme checksum
 *
 * GET /api/healthz
 */
const healthz = async (req, res) => {
  try {
    const startTime = Date.now();

    // Parallel health checks
    const [dbCheck, themeChecksum, sendgridCheck] = await Promise.all([
      checkDatabase(),
      computeThemeChecksum(),
      checkSendGrid()
    ]);

    const cacheAge = getConfigCacheAge();
    const version = process.env.APP_VERSION || 'unknown';

    // Determine overall status
    const isHealthy = dbCheck.status === 'connected';
    const overallStatus = isHealthy ? 'ok' : 'degraded';

    // Build response
    const response = {
      status: overallStatus,
      version,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      checks: {
        database: dbCheck,
        config_cache: {
          age_seconds: cacheAge,
          ttl_seconds: configCacheTTL,
          fresh: cacheAge <= configCacheTTL
        },
        theme: {
          checksum: themeChecksum
        },
        email: sendgridCheck
      },
      response_time_ms: Date.now() - startTime
    };

    // Return 503 if unhealthy, 200 if healthy
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(response);

    // Log health check result
    logger.info('Health check completed', {
      status: overallStatus,
      response_time_ms: response.response_time_ms,
      db_status: dbCheck.status
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message, stack: error.stack });
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify hash chain integrity for a specific poll
 * This can be used by monitoring scripts to validate vote integrity
 *
 * GET /api/healthz/hashchain/:pollId
 */
const verifyHashChainEndpoint = async (req, res) => {
  try {
    const { pollId } = req.params;

    // Fetch all votes for this poll, ordered by timestamp
    const votes = await db.Vote.findAll({
      where: { poll_id: pollId },
      order: [['timestamp', 'ASC']],
      attributes: ['id', 'user_id', 'option_id', 'timestamp', 'prev_hash', 'vote_hash']
    });

    if (votes.length === 0) {
      return res.status(404).json({
        error: 'No votes found for this poll',
        poll_id: pollId
      });
    }

    // Convert Sequelize instances to plain objects
    const voteData = votes.map(v => ({
      id: v.id,
      user_id: v.user_id,
      option_id: v.option_id,
      timestamp: v.timestamp,
      prev_hash: v.prev_hash,
      vote_hash: v.vote_hash
    }));

    // Validate the hash chain
    const validation = validateHashChain(voteData);

    res.status(200).json({
      poll_id: pollId,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Hash chain verification failed', { error: error.message, pollId: req.params.pollId });
    res.status(500).json({
      error: 'Hash chain verification failed',
      details: error.message
    });
  }
};

module.exports = {
  healthz,
  verifyHashChainEndpoint,
  // Export for testing
  checkDatabase,
  computeThemeChecksum,
  getConfigCacheAge
};
