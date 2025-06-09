const request = require('supertest');
const app = require('../../src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');

describe('Announcement API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testAnnouncementId;

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

    memberToken = await createAndApproveUser(
      { name: 'Test Member', email: 'testmember@example.com', password: 'Testmember123!' },
      adminToken
    );
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /announcements', () => {
    beforeAll(async () => {
      // Create a test announcement
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Announcement',
          content: 'This is a test announcement',
          expiresAt: '2025-12-31T23:59:59Z'
        });
      testAnnouncementId = res.body.id;
    });

    it('should list announcements for member', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('should list announcements for admin', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('Admin Announcement Management', () => {
    describe('POST /announcements', () => {
      it('should create announcement as admin', async () => {
        const res = await request(app)
          .post('/api/announcements')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'New Announcement',
            content: 'Important update',
            expiresAt: '2025-12-31T23:59:59Z'
          });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual('New Announcement');
      });

      it('should fail with missing required fields', async () => {
        const res = await request(app)
          .post('/api/announcements')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            content: 'Missing title'
          });
        
        expect(res.statusCode).toEqual(400);
      });

      it('should fail for non-admin user', async () => {
        const res = await request(app)
          .post('/api/announcements')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            title: 'Unauthorized',
            content: 'Should fail'
          });
        
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /announcements/{id}', () => {
      it('should update announcement as admin', async () => {
        const res = await request(app)
          .put(`/api/announcements/${testAnnouncementId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Updated Announcement',
            content: 'Updated content'
          });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual('Updated Announcement');
      });

      it('should fail for non-admin user', async () => {
        const res = await request(app)
          .put(`/api/announcements/${testAnnouncementId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            title: 'Unauthorized Update'
          });
        
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /announcements/{id}', () => {
      it('should delete announcement as admin', async () => {
        const res = await request(app)
          .delete(`/api/announcements/${testAnnouncementId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(204);
      });

      it('should fail for non-admin user', async () => {
        // First create a new announcement to delete
        const createRes = await request(app)
          .post('/api/announcements')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'To Delete',
            content: 'Will try to delete'
          });
        
        const res = await request(app)
          .delete(`/api/announcements/${createRes.body.id}`)
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(403);
      });
    });
  });
});