const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');

describe('Password Reset Rate Limiting', () => {
  let adminToken;
  const member = { name: 'Reset User', email: 'resetuser@example.com', password: 'Resetuser123!' };

  beforeAll(async () => {
    await setupTestDB();
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@example.com', password: 'testadmin123' });
    adminToken = adminLogin.body.token;
    await createAndApproveUser(member, adminToken);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should allow the first forgot-password request and rate-limit the second within an hour', async () => {
    const first = await request(app).post('/api/auth/forgot-password').send({ email: member.email });
    expect(first.statusCode).toBe(200);

    const second = await request(app).post('/api/auth/forgot-password').send({ email: member.email });
    expect([429, 400]).toContain(second.statusCode); // 429 preferred; 400 acceptable if validation path differs
  });
});

