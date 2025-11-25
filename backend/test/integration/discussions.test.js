const request = require('supertest');
const app = require('../../../backend/src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');

describe('Discussion API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let member2Token;
  let testThreadId;
  let testReplyId;

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
    expect(adminToken).toBeDefined();

    console.log(adminToken);

       // 2. Create and get tokens for member users using the helper
    memberToken = await createAndApproveUser(
      { name: 'Test Member', email: 'testmember@example.com', password: 'Testmember123!' },
      adminToken
    );
    
    member2Token = await createAndApproveUser(
      { name: 'Test Member 2', email: 'testmember2@example.com', password: 'Testmember123!' },
      adminToken
    );

    // Assert that the tokens were actually created
    expect(memberToken).toBeDefined();
    expect(member2Token).toBeDefined();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST api/discussions', () => {
    it('should create discussion thread as member', async () => {
      const res = await request(app)
        .post('/api/discussions')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Test Discussion',
          content: 'This is a test discussion thread'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toEqual('Test Discussion');
      testThreadId = res.body.id;
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/discussions')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: 'Missing title'
        });
      
      expect(res.statusCode).toEqual(400);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/discussions')
        .send({
          title: 'Unauthorized',
          content: 'Should fail'
        });
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/discussions/{threadId}/replies', () => {
    it('should post reply to thread', async () => {
      const res = await request(app)
        .post(`/api/discussions/${testThreadId}/replies`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          content: 'This is a test reply'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      testReplyId = res.body.id;
    });

    it('should fail with empty content', async () => {
      const res = await request(app)
        .post(`/api/discussions/${testThreadId}/replies`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: ''
        });
      
      expect(res.statusCode).toEqual(400);
    });

    it('should fail for non-existent thread', async () => {
      const res = await request(app)
        .post('/api/discussions/9999/replies')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: 'Test reply'
        });
      
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /api/discussions', () => {
    it('should list discussion threads', async () => {
      const res = await request(app)
        .get('/api/discussions')
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.threads)).toBeTruthy();
      expect(res.body.threads.some(t => t.id === testThreadId)).toBeTruthy();
    });

    it('should include reply counts', async () => {
      const res = await request(app)
        .get('/api/discussions')
        .set('Authorization', `Bearer ${memberToken}`);
      
      const thread = res.body.threads.find(t => t.id === testThreadId);
      expect(thread.reply_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/discussions/{threadId}', () => {
    it('should get thread with replies', async () => {
      const res = await request(app)
        .get(`/api/discussions/${testThreadId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.mainThread.id).toEqual(testThreadId);
      expect(Array.isArray(res.body.replies)).toBeTruthy();
      expect(res.body.replies.some(r => r.id === testReplyId)).toBeTruthy();
    });

    it('should fail for non-existent thread', async () => {
      const res = await request(app)
        .get('/api/discussions/9999')
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Admin Discussion Management', () => {
    describe('DELETE /api/discussions/{threadId}', () => {
      it('should delete thread as admin', async () => {
        // Create a new thread to delete
        const createRes = await request(app)
          .post('/api/discussions')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            title: 'Thread to delete',
            content: 'Content'
          });
        
        const res = await request(app)
          .delete(`/api/discussions/${createRes.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(204);
      });

      it('should fail for non-admin user', async () => {
        const res = await request(app)
          .delete(`/api/discussions/${testThreadId}`)
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /api/discussions/replies/{replyId}', () => {
      it('should delete reply as admin', async () => {
        const res = await request(app)
          .delete(`/api/discussions/replies/${testReplyId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(204);
      });

      it('should fail for non-admin user', async () => {
        // Create a new reply to try deleting
        const createRes = await request(app)
          .post(`/api/discussions/${testThreadId}/replies`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            content: 'Test reply to delete'
          });
        
        const res = await request(app)
          .delete(`/api/discussions/replies/${createRes.body.id}`)
          .set('Authorization', `Bearer ${member2Token}`);
        
        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('Code of Conduct Acceptance', () => {
    describe('GET /api/discussions/code-of-conduct/acceptance', () => {
      it('should return 404 when user has not accepted CoC', async () => {
        const res = await request(app)
          .get('/api/discussions/code-of-conduct/acceptance')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('No Code of Conduct acceptance found');
      });

      it('should fail without authentication', async () => {
        const res = await request(app)
          .get('/api/discussions/code-of-conduct/acceptance');

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('POST /api/discussions/code-of-conduct/accept', () => {
      it('should accept Code of Conduct with version', async () => {
        const res = await request(app)
          .post('/api/discussions/code-of-conduct/accept')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            version: '1'
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toContain('accepted successfully');
        expect(res.body.acceptance).toHaveProperty('version', '1');
        expect(res.body.acceptance).toHaveProperty('accepted_at');
      });

      it('should return existing acceptance if already accepted same version', async () => {
        const res = await request(app)
          .post('/api/discussions/code-of-conduct/accept')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            version: '1'
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.acceptance).toHaveProperty('version', '1');
      });

      it('should fail without version', async () => {
        const res = await request(app)
          .post('/api/discussions/code-of-conduct/accept')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Version is required');
      });

      it('should fail without authentication', async () => {
        const res = await request(app)
          .post('/api/discussions/code-of-conduct/accept')
          .send({
            version: '1'
          });

        expect(res.statusCode).toEqual(401);
      });

      it('should retrieve acceptance after accepting', async () => {
        const res = await request(app)
          .get('/api/discussions/code-of-conduct/acceptance')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('version', '1');
        expect(res.body).toHaveProperty('user_id');
        expect(res.body).toHaveProperty('accepted_at');
        expect(res.body).toHaveProperty('current_version_accepted');
      });
    });
  });
});