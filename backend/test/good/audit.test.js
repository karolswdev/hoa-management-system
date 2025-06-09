const request = require('supertest');
const app = require('../../src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');

describe('Audit Log API Integration Tests', () => {
  let adminToken;
  let memberToken;

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

    // Register and login a member user
    memberToken = await createAndApproveUser(
      { name: 'Test Member', email: 'testmember@example.com', password: 'Testmember123!' },
      adminToken
    );
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /admin/audit-logs', () => {
    it('should retrieve audit logs as admin', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('should fail for non-admin user', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(res.statusCode).toEqual(403);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs');
      
      expect(res.statusCode).toEqual(401);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.pagination.limit).toEqual(5);
      expect(res.body.pagination.currentPage).toEqual(1);
    });

    it('should validate pagination params', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?page=0&limit=101')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('Audit Log Creation', () => {
    it('should create audit log for admin actions', async () => {
      // Perform an admin action that should trigger audit logging
      const createRes = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Audit Log',
          content: 'This should create an audit entry'
        });
      
      expect(createRes.statusCode).toEqual(201);

      // Verify audit log was created
      const auditRes = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(auditRes.statusCode).toEqual(200);
      const announcementAction = auditRes.body.data.find(
        log => log.action.includes('announcement_create')
      );
      expect(announcementAction).toBeDefined();
    });
  });
});