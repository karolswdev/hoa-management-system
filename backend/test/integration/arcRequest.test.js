const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const { User, Committee, CommitteeMember, Config, ArcCategory } = require('../../models');

describe('ARC Request & Category Integration Tests', () => {
  let adminToken;
  let memberToken;
  let submitterToken;
  let outsiderToken;
  let committeeId;
  let submitterUserId;
  let memberUserId;
  let outsiderUserId;
  let categoryId;
  let arcRequestId;

  beforeAll(async () => {
    await setupTestDB();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@example.com', password: 'testadmin123' });
    adminToken = adminLogin.body.token;

    // Create committee member
    memberToken = await createAndApproveUser(
      { name: 'ARC Committee Member', email: 'arc-committee@example.com', password: 'TestMember123!' },
      adminToken
    );
    const cmUser = await User.findOne({ where: { email: 'arc-committee@example.com' } });
    memberUserId = cmUser.id;

    // Create submitter
    submitterToken = await createAndApproveUser(
      { name: 'ARC Submitter', email: 'arc-submitter@example.com', password: 'TestMember123!' },
      adminToken
    );
    const subUser = await User.findOne({ where: { email: 'arc-submitter@example.com' } });
    submitterUserId = subUser.id;

    // Create outsider (not on any committee, not a submitter)
    outsiderToken = await createAndApproveUser(
      { name: 'ARC Outsider', email: 'arc-outsider@example.com', password: 'TestMember123!' },
      adminToken
    );
    const outUser = await User.findOne({ where: { email: 'arc-outsider@example.com' } });
    outsiderUserId = outUser.id;

    // Create ARC committee
    const committeeRes = await request(app)
      .post('/api/committees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'ARC Test Committee',
        description: 'For ARC integration testing',
        approval_expiration_days: 90
      });
    committeeId = committeeRes.body.committee.id;

    // Appoint committee member
    await request(app)
      .post(`/api/committees/${committeeId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: memberUserId, role: 'chair' });

    // Set default ARC committee in config
    await Config.upsert({ key: 'arc_default_committee_id', value: String(committeeId) });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // --- ARC Categories ---

  describe('ARC Categories', () => {
    describe('GET /api/arc-categories', () => {
      it('should list categories as member', async () => {
        const res = await request(app)
          .get('/api/arc-categories')
          .set('Authorization', `Bearer ${submitterToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.categories).toBeDefined();
        expect(Array.isArray(res.body.categories)).toBeTruthy();
        // Test DB doesn't have production seeds, so may be empty initially
      });

      it('should reject without auth', async () => {
        const res = await request(app).get('/api/arc-categories');
        expect(res.statusCode).toEqual(401);
      });
    });

    describe('POST /api/arc-categories', () => {
      it('should create category as admin', async () => {
        const res = await request(app)
          .post('/api/arc-categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Pool Installation',
            description: 'Above or below ground pool installation',
            sort_order: 10
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.category.name).toEqual('Pool Installation');
        categoryId = res.body.category.id;
      });

      it('should reject duplicate category name', async () => {
        const res = await request(app)
          .post('/api/arc-categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Pool Installation' });

        expect(res.statusCode).toEqual(409);
      });

      it('should reject category creation by member', async () => {
        const res = await request(app)
          .post('/api/arc-categories')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({ name: 'Unauthorized Category' });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /api/arc-categories/:id', () => {
      it('should update category as admin', async () => {
        const res = await request(app)
          .put(`/api/arc-categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Updated pool description',
            sort_order: 15
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.category.description).toEqual('Updated pool description');
        expect(res.body.category.sort_order).toEqual(15);
      });

      it('should reject update by member', async () => {
        const res = await request(app)
          .put(`/api/arc-categories/${categoryId}`)
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({ description: 'Nope' });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /api/arc-categories/:id', () => {
      it('should deactivate category as admin', async () => {
        // Create disposable category
        const createRes = await request(app)
          .post('/api/arc-categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Disposable Category' });
        const dispId = createRes.body.category.id;

        const res = await request(app)
          .delete(`/api/arc-categories/${dispId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
      });

      it('should reject deactivation by member', async () => {
        const res = await request(app)
          .delete(`/api/arc-categories/${categoryId}`)
          .set('Authorization', `Bearer ${submitterToken}`);

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  // --- ARC Requests ---

  describe('ARC Requests', () => {
    describe('POST /api/arc-requests', () => {
      it('should create ARC request with workflow', async () => {
        const res = await request(app)
          .post('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '100 Oak Street, Unit 5',
            category_id: categoryId,
            description: 'Want to install an above-ground pool in the backyard. Dimensions: 15x30 feet.'
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.arcRequest).toBeDefined();
        expect(res.body.arcRequest.property_address).toEqual('100 Oak Street, Unit 5');
        expect(res.body.arcRequest.description).toContain('above-ground pool');
        expect(res.body.workflow).toBeDefined();
        expect(res.body.workflow.status).toEqual('submitted');
        arcRequestId = res.body.arcRequest.id;
      });

      it('should reject without required fields', async () => {
        const res = await request(app)
          .post('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '100 Oak Street'
            // missing category_id and description
          });

        expect(res.statusCode).toEqual(400);
      });

      it('should reject invalid category', async () => {
        const res = await request(app)
          .post('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '200 Elm St',
            category_id: 99999,
            description: 'Invalid category test'
          });

        expect(res.statusCode).toEqual(400);
      });

      it('should reject without auth', async () => {
        const res = await request(app)
          .post('/api/arc-requests')
          .send({
            property_address: '300 Pine Ave',
            category_id: categoryId,
            description: 'No auth test'
          });

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('GET /api/arc-requests', () => {
      it('should list own requests for submitter', async () => {
        const res = await request(app)
          .get('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);

        const found = res.body.data.find(r => r.id === arcRequestId);
        expect(found).toBeDefined();
        expect(found.property_address).toEqual('100 Oak Street, Unit 5');
        expect(found.category).toBeDefined();
        expect(found.workflow).toBeDefined();
      });

      it('should list committee requests for committee member', async () => {
        const res = await request(app)
          .get('/api/arc-requests')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeDefined();
        // Committee member should see requests assigned to their committee
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });

      it('should list all requests for admin', async () => {
        const res = await request(app)
          .get('/api/arc-requests')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeDefined();
      });
    });

    describe('GET /api/arc-requests/:id', () => {
      it('should get request detail for submitter', async () => {
        const res = await request(app)
          .get(`/api/arc-requests/${arcRequestId}`)
          .set('Authorization', `Bearer ${submitterToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.arcRequest).toBeDefined();
        expect(res.body.arcRequest.property_address).toEqual('100 Oak Street, Unit 5');
        expect(res.body.arcRequest.submitter).toBeDefined();
        expect(res.body.arcRequest.category).toBeDefined();
        expect(res.body.workflow).toBeDefined();
        expect(res.body.workflow.transitions).toBeDefined();
      });

      it('should get request detail for committee member', async () => {
        const res = await request(app)
          .get(`/api/arc-requests/${arcRequestId}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
      });

      it('should return 404 for non-existent request', async () => {
        const res = await request(app)
          .get('/api/arc-requests/99999')
          .set('Authorization', `Bearer ${submitterToken}`);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('GET /api/arc-requests/:id - Access Control', () => {
      it('should deny access to outsider (not submitter, not committee, not admin)', async () => {
        const res = await request(app)
          .get(`/api/arc-requests/${arcRequestId}`)
          .set('Authorization', `Bearer ${outsiderToken}`);

        // The outsider has no committee memberships, so isCommitteeMember=false in the controller.
        // The service checks: not submitter, not committee member, not admin => Access denied
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /api/arc-requests/:id - Update Draft', () => {
      let draftArcId;
      let draftWfId;

      beforeAll(async () => {
        // Create a request with submit_immediately=false to get draft status
        const res = await request(app)
          .post('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '700 Draft Lane',
            category_id: categoryId,
            description: 'Draft test request',
            submit_immediately: false
          });

        expect(res.statusCode).toEqual(201);
        draftArcId = res.body.arcRequest.id;
        draftWfId = res.body.workflow.id;
      });

      it('should allow submitter to update a draft ARC request', async () => {
        const res = await request(app)
          .put(`/api/arc-requests/${draftArcId}`)
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '700 Draft Lane, Updated',
            description: 'Updated draft description'
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.arcRequest.property_address).toEqual('700 Draft Lane, Updated');
        expect(res.body.arcRequest.description).toEqual('Updated draft description');
      });

      it('should allow updating category_id on draft', async () => {
        const res = await request(app)
          .put(`/api/arc-requests/${draftArcId}`)
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            category_id: categoryId
          });

        expect(res.statusCode).toEqual(200);
      });

      it('should reject update with invalid category_id', async () => {
        const res = await request(app)
          .put(`/api/arc-requests/${draftArcId}`)
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            category_id: 99999
          });

        expect(res.statusCode).toEqual(400);
      });

      it('should reject update from non-submitter', async () => {
        const res = await request(app)
          .put(`/api/arc-requests/${draftArcId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ description: 'Trying to update someone else request' });

        expect(res.statusCode).toEqual(403);
      });

      it('should reject update for non-existent ARC request', async () => {
        const res = await request(app)
          .put('/api/arc-requests/99999')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({ description: 'Non-existent request' });

        expect(res.statusCode).toEqual(404);
      });

      it('should reject update on non-draft request (already submitted)', async () => {
        // arcRequestId was created with submit_immediately=true, so its status is 'submitted'
        const res = await request(app)
          .put(`/api/arc-requests/${arcRequestId}`)
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({ description: 'Cannot update submitted request' });

        expect(res.statusCode).toEqual(403);
      });
    });

    // --- End-to-End Flow ---

    describe('Full ARC Request Lifecycle', () => {
      let lifecycleArcId;
      let lifecycleWfId;

      it('should complete full lifecycle: submit -> review -> approve', async () => {
        // 1. Submit request
        const createRes = await request(app)
          .post('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '500 Lifecycle Blvd',
            category_id: categoryId,
            description: 'Full lifecycle test: new fence along property line'
          });

        expect(createRes.statusCode).toEqual(201);
        lifecycleArcId = createRes.body.arcRequest.id;
        lifecycleWfId = createRes.body.workflow.id;

        // 2. Committee begins review
        const reviewRes = await request(app)
          .post(`/api/workflows/${lifecycleWfId}/transitions`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ to_status: 'under_review', comment: 'Beginning review of fence request' });

        expect(reviewRes.statusCode).toEqual(200);
        expect(reviewRes.body.workflow.status).toEqual('under_review');

        // 3. Committee adds a comment
        const commentRes = await request(app)
          .post(`/api/workflows/${lifecycleWfId}/comments`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ content: 'Please provide a survey showing the property line' });

        expect(commentRes.statusCode).toEqual(201);

        // 4. Submitter responds
        const replyRes = await request(app)
          .post(`/api/workflows/${lifecycleWfId}/comments`)
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({ content: 'Here is the survey info: lot 5, section B, front setback 25ft' });

        expect(replyRes.statusCode).toEqual(201);

        // 5. Committee approves
        const approveRes = await request(app)
          .post(`/api/workflows/${lifecycleWfId}/transitions`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            to_status: 'approved',
            comment: 'Approved. Fence must be 6ft max, cedar or vinyl.',
            expiration_days: 90
          });

        expect(approveRes.statusCode).toEqual(200);
        expect(approveRes.body.workflow.status).toEqual('approved');
        expect(approveRes.body.workflow.expires_at).toBeDefined();

        // 6. Verify final state via detail endpoint
        const detailRes = await request(app)
          .get(`/api/arc-requests/${lifecycleArcId}`)
          .set('Authorization', `Bearer ${submitterToken}`);

        expect(detailRes.statusCode).toEqual(200);
        expect(detailRes.body.workflow.status).toEqual('approved');
        expect(detailRes.body.workflow.transitions.length).toBeGreaterThanOrEqual(3);
        expect(detailRes.body.workflow.comments.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // --- Additional Category Edge Cases ---

  describe('ARC Category Edge Cases', () => {
    describe('PUT /api/arc-categories/:id - non-existent category', () => {
      it('should return 404 for non-existent category', async () => {
        const res = await request(app)
          .put('/api/arc-categories/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Ghost Category' });

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('DELETE /api/arc-categories/:id - non-existent category', () => {
      it('should return 404 for non-existent category', async () => {
        const res = await request(app)
          .delete('/api/arc-categories/99999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('PUT /api/arc-categories/:id - update with inactive category for request', () => {
      it('should reject update with inactive category', async () => {
        // Create a category, deactivate it, then try to use it
        const createRes = await request(app)
          .post('/api/arc-categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Soon Inactive Category' });
        const inactiveCatId = createRes.body.category.id;

        // Deactivate it
        await request(app)
          .delete(`/api/arc-categories/${inactiveCatId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Try to create a request with the inactive category
        const res = await request(app)
          .post('/api/arc-requests')
          .set('Authorization', `Bearer ${submitterToken}`)
          .send({
            property_address: '800 Inactive Cat St',
            category_id: inactiveCatId,
            description: 'Testing inactive category'
          });

        expect(res.statusCode).toEqual(400);
      });
    });
  });
});
