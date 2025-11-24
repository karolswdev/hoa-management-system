const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const { sequelize, Poll, PollOption, Vote, User, Config } = require('../../models');

describe('Poll API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testPollId;
  let testOptionId;

  beforeAll(async () => {
    await setupTestDB();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@example.com',
        password: 'testadmin123'
      });
    adminToken = adminLogin.body.token;

    // Create and approve a test member
    memberToken = await createAndApproveUser(
      { name: 'Test Member', email: 'testmember@example.com', password: 'Testmember123!' },
      adminToken
    );
    expect(memberToken).toBeDefined();

    // Set poll feature flags
    await Config.upsert({ key: 'polls.binding-enabled', value: 'true' });
    await Config.upsert({ key: 'polls.notify-members-enabled', value: 'false' });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Poll Creation', () => {
    describe('POST /api/polls', () => {
      it('should create a poll as admin', async () => {
        const pollData = {
          title: 'Test Poll',
          description: 'This is a test poll',
          type: 'informal',
          is_anonymous: false,
          notify_members: false,
          start_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
          end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day from now
          options: [
            { text: 'Yes', order_index: 0 },
            { text: 'No', order_index: 1 }
          ]
        };

        const res = await request(app)
          .post('/api/polls')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(pollData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('Poll created successfully');
        expect(res.body.poll.title).toEqual('Test Poll');
        expect(res.body.poll.options).toHaveLength(2);
        testPollId = res.body.poll.id;
        testOptionId = res.body.poll.options[0].id;
      });

      it('should reject poll creation by member', async () => {
        const pollData = {
          title: 'Unauthorized Poll',
          type: 'informal',
          start_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        };

        const res = await request(app)
          .post('/api/polls')
          .set('Authorization', `Bearer ${memberToken}`)
          .send(pollData);

        expect(res.statusCode).toEqual(403);
      });

      it('should reject poll with invalid date range', async () => {
        const pollData = {
          title: 'Invalid Poll',
          type: 'informal',
          start_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          end_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // End before start
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        };

        const res = await request(app)
          .post('/api/polls')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(pollData);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('End date must be after start date');
      });

      it('should reject poll with insufficient options', async () => {
        const pollData = {
          title: 'Insufficient Options Poll',
          type: 'informal',
          start_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          options: [
            { text: 'Only Option' }
          ]
        };

        const res = await request(app)
          .post('/api/polls')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(pollData);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('at least 2 options');
      });
    });
  });

  describe('Poll Retrieval', () => {
    describe('GET /api/polls', () => {
      it('should get all polls', async () => {
        const res = await request(app).get('/api/polls');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('polls');
        expect(res.body).toHaveProperty('serverTime');
        expect(Array.isArray(res.body.polls)).toBeTruthy();
        expect(res.body.polls.length).toBeGreaterThan(0);
      });

      it('should filter polls by type', async () => {
        const res = await request(app).get('/api/polls?type=informal');

        expect(res.statusCode).toEqual(200);
        expect(res.body.polls.every(p => p.type === 'informal')).toBeTruthy();
      });
    });

    describe('GET /api/polls/:id', () => {
      it('should get poll details by ID', async () => {
        const res = await request(app).get(`/api/polls/${testPollId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.poll.id).toEqual(testPollId);
        expect(res.body.poll.title).toEqual('Test Poll');
        expect(res.body.poll.options).toHaveLength(2);
      });

      it('should return 404 for non-existent poll', async () => {
        const res = await request(app).get('/api/polls/99999');

        expect(res.statusCode).toEqual(404);
      });
    });
  });

  describe('Voting', () => {
    let activePollId;
    let activeOptionId;

    beforeAll(async () => {
      // Create an active poll (starts now)
      const pollData = {
        title: 'Active Poll for Voting',
        type: 'informal',
        is_anonymous: false,
        notify_members: false,
        start_at: new Date(Date.now() - 1000 * 60).toISOString(), // Started 1 min ago
        end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Ends in 1 day
        options: [
          { text: 'Option A', order_index: 0 },
          { text: 'Option B', order_index: 1 }
        ]
      };

      const res = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pollData);

      activePollId = res.body.poll.id;
      activeOptionId = res.body.poll.options[0].id;
    });

    describe('POST /api/polls/:id/votes', () => {
      it('should cast a vote as member', async () => {
        const res = await request(app)
          .post(`/api/polls/${activePollId}/votes`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ option_id: activeOptionId });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('Vote cast successfully');
        expect(res.body).toHaveProperty('receipt');
        expect(res.body).toHaveProperty('submitted_at');
        expect(res.body).toHaveProperty('integrity');
        expect(res.body.integrity).toHaveProperty('vote_hash');
        expect(res.body.integrity).toHaveProperty('prev_hash');
      });

      it('should reject duplicate vote from same user', async () => {
        const res = await request(app)
          .post(`/api/polls/${activePollId}/votes`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ option_id: activeOptionId });

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toContain('already voted');
      });

      it('should reject vote without authentication', async () => {
        const res = await request(app)
          .post(`/api/polls/${activePollId}/votes`)
          .send({ option_id: activeOptionId });

        expect(res.statusCode).toEqual(401);
      });

      it('should reject vote with invalid option', async () => {
        // Create another member to test invalid option
        const anotherMemberToken = await createAndApproveUser(
          { name: 'Another Member', email: 'anothermember@example.com', password: 'Testmember123!' },
          adminToken
        );

        const res = await request(app)
          .post(`/api/polls/${activePollId}/votes`)
          .set('Authorization', `Bearer ${anotherMemberToken}`)
          .send({ option_id: 99999 });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Invalid poll option');
      });
    });
  });

  describe('Receipt Verification', () => {
    let receiptCode;

    beforeAll(async () => {
      // Create a poll and cast a vote to get a receipt
      const pollData = {
        title: 'Receipt Test Poll',
        type: 'informal',
        is_anonymous: false,
        notify_members: false,
        start_at: new Date(Date.now() - 1000 * 60).toISOString(),
        end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        options: [
          { text: 'Choice 1' },
          { text: 'Choice 2' }
        ]
      };

      const pollRes = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pollData);

      const pollId = pollRes.body.poll.id;
      const optionId = pollRes.body.poll.options[0].id;

      // Create a new member for this test
      const receiptMemberToken = await createAndApproveUser(
        { name: 'Receipt Member', email: 'receiptmember@example.com', password: 'Testmember123!' },
        adminToken
      );

      const voteRes = await request(app)
        .post(`/api/polls/${pollId}/votes`)
        .set('Authorization', `Bearer ${receiptMemberToken}`)
        .send({ option_id: optionId });

      receiptCode = voteRes.body.receipt;
    });

    describe('GET /api/polls/receipts/:code', () => {
      it('should verify a valid receipt', async () => {
        const res = await request(app).get(`/api/polls/receipts/${receiptCode}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Receipt verified');
        expect(res.body.receipt).toHaveProperty('poll');
        expect(res.body.receipt).toHaveProperty('option');
        expect(res.body.receipt).toHaveProperty('timestamp');
        expect(res.body.receipt).toHaveProperty('vote_hash');
        expect(res.body.receipt).not.toHaveProperty('user_id'); // Should not expose user
      });

      it('should return 404 for invalid receipt', async () => {
        const res = await request(app).get('/api/polls/receipts/INVALID1234567890');

        expect(res.statusCode).toEqual(404);
      });
    });
  });

  describe('Hash Chain Integrity', () => {
    let integrityPollId;

    beforeAll(async () => {
      // Create a poll and cast multiple votes to test hash chain
      const pollData = {
        title: 'Integrity Test Poll',
        type: 'informal',
        is_anonymous: false,
        notify_members: false,
        start_at: new Date(Date.now() - 1000 * 60).toISOString(),
        end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        options: [
          { text: 'A' },
          { text: 'B' }
        ]
      };

      const pollRes = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pollData);

      integrityPollId = pollRes.body.poll.id;
      const optionId = pollRes.body.poll.options[0].id;

      // Cast multiple votes
      for (let i = 0; i < 3; i++) {
        const memberToken = await createAndApproveUser(
          { name: `Chain Member ${i}`, email: `chain${i}@example.com`, password: 'Testmember123!' },
          adminToken
        );

        await request(app)
          .post(`/api/polls/${integrityPollId}/votes`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ option_id: optionId });
      }
    });

    describe('GET /api/polls/:id/integrity', () => {
      it('should validate hash chain as admin', async () => {
        const res = await request(app)
          .get(`/api/polls/${integrityPollId}/integrity`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.validation).toHaveProperty('valid');
        expect(res.body.validation).toHaveProperty('totalVotes');
        expect(res.body.validation).toHaveProperty('brokenLinks');
        expect(res.body.validation.valid).toBeTruthy();
        expect(res.body.validation.totalVotes).toBeGreaterThanOrEqual(3);
      });

      it('should reject integrity check by non-admin', async () => {
        const res = await request(app)
          .get(`/api/polls/${integrityPollId}/integrity`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('Poll Results', () => {
    let closedPollId;

    beforeAll(async () => {
      // Create a closed poll
      const pollData = {
        title: 'Closed Poll for Results',
        type: 'informal',
        is_anonymous: false,
        notify_members: false,
        start_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 48 hours ago
        end_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago (closed)
        options: [
          { text: 'Result A' },
          { text: 'Result B' }
        ]
      };

      const pollRes = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pollData);

      closedPollId = pollRes.body.poll.id;
    });

    describe('GET /api/polls/:id/results', () => {
      it('should get results for closed poll', async () => {
        const res = await request(app).get(`/api/polls/${closedPollId}/results`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.poll).toHaveProperty('status', 'closed');
        expect(res.body.results).toBeDefined();
        expect(Array.isArray(res.body.results)).toBeTruthy();
      });

      it('should reject results for active poll as non-admin', async () => {
        // Use the active poll from earlier tests
        const activePollData = {
          title: 'Still Active Poll',
          type: 'informal',
          is_anonymous: false,
          notify_members: false,
          start_at: new Date(Date.now() - 1000 * 60).toISOString(),
          end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          options: [
            { text: 'X' },
            { text: 'Y' }
          ]
        };

        const pollRes = await request(app)
          .post('/api/polls')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(activePollData);

        const activePollId = pollRes.body.poll.id;

        const res = await request(app)
          .get(`/api/polls/${activePollId}/results`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('only available after the poll closes');
      });
    });
  });

  describe('Anonymous Polls', () => {
    let anonymousPollId;
    let anonymousOptionId;

    beforeAll(async () => {
      const pollData = {
        title: 'Anonymous Poll',
        type: 'informal',
        is_anonymous: true, // Anonymous poll
        notify_members: false,
        start_at: new Date(Date.now() - 1000 * 60).toISOString(),
        end_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        options: [
          { text: 'Anonymous A' },
          { text: 'Anonymous B' }
        ]
      };

      const res = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pollData);

      anonymousPollId = res.body.poll.id;
      anonymousOptionId = res.body.poll.options[0].id;
    });

    it('should allow anonymous voting', async () => {
      const anonMemberToken = await createAndApproveUser(
        { name: 'Anon Member', email: 'anon@example.com', password: 'Testmember123!' },
        adminToken
      );

      const res = await request(app)
        .post(`/api/polls/${anonymousPollId}/votes`)
        .set('Authorization', `Bearer ${anonMemberToken}`)
        .send({ option_id: anonymousOptionId });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('receipt');

      // Verify that user_id is null in database
      const vote = await Vote.findOne({
        where: { receipt_code: res.body.receipt }
      });
      expect(vote.user_id).toBeNull();
    });
  });
});
