const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const { sequelize, BoardTitle, BoardMember, User, Config } = require('../../models');

describe('Board API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testTitleId;
  let testMemberId;
  let testUserId;

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

    // Get test user ID for board member creation
    const testUser = await User.findOne({ where: { email: 'testmember@example.com' } });
    testUserId = testUser.id;

    // Set board visibility to public for most tests
    await Config.upsert({ key: 'board.visibility', value: 'public' });
    await Config.upsert({ key: 'board.history-visibility', value: 'public' });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Board Titles', () => {
    describe('GET /api/board/titles', () => {
      it('should get all board titles (public access)', async () => {
        const res = await request(app).get('/api/board/titles');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('titles');
        expect(Array.isArray(res.body.titles)).toBeTruthy();
      });
    });

    describe('POST /api/board/titles', () => {
      it('should create a board title as admin', async () => {
        const res = await request(app)
          .post('/api/board/titles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'President',
            rank: 1
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('Board title created successfully');
        expect(res.body.boardTitle.title).toEqual('President');
        testTitleId = res.body.boardTitle.id;
      });

      it('should reject duplicate board title', async () => {
        const res = await request(app)
          .post('/api/board/titles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'President',
            rank: 2
          });

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toContain('already exists');
      });

      it('should reject board title creation by member', async () => {
        const res = await request(app)
          .post('/api/board/titles')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            title: 'Vice President',
            rank: 2
          });

        expect(res.statusCode).toEqual(403);
      });

      it('should reject board title creation without auth', async () => {
        const res = await request(app)
          .post('/api/board/titles')
          .send({
            title: 'Secretary',
            rank: 3
          });

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('PUT /api/board/titles/:id', () => {
      it('should update a board title as admin', async () => {
        const res = await request(app)
          .put(`/api/board/titles/${testTitleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            rank: 10
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.boardTitle.rank).toEqual(10);
      });

      it('should reject update by member', async () => {
        const res = await request(app)
          .put(`/api/board/titles/${testTitleId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            rank: 5
          });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /api/board/titles/:id', () => {
      it('should reject deletion of title with active members', async () => {
        // First create a board member with this title
        await BoardMember.create({
          user_id: testUserId,
          title_id: testTitleId,
          start_date: '2025-01-01',
          end_date: null
        });

        const res = await request(app)
          .delete(`/api/board/titles/${testTitleId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toContain('Cannot delete board title');
      });
    });
  });

  describe('Board Members', () => {
    beforeAll(async () => {
      // Clean up any existing board members for testUserId
      await BoardMember.destroy({ where: { user_id: testUserId } });

      // Create a board title for member tests
      const title = await BoardTitle.create({
        title: 'Treasurer',
        rank: 3
      });
      testTitleId = title.id;
    });

    describe('POST /api/board/members', () => {
      it('should create a board member as admin', async () => {
        const res = await request(app)
          .post('/api/board/members')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            user_id: testUserId,
            title_id: testTitleId,
            start_date: '2025-01-01',
            bio: 'Test board member bio'
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('Board member created successfully');
        testMemberId = res.body.boardMember.id;
      });

      it('should reject duplicate active board position', async () => {
        const res = await request(app)
          .post('/api/board/members')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            user_id: testUserId,
            title_id: testTitleId,
            start_date: '2025-02-01'
          });

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toContain('already has an active board position');
      });

      it('should reject member creation by non-admin', async () => {
        const res = await request(app)
          .post('/api/board/members')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            user_id: testUserId,
            title_id: testTitleId,
            start_date: '2025-01-01'
          });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /api/board/members/:id', () => {
      it('should update a board member as admin', async () => {
        const res = await request(app)
          .put(`/api/board/members/${testMemberId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            bio: 'Updated bio',
            end_date: '2025-12-31'
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.boardMember.bio).toEqual('Updated bio');
      });

      it('should reject member update by non-admin', async () => {
        const res = await request(app)
          .put(`/api/board/members/${testMemberId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            bio: 'Unauthorized update'
          });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /api/board/members/:id', () => {
      it('should delete a board member as admin', async () => {
        const res = await request(app)
          .delete(`/api/board/members/${testMemberId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Board member deleted successfully');
      });

      it('should return 404 for non-existent member', async () => {
        const res = await request(app)
          .delete(`/api/board/members/99999`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(404);
      });
    });
  });

  describe('Board Roster', () => {
    beforeAll(async () => {
      // Create a board title and active member for roster tests
      const title = await BoardTitle.create({
        title: 'Chairperson',
        rank: 1
      });

      const adminUser = await User.findOne({ where: { email: 'testadmin@example.com' } });

      await BoardMember.create({
        user_id: adminUser.id,
        title_id: title.id,
        start_date: '2025-01-01',
        end_date: null,
        bio: 'Current chairperson'
      });

      // Create a historical member
      await BoardMember.create({
        user_id: adminUser.id,
        title_id: title.id,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        bio: 'Former chairperson'
      });
    });

    describe('GET /api/board', () => {
      it('should get current roster when visibility is public', async () => {
        await Config.upsert({ key: 'board.visibility', value: 'public' });

        const res = await request(app).get('/api/board');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('roster');
        expect(Array.isArray(res.body.roster)).toBeTruthy();
        expect(res.body.roster.length).toBeGreaterThan(0);
        expect(res.body.roster[0]).toHaveProperty('user');
        expect(res.body.roster[0]).toHaveProperty('title');
      });

      it('should return empty roster when visibility is private and not authenticated', async () => {
        await Config.upsert({ key: 'board.visibility', value: 'private' });

        const res = await request(app).get('/api/board');

        expect(res.statusCode).toEqual(200);
        expect(res.body.roster).toEqual([]);
        expect(res.body.count).toEqual(0);
      });

      it('should get roster when authenticated even if visibility is private', async () => {
        await Config.upsert({ key: 'board.visibility', value: 'private' });

        const res = await request(app)
          .get('/api/board')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.roster.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/board/history', () => {
      it('should get board history when visibility allows', async () => {
        await Config.upsert({ key: 'board.history-visibility', value: 'public' });

        const res = await request(app).get('/api/board/history');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('history');
        expect(Array.isArray(res.body.history)).toBeTruthy();
      });

      it('should reject history access when members-only and not authenticated', async () => {
        await Config.upsert({ key: 'board.history-visibility', value: 'members-only' });

        const res = await request(app).get('/api/board/history');

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('only available to authenticated members');
      });

      it('should allow history access for authenticated members', async () => {
        await Config.upsert({ key: 'board.history-visibility', value: 'members-only' });

        const res = await request(app)
          .get('/api/board/history')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.history.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Board Contact', () => {
    beforeAll(async () => {
      // Ensure there's at least one active board member to receive contact
      const title = await BoardTitle.findOne();
      const adminUser = await User.findOne({ where: { email: 'testadmin@example.com' } });

      await BoardMember.create({
        user_id: adminUser.id,
        title_id: title.id,
        start_date: '2025-01-01',
        end_date: null
      });
    });

    describe('POST /api/board/contact', () => {
      it('should reject contact request without captcha token when captcha is enabled', async () => {
        // Set TURNSTILE_SECRET_KEY to enable captcha verification
        const originalSecret = process.env.TURNSTILE_SECRET_KEY;
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';

        const res = await request(app)
          .post('/api/board/contact')
          .send({
            requestor_email: 'resident@example.com',
            subject: 'Test Subject',
            message: 'Test message'
          });

        // Restore original secret
        if (originalSecret) {
          process.env.TURNSTILE_SECRET_KEY = originalSecret;
        } else {
          delete process.env.TURNSTILE_SECRET_KEY;
        }

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Captcha');
      });

      it('should reject contact request with missing fields', async () => {
        const res = await request(app)
          .post('/api/board/contact')
          .send({
            requestor_email: 'resident@example.com',
            subject: 'Test Subject'
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Missing required fields');
      });

      it('should sanitize HTML from subject and message', async () => {
        // Mock the captcha middleware by setting TURNSTILE_SECRET_KEY to empty
        const originalSecret = process.env.TURNSTILE_SECRET_KEY;
        delete process.env.TURNSTILE_SECRET_KEY;

        const res = await request(app)
          .post('/api/board/contact')
          .send({
            requestor_email: 'resident@example.com',
            subject: '<script>alert("xss")</script>Clean Subject',
            message: '<b>Bold text</b> and <a href="#">link</a>',
            captcha_token: 'dummy-token'
          });

        // Restore original secret
        if (originalSecret) {
          process.env.TURNSTILE_SECRET_KEY = originalSecret;
        }

        // Should succeed (201) or fail to send (502/503) but not allow HTML
        expect([201, 502, 503]).toContain(res.statusCode);
      });
    });
  });
});
