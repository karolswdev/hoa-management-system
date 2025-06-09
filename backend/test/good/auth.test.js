const request = require('supertest');
const app = require('../../src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB } = require('../utils/dbHelpers');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@example.com',
          password: 'testadmin123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
    });
  });
});