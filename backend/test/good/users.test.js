const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser, createAndApproveUserForUserManagement } = require('../utils/dbHelpers');

describe('User API Integration Tests', () => {
  let adminToken;
  let userToken;
  let testUserId;

  beforeAll(async () => {
    await setupTestDB();
    
    // Login as admin to get token for admin tests
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@example.com',
        password: 'testadmin123'
      });
    adminToken = loginRes.body.token;

    // Create, approve, and login a test user using our new helper
    const { token, user } = await createAndApproveUserForUserManagement(
      {
        name: 'Test User',
        email: 'testuser@example.com',
        // FIX: Use a password that meets complexity requirements
        password: 'Testuser123!' 
      },
      adminToken
    );
    userToken = token;
    testUserId = user.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('User Self-Management', () => {
    // REMOVED: The inner beforeAll is no longer needed!

    describe('GET /api/users/me', () => {
      it('should get current user profile', async () => {
        const res = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', testUserId);
        expect(res.body.email).toEqual('testuser@example.com');
      });

      it('should fail without token', async () => {
        const res = await request(app)
          .get('/api/users/me');
        
        expect(res.statusCode).toEqual(401);
      });
    });

    describe('PUT /api/users/me', () => {
      it('should update user profile', async () => {
        const res = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Updated Test User'
          });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Updated Test User');
      });

      it('should fail with empty name', async () => {
        const res = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: ''
          });
        
        expect(res.statusCode).toEqual(400);
      });
    });

    describe('PUT /api/users/me/password', () => {
      it('should change password', async () => {
        const res = await request(app)
          .put('/api/users/me/password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            currentPassword: 'Testuser123!',
            newPassword: 'Newpassword123!'
          });
        
        expect(res.statusCode).toEqual(200);
      });

      it('should fail with incorrect current password', async () => {
        const res = await request(app)
          .put('/api/users/me/password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            currentPassword: 'wrongpassword',
            newPassword: 'Newpassword123!'
          });
        
        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('Admin User Management', () => {
    describe('GET /api/admin/users', () => {
      it('should list all users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        // FIX: The response from the service uses `rows`, not `users`.
        expect(Array.isArray(res.body.rows)).toBeTruthy();
      });

      it('should fail without admin token', async () => {
        const res = await request(app)
          .get('/api/admin/users');
        
        expect(res.statusCode).toEqual(401);
      });
    });

    describe('PUT /api/admin/users/{userId}/status', () => {
      // Note: User is already approved in beforeAll, so we'll test another status change
      it('should update user status to rejected', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${testUserId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'rejected'
          });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('rejected');
      });

      it('should fail with invalid status', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${testUserId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'invalid'
          });
        
        expect(res.statusCode).toEqual(400);
      });
    });

    describe('DELETE /api/admin/users/{userId}', () => {
      it('should delete user', async () => {
        // We need a NEW user to delete, because if we delete testUser, other tests might fail
        // if they run after this one.
        const response = await createAndApproveUserForUserManagement(
            { name: 'Delete Me', email: 'deleteme@example.com', password: 'Password123!' },
            adminToken
        );

        const res = await request(app)
          .delete(`/api/admin/users/${response.user.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
      });

      it('should fail with invalid user id', async () => {
        const res = await request(app)
          .delete('/api/admin/users/9999')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(404);
      });
    });
  });
});