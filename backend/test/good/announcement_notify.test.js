jest.mock('../../src/services/email.service', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const emailService = require('../../src/services/email.service');

describe('Announcement notify flag', () => {
  let adminToken;
  let memberToken;

  beforeAll(async () => {
    await setupTestDB();
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@example.com', password: 'testadmin123' });
    adminToken = adminLogin.body.token;
    memberToken = await createAndApproveUser(
      { name: 'Notify Member', email: 'notifymember@example.com', password: 'Notifymember123!' },
      adminToken
    );
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should create announcement and trigger email notifications when notify=true', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Notify All', content: 'Announcement content', notify: true });

    expect(res.statusCode).toBe(201);
    expect(emailService.sendMail).toHaveBeenCalled();
  });
});

