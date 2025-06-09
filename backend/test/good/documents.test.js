const request = require('supertest');
const app = require('../../src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const path = require('path');

describe('Document API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testDocumentId;

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

  describe('Public/User Document Access', () => {
    beforeAll(async () => {
      // Upload a test document
      const res = await request(app)
        .post('/api/admin/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Test Document')
        .field('is_public', true)
        .attach('documentFile', path.join(__dirname, '../fixtures/test.pdf'));
      testDocumentId = res.body.document.id;
    });

    describe('GET /documents', () => {
      it('should list public documents for guest', async () => {
        const res = await request(app)
          .get('/api/documents');
        
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.documents)).toBeTruthy();
      });

      it('should list all approved documents for member', async () => {
        const res = await request(app)
          .get('/api/documents')
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.documents)).toBeTruthy();
      });
    });

    describe('GET /documents/{documentId}', () => {
      it('should get document metadata for member', async () => {
        const res = await request(app)
          .get(`/api/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual('Test Document');
      });

      it('should fail for non-existent document', async () => {
        const res = await request(app)
          .get('/api/documents/9999')
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(404);
      });
    });

    describe('GET /documents/{documentId}/download', () => {
      it('should download document file', async () => {
        const res = await request(app)
          .get(`/api/documents/${testDocumentId}/download`)
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toEqual('application/pdf');
      });
    });
  });

  describe('Admin Document Management', () => {
    describe('POST /admin/documents', () => {
      it('should upload a new document', async () => {
        const res = await request(app)
          .post('/api/admin/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Admin Upload Test')
          .field('is_public', false)
          .attach('documentFile', path.join(__dirname, '../fixtures/test.pdf'));
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.document.title).toEqual('Admin Upload Test');
      });

      it('should fail with invalid file type', async () => {
        const res = await request(app)
          .post('/api/admin/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Invalid File')
          .field('is_public', true)
          .attach('documentFile', path.join(__dirname, '../fixtures/invalid.exe'));
        
        expect(res.statusCode).toEqual(400);
      });

      it('should fail without required fields', async () => {
        const res = await request(app)
          .post('/api/admin/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('documentFile', path.join(__dirname, '../fixtures/test.pdf'));
        
        expect(res.statusCode).toEqual(400);
      });
    });

    describe('PUT /admin/documents/{id}/approve', () => {
      it('should approve a document', async () => {
        // First upload an unapproved document
        const uploadRes = await request(app)
          .post('/api/admin/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Pending Approval')
          .field('is_public', false)
          .attach('documentFile', path.join(__dirname, '../fixtures/test.pdf'));
        
        const docId = uploadRes.body.document.id;
        
        const res = await request(app)
          .put(`/api/admin/documents/${docId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.approved).toBeTruthy();
      });
    });

    describe('DELETE /admin/documents/{id}', () => {
      it('should delete a document', async () => {
        // First upload a test document
        const uploadRes = await request(app)
          .post('/api/admin/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'To Be Deleted')
          .field('is_public', true)
          .attach('documentFile', path.join(__dirname, '../fixtures/test.pdf'));
        
        const docId = uploadRes.body.document.id;
        
        const res = await request(app)
          .delete(`/api/admin/documents/${docId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(204);
      });
    });
  });
});