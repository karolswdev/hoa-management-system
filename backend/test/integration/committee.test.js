const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const { User } = require('../../models');

describe('Committee API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let member2Token;
  let testUserId;
  let member2UserId;
  let committeeId;

  beforeAll(async () => {
    await setupTestDB();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@example.com', password: 'testadmin123' });
    adminToken = adminLogin.body.token;

    // Create test members
    memberToken = await createAndApproveUser(
      { name: 'Committee Test Member', email: 'committee-member@example.com', password: 'TestMember123!' },
      adminToken
    );
    const testUser = await User.findOne({ where: { email: 'committee-member@example.com' } });
    testUserId = testUser.id;

    member2Token = await createAndApproveUser(
      { name: 'Committee Test Member 2', email: 'committee-member2@example.com', password: 'TestMember123!' },
      adminToken
    );
    const testUser2 = await User.findOne({ where: { email: 'committee-member2@example.com' } });
    member2UserId = testUser2.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // --- Committee CRUD ---

  describe('POST /api/committees', () => {
    it('should create a committee as admin', async () => {
      const res = await request(app)
        .post('/api/committees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Review Committee',
          description: 'A test committee for integration testing',
          approval_expiration_days: 90
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.committee).toBeDefined();
      expect(res.body.committee.name).toEqual('Test Review Committee');
      expect(res.body.committee.description).toEqual('A test committee for integration testing');
      expect(res.body.committee.status).toEqual('active');
      expect(res.body.committee.approval_expiration_days).toEqual(90);
      committeeId = res.body.committee.id;
    });

    it('should reject duplicate committee name', async () => {
      const res = await request(app)
        .post('/api/committees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Review Committee' });

      expect(res.statusCode).toEqual(409);
    });

    it('should reject committee creation without name', async () => {
      const res = await request(app)
        .post('/api/committees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No name provided' });

      expect(res.statusCode).toEqual(400);
    });

    it('should reject committee creation by member', async () => {
      const res = await request(app)
        .post('/api/committees')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Unauthorized Committee' });

      expect(res.statusCode).toEqual(403);
    });

    it('should reject committee creation without auth', async () => {
      const res = await request(app)
        .post('/api/committees')
        .send({ name: 'No Auth Committee' });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/committees', () => {
    it('should list active committees as member', async () => {
      const res = await request(app)
        .get('/api/committees')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.committees).toBeDefined();
      expect(Array.isArray(res.body.committees)).toBeTruthy();
      // Should include our test committee and possibly the seeded ARC committee
      const names = res.body.committees.map(c => c.name);
      expect(names).toContain('Test Review Committee');
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/committees');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/committees/:id', () => {
    it('should get committee detail with members', async () => {
      const res = await request(app)
        .get(`/api/committees/${committeeId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.committee).toBeDefined();
      expect(res.body.committee.name).toEqual('Test Review Committee');
      expect(res.body.committee.members).toBeDefined();
      expect(Array.isArray(res.body.committee.members)).toBeTruthy();
    });

    it('should return 404 for non-existent committee', async () => {
      const res = await request(app)
        .get('/api/committees/99999')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/committees/:id', () => {
    it('should update committee as admin', async () => {
      const res = await request(app)
        .put(`/api/committees/${committeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
          approval_expiration_days: 180
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.committee.description).toEqual('Updated description');
      expect(res.body.committee.approval_expiration_days).toEqual(180);
    });

    it('should reject update by member', async () => {
      const res = await request(app)
        .put(`/api/committees/${committeeId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ description: 'Unauthorized update' });

      expect(res.statusCode).toEqual(403);
    });
  });

  // --- Committee Membership ---

  describe('POST /api/committees/:id/members', () => {
    it('should add a member to committee as admin', async () => {
      const res = await request(app)
        .post(`/api/committees/${committeeId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: testUserId, role: 'member' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.membership).toBeDefined();
      expect(res.body.membership.role).toEqual('member');
    });

    it('should add a chair to committee', async () => {
      const res = await request(app)
        .post(`/api/committees/${committeeId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: member2UserId, role: 'chair' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.membership.role).toEqual('chair');
    });

    it('should reject duplicate membership', async () => {
      const res = await request(app)
        .post(`/api/committees/${committeeId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: testUserId, role: 'member' });

      expect(res.statusCode).toEqual(409);
    });

    it('should reject adding pending user', async () => {
      const pendingUser = await User.findOne({ where: { email: 'pending@example.com' } });
      const res = await request(app)
        .post(`/api/committees/${committeeId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: pendingUser.id, role: 'member' });

      expect(res.statusCode).toEqual(400);
    });

    it('should reject adding member by non-admin', async () => {
      const res = await request(app)
        .post(`/api/committees/${committeeId}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ user_id: testUserId, role: 'member' });

      expect(res.statusCode).toEqual(403);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post(`/api/committees/${committeeId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: testUserId, role: 'superadmin' });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/committees/:id (with members)', () => {
    it('should show members with user info', async () => {
      const res = await request(app)
        .get(`/api/committees/${committeeId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.committee.members.length).toBeGreaterThanOrEqual(2);

      const memberEntry = res.body.committee.members.find(m => m.user_id === testUserId);
      expect(memberEntry).toBeDefined();
      expect(memberEntry.role).toEqual('member');
      expect(memberEntry.user).toBeDefined();
      expect(memberEntry.user.name).toEqual('Committee Test Member');
    });
  });

  describe('DELETE /api/committees/:id/members/:userId', () => {
    it('should remove member from committee as admin', async () => {
      const res = await request(app)
        .delete(`/api/committees/${committeeId}/members/${member2UserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
    });

    it('should return 404 for non-member', async () => {
      const res = await request(app)
        .delete(`/api/committees/${committeeId}/members/${member2UserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
    });

    it('should reject removal by non-admin', async () => {
      const res = await request(app)
        .delete(`/api/committees/${committeeId}/members/${testUserId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  // --- Committee Deactivation ---

  describe('DELETE /api/committees/:id', () => {
    it('should deactivate committee as admin', async () => {
      // Create a disposable committee for this test
      const createRes = await request(app)
        .post('/api/committees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Disposable Committee' });

      const dispId = createRes.body.committee.id;

      const res = await request(app)
        .delete(`/api/committees/${dispId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);

      // Verify it's inactive
      const getRes = await request(app)
        .get(`/api/committees/${dispId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.body.committee.status).toEqual('inactive');
    });

    it('should reject deactivation by member', async () => {
      const res = await request(app)
        .delete(`/api/committees/${committeeId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });
});
