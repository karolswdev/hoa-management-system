const request = require('supertest');
const app = require('../../src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB } = require('../utils/dbHelpers');

describe('Configuration API Integration Tests', () => {
  let adminToken;

  beforeAll(async () => {
    await setupTestDB();
    
    // Login as admin to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@example.com',
        password: 'testadmin123'
      });
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /admin/config', () => {
    it('should retrieve all configurations (admin)', async () => {
      const res = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('hoa_name');
      expect(res.body).toHaveProperty('hoa_description');
    });

    it('should fail without admin token', async () => {
      const res = await request(app)
        .get('/api/admin/config');
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /admin/config/{key}', () => {
    it('should update configuration value (admin)', async () => {
      const res = await request(app)
        .put('/api/admin/config/hoa_name')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 'New HOA Name'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('key', 'hoa_name');
      expect(res.body).toHaveProperty('value', 'New HOA Name');
    });

    it('should fail with empty value', async () => {
      const res = await request(app)
        .put('/api/admin/config/hoa_name')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: ''
        });
      
      expect(res.statusCode).toEqual(400);
    });

    it('should fail without admin token', async () => {
      const res = await request(app)
        .put('/api/admin/config/hoa_name')
        .send({
          value: 'Should Fail'
        });
      
      expect(res.statusCode).toEqual(401);
    });
  });
});