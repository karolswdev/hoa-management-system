const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const { User, Committee, CommitteeMember, ArcCategory, Config, WorkflowInstance } = require('../../models');
const path = require('path');
const fs = require('fs');

describe('Workflow Engine Integration Tests', () => {
  let adminToken;
  let memberToken;      // committee member
  let submitterToken;    // request submitter (not on committee)
  let outsiderToken;     // not on committee, not submitter
  let committeeId;
  let memberId;          // user ID of committee member
  let submitterUserId;
  let outsiderUserId;
  let categoryId;
  let workflowId;
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
      { name: 'WF Committee Member', email: 'wf-committee@example.com', password: 'TestMember123!' },
      adminToken
    );
    const cmUser = await User.findOne({ where: { email: 'wf-committee@example.com' } });
    memberId = cmUser.id;

    // Create submitter (regular member, not on any committee)
    submitterToken = await createAndApproveUser(
      { name: 'WF Submitter', email: 'wf-submitter@example.com', password: 'TestMember123!' },
      adminToken
    );
    const subUser = await User.findOne({ where: { email: 'wf-submitter@example.com' } });
    submitterUserId = subUser.id;

    // Create outsider (regular member, not on committee, not submitter)
    outsiderToken = await createAndApproveUser(
      { name: 'WF Outsider', email: 'wf-outsider@example.com', password: 'TestMember123!' },
      adminToken
    );
    const outUser = await User.findOne({ where: { email: 'wf-outsider@example.com' } });
    outsiderUserId = outUser.id;

    // Create test committee
    const committeeRes = await request(app)
      .post('/api/committees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Workflow Test Committee',
        description: 'For workflow engine testing',
        approval_expiration_days: 30
      });
    committeeId = committeeRes.body.committee.id;

    // Appoint committee member
    await request(app)
      .post(`/api/committees/${committeeId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: memberId, role: 'member' });

    // Create a test ARC category (test DB doesn't have production seeds)
    const newCat = await request(app)
      .post('/api/arc-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'WF Test Category', sort_order: 1 });
    categoryId = newCat.body.category.id;

    // Set the default ARC committee to our test committee
    await Config.upsert({ key: 'arc_default_committee_id', value: String(committeeId) });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // --- ARC Request Creation (creates workflow) ---

  describe('ARC Request + Workflow Creation', () => {
    it('should create ARC request and auto-create workflow', async () => {
      const res = await request(app)
        .post('/api/arc-requests')
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({
          property_address: '123 Test Lane',
          category_id: categoryId,
          description: 'I want to build a fence in my backyard'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.arcRequest).toBeDefined();
      expect(res.body.workflow).toBeDefined();
      expect(res.body.workflow.status).toEqual('submitted');
      expect(res.body.workflow.committee_id).toEqual(committeeId);
      expect(res.body.workflow.request_type).toEqual('arc_request');

      arcRequestId = res.body.arcRequest.id;
      workflowId = res.body.workflow.id;
    });
  });

  // --- State Machine Transitions ---

  describe('Workflow Transitions', () => {
    it('should allow committee member to move to under_review', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'under_review', comment: 'Starting review' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('under_review');
      expect(res.body.transition.from_status).toEqual('submitted');
      expect(res.body.transition.to_status).toEqual('under_review');
    });

    it('should reject invalid transition (under_review -> submitted)', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'submitted' });

      expect(res.statusCode).toEqual(400);
    });

    it('should NOT allow admin (not on committee) to transition', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ to_status: 'approved', comment: 'Admin trying to approve' });

      expect(res.statusCode).toEqual(403);
    });

    it('should NOT allow outsider to transition', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ to_status: 'approved' });

      expect(res.statusCode).toEqual(403);
    });

    it('should NOT allow submitter to approve', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ to_status: 'approved' });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow committee member to deny', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'denied', comment: 'Does not meet community standards' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('denied');
    });

    // --- Appeal Flow ---

    it('should allow submitter to appeal denied request', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ to_status: 'appealed', comment: 'I disagree with the decision' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('appealed');
    });

    it('should allow committee to move appeal to under review', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'appeal_under_review' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('appeal_under_review');
    });

    it('should allow committee to approve appeal (with expiration)', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          to_status: 'appeal_approved',
          comment: 'Approved on appeal after additional info',
          expiration_days: 60
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('appeal_approved');
      expect(res.body.workflow.expires_at).toBeDefined();
    });
  });

  // --- Second Request: Withdrawal Flow ---

  describe('Withdrawal Flow', () => {
    let wf2Id;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/arc-requests')
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({
          property_address: '456 Withdraw St',
          category_id: categoryId,
          description: 'Want to add solar panels'
        });
      wf2Id = res.body.workflow.id;
    });

    it('should allow submitter to withdraw a submitted request', async () => {
      const res = await request(app)
        .post(`/api/workflows/${wf2Id}/transitions`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ to_status: 'withdrawn', comment: 'Changed my mind' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('withdrawn');
    });

    it('should reject transitions on withdrawn request', async () => {
      const res = await request(app)
        .post(`/api/workflows/${wf2Id}/transitions`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ to_status: 'submitted' });

      expect(res.statusCode).toEqual(400);
    });
  });

  // --- Third Request: Appeal Limit ---

  describe('Appeal Limit', () => {
    let wf3Id;

    beforeAll(async () => {
      // Create request, move through submitted -> under_review -> denied -> appealed -> appeal_denied
      const createRes = await request(app)
        .post('/api/arc-requests')
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({
          property_address: '789 Appeal Ave',
          category_id: categoryId,
          description: 'Want to paint house bright pink'
        });
      wf3Id = createRes.body.workflow.id;

      // submitted -> under_review
      await request(app)
        .post(`/api/workflows/${wf3Id}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'under_review' });

      // under_review -> denied
      await request(app)
        .post(`/api/workflows/${wf3Id}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'denied', comment: 'Nope' });

      // denied -> appealed
      await request(app)
        .post(`/api/workflows/${wf3Id}/transitions`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ to_status: 'appealed' });

      // appealed -> appeal_under_review
      await request(app)
        .post(`/api/workflows/${wf3Id}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'appeal_under_review' });

      // appeal_under_review -> appeal_denied
      await request(app)
        .post(`/api/workflows/${wf3Id}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'appeal_denied' });
    });

    it('should NOT allow a second appeal (max 1)', async () => {
      const res = await request(app)
        .post(`/api/workflows/${wf3Id}/transitions`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ to_status: 'appealed' });

      // appeal_denied has no valid transitions, so this should be 400
      expect(res.statusCode).toEqual(400);
    });
  });

  // --- Comments ---

  describe('Workflow Comments', () => {
    it('should allow submitter to add comment', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/comments`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ content: 'Here is some additional info' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.comment.content).toEqual('Here is some additional info');
      expect(res.body.comment.is_internal).toEqual(false);
    });

    it('should allow committee member to add comment', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: 'Thanks for the info' });

      expect(res.statusCode).toEqual(201);
    });

    it('should allow committee member to add internal comment', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: 'Private note: this looks borderline', is_internal: true });

      expect(res.statusCode).toEqual(201);
      expect(res.body.comment.is_internal).toEqual(true);
    });

    it('should reject internal comment from submitter', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/comments`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ content: 'Trying to be sneaky', is_internal: true });

      expect(res.statusCode).toEqual(403);
    });

    it('should reject comment from outsider', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/comments`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ content: 'I have opinions too' });

      expect(res.statusCode).toEqual(403);
    });

    it('should reject empty comment', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/comments`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ content: '' });

      expect(res.statusCode).toEqual(400);
    });
  });

  // --- Attachments ---

  describe('Workflow Attachments', () => {
    const testFilePath = path.join(__dirname, '../fixtures/test-upload.pdf');

    beforeAll(() => {
      // Create a test fixtures directory and a small test file
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      if (!fs.existsSync(testFilePath)) {
        // Create a minimal PDF-like file for testing
        fs.writeFileSync(testFilePath, '%PDF-1.4 test content for upload testing');
      }
    });

    it('should allow submitter to upload attachment', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/attachments`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .attach('files', testFilePath);

      expect(res.statusCode).toEqual(201);
      expect(res.body.attachments).toBeDefined();
      expect(res.body.attachments.length).toEqual(1);
      expect(res.body.attachments[0].original_file_name).toEqual('test-upload.pdf');
    });

    it('should allow committee member to upload attachment', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/attachments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('files', testFilePath);

      expect(res.statusCode).toEqual(201);
    });

    it('should reject upload from outsider', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/attachments`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .attach('files', testFilePath);

      expect(res.statusCode).toEqual(403);
    });

    it('should reject upload without files', async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/attachments`)
        .set('Authorization', `Bearer ${submitterToken}`);

      expect(res.statusCode).toEqual(400);
    });
  });

  // --- Workflow Detail View ---

  describe('GET /api/workflows/:id', () => {
    it('should show full detail to submitter (without internal comments)', async () => {
      const res = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${submitterToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow).toBeDefined();
      expect(res.body.workflow.transitions).toBeDefined();
      expect(res.body.workflow.comments).toBeDefined();
      expect(res.body.workflow.attachments).toBeDefined();

      // Submitter should NOT see internal comments
      const internalComments = res.body.workflow.comments.filter(c => c.is_internal);
      expect(internalComments.length).toEqual(0);
    });

    it('should show full detail to committee member (including internal comments)', async () => {
      const res = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);

      // Committee member should see internal comments
      const internalComments = res.body.workflow.comments.filter(c => c.is_internal);
      expect(internalComments.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to view (read-only)', async () => {
      const res = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
    });

    it('should reject outsider from viewing', async () => {
      const res = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  // --- Workflow Listing ---

  describe('GET /api/workflows', () => {
    it('should list submitters own workflows', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${submitterToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should list committee workflows for committee member', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/workflows?status=appeal_approved')
        .set('Authorization', `Bearer ${submitterToken}`);

      expect(res.statusCode).toEqual(200);
      if (res.body.data.length > 0) {
        res.body.data.forEach(wf => {
          expect(wf.status).toEqual('appeal_approved');
        });
      }
    });
  });

  // --- Lazy Expiration ---

  describe('Lazy Expiration', () => {
    let expWfId;

    beforeAll(async () => {
      // Create a request, approve it, then manually set expires_at to the past
      const createRes = await request(app)
        .post('/api/arc-requests')
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({
          property_address: '999 Expire Rd',
          category_id: categoryId,
          description: 'Testing expiration'
        });
      expWfId = createRes.body.workflow.id;

      // submitted -> under_review -> approved
      await request(app)
        .post(`/api/workflows/${expWfId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'under_review' });

      await request(app)
        .post(`/api/workflows/${expWfId}/transitions`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ to_status: 'approved', expiration_days: 1 });

      // Manually set expires_at to the past
      await WorkflowInstance.update(
        { expires_at: new Date('2020-01-01') },
        { where: { id: expWfId } }
      );
    });

    it('should auto-expire on read when past expiration date', async () => {
      const res = await request(app)
        .get(`/api/workflows/${expWfId}`)
        .set('Authorization', `Bearer ${submitterToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.workflow.status).toEqual('expired');
    });
  });
});
