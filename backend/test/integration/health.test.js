const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB } = require('../utils/dbHelpers');
const { sequelize, Poll, PollOption, Vote, Config } = require('../../models');
const { computeVoteHash, deriveReceiptCode } = require('../../src/utils/hashChain');

describe('Health API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('time');
      expect(new Date(res.body.time)).toBeInstanceOf(Date);
    });

    it('should return valid ISO timestamp', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toEqual(200);
      const timestamp = new Date(res.body.time);
      expect(timestamp.toISOString()).toBe(res.body.time);
    });
  });

  describe('GET /api/healthz', () => {
    it('should return extended health diagnostics', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime_seconds');
      expect(res.body).toHaveProperty('checks');
    });

    it('should include database connectivity check', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks.database).toHaveProperty('status', 'connected');
      expect(res.body.checks.database).toHaveProperty('latency_ms');
    });

    it('should include config cache information', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(res.body.checks).toHaveProperty('config_cache');
      expect(res.body.checks.config_cache).toHaveProperty('age_seconds');
      expect(res.body.checks.config_cache).toHaveProperty('ttl_seconds', 60);
      expect(res.body.checks.config_cache).toHaveProperty('fresh');
      expect(typeof res.body.checks.config_cache.fresh).toBe('boolean');
    });

    it('should include theme checksum', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(res.body.checks).toHaveProperty('theme');
      expect(res.body.checks.theme).toHaveProperty('checksum');
      expect(typeof res.body.checks.theme.checksum).toBe('string');
      expect(res.body.checks.theme.checksum.length).toBeGreaterThan(0);
    });

    it('should include email service status', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(res.body.checks).toHaveProperty('email');
      expect(res.body.checks.email).toHaveProperty('status');
      expect(['configured', 'not_configured', 'error']).toContain(
        res.body.checks.email.status
      );
    });

    it('should include response time metric', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('response_time_ms');
      expect(typeof res.body.response_time_ms).toBe('number');
      expect(res.body.response_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return valid uptime in seconds', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      expect(typeof res.body.uptime_seconds).toBe('number');
      expect(res.body.uptime_seconds).toBeGreaterThanOrEqual(0);
    });

    it('should compute deterministic theme checksum', async () => {
      // Create some theme configs
      await Config.upsert({ key: 'theme.primary-color', value: '#007bff' });
      await Config.upsert({ key: 'theme.secondary-color', value: '#6c757d' });

      const res1 = await request(app).get('/api/healthz');
      const res2 = await request(app).get('/api/healthz');

      expect(res1.statusCode).toEqual(200);
      expect(res2.statusCode).toEqual(200);

      // Checksums should be identical for same theme config
      expect(res1.body.checks.theme.checksum).toBe(res2.body.checks.theme.checksum);
    });
  });

  describe('GET /api/healthz/hashchain/:pollId', () => {
    let testPollId;
    let testOptionId;

    beforeEach(async () => {
      // Create a test poll with votes
      const poll = await Poll.create({
        title: 'Health Test Poll',
        description: 'Poll for testing hash chain verification',
        type: 'informal',
        is_anonymous: true,
        notify_members: false,
        start_at: new Date(),
        end_at: new Date(Date.now() + 86400000), // +1 day
        created_by: 1 // Admin user from setupTestDB
      });
      testPollId = poll.id;

      const option = await PollOption.create({
        poll_id: testPollId,
        text: 'Test Option',
        order_index: 1
      });
      testOptionId = option.id;

      // Create a valid hash chain with 3 votes
      const votes = [];
      let prevHash = null;

      for (let i = 0; i < 3; i++) {
        const timestamp = new Date(Date.now() + i * 1000).toISOString();

        // Create vote with initial values
        const vote = await Vote.create({
          poll_id: testPollId,
          option_id: testOptionId,
          user_id: null,
          timestamp,
          prev_hash: prevHash,
          vote_hash: `temp_hash_${i}_${Date.now()}`, // Temporary unique value
          receipt_code: `temp_receipt_${i}_${Date.now()}` // Temporary unique value
        });

        // Reload to get database-formatted timestamp
        await vote.reload();

        // Now compute hash with database-formatted timestamp
        const voteHash = computeVoteHash({
          user_id: vote.user_id,
          option_id: vote.option_id,
          timestamp: vote.timestamp, // Use DB-formatted timestamp
          prev_hash: vote.prev_hash
        });
        const receiptCode = deriveReceiptCode(voteHash);

        // Update with correct hash and receipt
        await vote.update({
          vote_hash: voteHash,
          receipt_code: receiptCode
        });

        votes.push(vote);
        prevHash = voteHash;
      }
    });

    afterEach(async () => {
      // Cleanup test data
      await Vote.destroy({ where: { poll_id: testPollId } });
      await PollOption.destroy({ where: { poll_id: testPollId } });
      await Poll.destroy({ where: { id: testPollId } });
    });

    it('should verify valid hash chain for poll', async () => {
      const res = await request(app).get(`/api/healthz/hashchain/${testPollId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('poll_id');
      expect(String(res.body.poll_id)).toBe(String(testPollId)); // poll_id comes from URL params as string
      expect(res.body).toHaveProperty('validation');

      // Log validation result for debugging if test fails
      if (!res.body.validation.valid) {
        console.log('Validation failed:', JSON.stringify(res.body.validation, null, 2));
      }

      expect(res.body.validation).toHaveProperty('valid', true);
      expect(res.body.validation).toHaveProperty('totalVotes', 3);
      expect(res.body.validation).toHaveProperty('brokenLinks');
      expect(res.body.validation.brokenLinks).toEqual([]);
      expect(res.body.validation).toHaveProperty('message', 'Hash chain is valid');
    });

    it('should detect broken hash chain', async () => {
      // Corrupt a vote hash to break the chain
      const votes = await Vote.findAll({
        where: { poll_id: testPollId },
        order: [['timestamp', 'ASC']]
      });

      // Tamper with middle vote
      await Vote.update(
        { vote_hash: 'corrupted_hash' },
        { where: { id: votes[1].id } }
      );

      const res = await request(app).get(`/api/healthz/hashchain/${testPollId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.validation).toHaveProperty('valid', false);
      expect(res.body.validation.brokenLinks.length).toBeGreaterThan(0);
      expect(res.body.validation.message).toContain('integrity issues');
    });

    it('should return 404 for non-existent poll', async () => {
      const res = await request(app).get('/api/healthz/hashchain/99999');

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('No votes found');
    });

    it('should return 404 for poll with no votes', async () => {
      // Create poll without votes
      const emptyPoll = await Poll.create({
        title: 'Empty Poll',
        description: 'Poll with no votes',
        type: 'informal',
        is_anonymous: false,
        notify_members: false,
        start_at: new Date(),
        end_at: new Date(Date.now() + 86400000),
        created_by: 1
      });

      const res = await request(app).get(`/api/healthz/hashchain/${emptyPoll.id}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');

      // Cleanup
      await Poll.destroy({ where: { id: emptyPoll.id } });
    });

    it('should include timestamp in response', async () => {
      const res = await request(app).get(`/api/healthz/hashchain/${testPollId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('timestamp');
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should detect chain break in prev_hash linkage', async () => {
      // Create vote with incorrect prev_hash reference
      const votes = await Vote.findAll({
        where: { poll_id: testPollId },
        order: [['timestamp', 'ASC']]
      });

      // Break the chain by corrupting prev_hash of third vote
      await Vote.update(
        { prev_hash: 'incorrect_prev_hash' },
        { where: { id: votes[2].id } }
      );

      const res = await request(app).get(`/api/healthz/hashchain/${testPollId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.validation).toHaveProperty('valid', false);
      expect(res.body.validation.brokenLinks.length).toBeGreaterThan(0);

      // Check that broken link has meaningful reason
      const brokenLink = res.body.validation.brokenLinks.find(
        link => link.reason.includes('Chain break')
      );
      expect(brokenLink).toBeDefined();
    });
  });

  describe('GET /api/metrics', () => {
    it('should return Prometheus metrics', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text.length).toBeGreaterThan(0);
    });

    it('should include metric format headers', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.statusCode).toEqual(200);
      // Prometheus text format should contain HELP and TYPE comments
      expect(res.text).toMatch(/# HELP/);
      expect(res.text).toMatch(/# TYPE/);
    });
  });

  describe('Health endpoint error handling', () => {
    // Note: Testing actual database connection failures is difficult in integration tests
    // as closing the connection affects all subsequent tests. This would be better tested
    // with unit tests and mocking. The controller does handle DB errors gracefully by
    // returning 503 status with error details.

    it('should handle invalid poll ID format', async () => {
      const res = await request(app).get('/api/healthz/hashchain/invalid');

      // Should handle gracefully, either 404 or 500
      expect([404, 500]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Health endpoint security', () => {
    it('should not require authentication for /api/health', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toEqual(200);
      // No auth header required
    });

    it('should not require authentication for /api/healthz', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);
      // No auth header required
    });

    it('should not expose sensitive information in health response', async () => {
      const res = await request(app).get('/api/healthz');

      expect(res.statusCode).toEqual(200);

      // Should NOT contain database credentials, API keys, etc.
      const responseStr = JSON.stringify(res.body);
      expect(responseStr).not.toContain('password');
      expect(responseStr).not.toContain('secret');
      expect(responseStr).not.toContain('key');
      expect(responseStr).not.toContain('token');
    });
  });
});
