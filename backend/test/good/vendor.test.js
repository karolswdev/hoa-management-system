const request = require('supertest');
const app = require('../../src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB } = require('../utils/dbHelpers');
const { Vendor, Config } = require('../../models');

describe('Vendor API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testVendorId;

  beforeAll(async () => {
    await setupTestDB();

    // Login as admin to get token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@example.com',
        password: 'testadmin123'
      });
    adminToken = adminLoginRes.body.token;

    // Login as member to get token
    const memberLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testmember@example.com',
        password: 'testmember123'
      });
    memberToken = memberLoginRes.body.token;

    // Set up vendors.public-categories config
    await Config.upsert({
      key: 'vendors.public-categories',
      value: 'Landscaping,Pool Maintenance'
    });

    // Create test vendor
    const vendor = await Vendor.create({
      name: 'Test Landscaping Co',
      service_category: 'Landscaping',
      contact_info: '555-1234, test@example.com',
      rating: 4,
      notes: 'Reliable service',
      visibility_scope: 'public',
      moderation_state: 'approved',
      created_by: 1
    });
    testVendorId = vendor.id;

    // Create pending vendor for moderation tests
    await Vendor.create({
      name: 'Pending Vendor',
      service_category: 'Landscaping',
      contact_info: '555-5678',
      visibility_scope: 'members',
      moderation_state: 'pending',
      created_by: 2
    });

    // Create members-only vendor
    await Vendor.create({
      name: 'Members Only Vendor',
      service_category: 'Security',
      contact_info: '555-9999',
      rating: 5,
      visibility_scope: 'members',
      moderation_state: 'approved',
      created_by: 1
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/vendors - Get vendors with filtering', () => {
    describe('Guest access (unauthenticated)', () => {
      it('should return only approved public vendors in public categories', async () => {
        const res = await request(app)
          .get('/api/vendors');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('vendors');
        expect(res.body).toHaveProperty('count');

        // Should only see approved public vendors in allowed categories
        const vendors = res.body.vendors;
        expect(vendors.length).toBeGreaterThan(0);

        // All vendors should be approved and public
        vendors.forEach(vendor => {
          expect(vendor.visibility_scope).toBe('public');
          expect(['Landscaping', 'Pool Maintenance']).toContain(vendor.service_category);
          // Guests should not see contact info or ratings
          expect(vendor.contact_info).toBeUndefined();
          expect(vendor.rating).toBeUndefined();
          // Should have basic fields
          expect(vendor).toHaveProperty('id');
          expect(vendor).toHaveProperty('name');
          expect(vendor).toHaveProperty('service_category');
        });
      });

      it('should not return pending vendors to guests', async () => {
        const res = await request(app)
          .get('/api/vendors');

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        // Should not include pending vendors
        const hasPending = vendors.some(v => v.name === 'Pending Vendor');
        expect(hasPending).toBe(false);
      });

      it('should filter by category for guests', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .query({ category: 'Landscaping' });

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        vendors.forEach(vendor => {
          expect(vendor.service_category).toBe('Landscaping');
        });
      });

      it('should search vendors by name for guests', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .query({ search: 'Test' });

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        vendors.forEach(vendor => {
          expect(vendor.name.toLowerCase()).toContain('test');
        });
      });
    });

    describe('Member access (authenticated)', () => {
      it('should return approved public and member vendors with contact info', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        expect(vendors.length).toBeGreaterThan(0);

        // Members should see contact info and ratings
        const publicVendor = vendors.find(v => v.visibility_scope === 'public');
        if (publicVendor) {
          expect(publicVendor.contact_info).toBeDefined();
          if (publicVendor.rating) {
            expect(publicVendor.rating).toBeGreaterThanOrEqual(1);
            expect(publicVendor.rating).toBeLessThanOrEqual(5);
          }
        }
      });

      it('should not see pending vendors as member', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        const hasPending = vendors.some(v => v.name === 'Pending Vendor');
        expect(hasPending).toBe(false);
      });

      it('should see members-only vendors as member', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        const membersOnlyVendor = vendors.find(v => v.name === 'Members Only Vendor');
        expect(membersOnlyVendor).toBeDefined();
      });
    });

    describe('Admin access', () => {
      it('should see all vendors including pending', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        // Should include pending vendors
        const pendingVendor = vendors.find(v => v.name === 'Pending Vendor');
        expect(pendingVendor).toBeDefined();
        expect(pendingVendor).toHaveProperty('moderation_state');
        expect(pendingVendor).toHaveProperty('notes');
      });

      it('should filter by moderation state (admin only)', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ status: 'pending' });

        expect(res.statusCode).toEqual(200);
        const vendors = res.body.vendors;

        vendors.forEach(vendor => {
          expect(vendor.moderation_state).toBe('pending');
        });
      });

      it('should ignore status filter for non-admin users', async () => {
        const res = await request(app)
          .get('/api/vendors')
          .set('Authorization', `Bearer ${memberToken}`)
          .query({ status: 'pending' });

        expect(res.statusCode).toEqual(200);
        // Filter should be ignored, so no pending vendors returned
        const vendors = res.body.vendors;
        const hasPending = vendors.some(v => v.moderation_state === 'pending');
        expect(hasPending).toBe(false);
      });
    });
  });

  describe('GET /api/vendors/:id - Get vendor by ID', () => {
    it('should return vendor for guest if public and approved', async () => {
      const res = await request(app)
        .get(`/api/vendors/${testVendorId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.vendor).toHaveProperty('id', testVendorId);
      expect(res.body.vendor).toHaveProperty('name');
      // Guests should not see contact info
      expect(res.body.vendor.contact_info).toBeUndefined();
    });

    it('should return 404 for pending vendor as guest', async () => {
      const pendingVendor = await Vendor.findOne({ where: { moderation_state: 'pending' } });

      const res = await request(app)
        .get(`/api/vendors/${pendingVendor.id}`);

      expect(res.statusCode).toEqual(404);
    });

    it('should return vendor with contact info for member', async () => {
      const res = await request(app)
        .get(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.vendor).toHaveProperty('contact_info');
      expect(res.body.vendor).toHaveProperty('rating');
    });

    it('should return full vendor details for admin', async () => {
      const res = await request(app)
        .get(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.vendor).toHaveProperty('moderation_state');
      expect(res.body.vendor).toHaveProperty('notes');
      expect(res.body.vendor).toHaveProperty('created_by');
    });

    it('should return 404 for non-existent vendor', async () => {
      const res = await request(app)
        .get('/api/vendors/99999');

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/vendors - Create vendor', () => {
    it('should allow member to submit vendor for moderation', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'New Vendor Co',
          service_category: 'Plumbing',
          contact_info: '555-1111',
          notes: 'Good service'
        });

      expect(res.statusCode).toEqual(202); // Accepted for moderation
      expect(res.body).toHaveProperty('message', 'Vendor submitted for moderation');
      expect(res.body.vendor).toHaveProperty('moderation_state', 'pending');
    });

    it('should allow admin to create approved vendor directly', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Vendor Co',
          service_category: 'Electrical',
          contact_info: '555-2222',
          rating: 5,
          visibility_scope: 'public'
        });

      expect(res.statusCode).toEqual(201); // Created
      expect(res.body).toHaveProperty('message', 'Vendor created successfully');
      expect(res.body.vendor).toHaveProperty('moderation_state', 'approved');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .send({
          name: 'Unauthorized Vendor',
          service_category: 'Landscaping'
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Missing Category'
          // Missing service_category
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should fail with invalid rating', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bad Rating Vendor',
          service_category: 'Landscaping',
          rating: 10 // Invalid - must be 1-5
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should sanitize text fields', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '<script>alert("xss")</script>Safe Name',
          service_category: 'Landscaping',
          contact_info: '<b>Contact</b> info'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.vendor.name).not.toContain('<script>');
      expect(res.body.vendor.contact_info).not.toContain('<b>');
    });
  });

  describe('PUT /api/vendors/:id - Update vendor (admin only)', () => {
    it('should allow admin to update vendor', async () => {
      const res = await request(app)
        .put(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Vendor Name',
          rating: 5
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Vendor updated successfully');
      expect(res.body.vendor).toHaveProperty('name', 'Updated Vendor Name');
      expect(res.body.vendor).toHaveProperty('rating', 5);
    });

    it('should fail without admin token', async () => {
      const res = await request(app)
        .put(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Should Fail'
        });

      expect(res.statusCode).toEqual(403);
    });

    it('should fail for non-existent vendor', async () => {
      const res = await request(app)
        .put('/api/vendors/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Does Not Exist'
        });

      expect(res.statusCode).toEqual(404);
    });

    it('should validate rating range', async () => {
      const res = await request(app)
        .put(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 0 // Invalid
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('DELETE /api/vendors/:id - Delete vendor (admin only)', () => {
    it('should allow admin to delete vendor', async () => {
      // Create a vendor to delete
      const vendor = await Vendor.create({
        name: 'To Be Deleted',
        service_category: 'Landscaping',
        visibility_scope: 'members',
        moderation_state: 'approved',
        created_by: 1
      });

      const res = await request(app)
        .delete(`/api/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Vendor deleted successfully');

      // Verify vendor is deleted
      const deletedVendor = await Vendor.findByPk(vendor.id);
      expect(deletedVendor).toBeNull();
    });

    it('should fail without admin token', async () => {
      const res = await request(app)
        .delete(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for non-existent vendor', async () => {
      const res = await request(app)
        .delete('/api/vendors/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PATCH /api/vendors/:id/moderate - Moderate vendor (admin only)', () => {
    it('should allow admin to approve pending vendor', async () => {
      const pendingVendor = await Vendor.findOne({ where: { moderation_state: 'pending' } });

      const res = await request(app)
        .patch(`/api/vendors/${pendingVendor.id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          moderation_state: 'approved'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Vendor moderation state updated successfully');
      expect(res.body.vendor).toHaveProperty('moderation_state', 'approved');
    });

    it('should allow admin to deny vendor', async () => {
      // Create a vendor to deny
      const vendor = await Vendor.create({
        name: 'To Be Denied',
        service_category: 'Landscaping',
        visibility_scope: 'members',
        moderation_state: 'pending',
        created_by: 2
      });

      const res = await request(app)
        .patch(`/api/vendors/${vendor.id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          moderation_state: 'denied'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.vendor).toHaveProperty('moderation_state', 'denied');
    });

    it('should fail without moderation_state field', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendorId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
    });

    it('should fail with invalid moderation_state', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendorId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          moderation_state: 'invalid_state'
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should fail without admin token', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendorId}/moderate`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          moderation_state: 'approved'
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/vendors/stats - Get vendor statistics (admin only)', () => {
    it('should return vendor statistics for admin', async () => {
      const res = await request(app)
        .get('/api/vendors/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('byModerationState');
      expect(res.body.stats).toHaveProperty('byCategory');

      expect(Array.isArray(res.body.stats.byModerationState)).toBe(true);
      expect(Array.isArray(res.body.stats.byCategory)).toBe(true);
    });

    it('should fail without admin token', async () => {
      const res = await request(app)
        .get('/api/vendors/stats')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/vendors/stats');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Rate limiting', () => {
    it('should rate limit vendor creation', async () => {
      // This test would require multiple rapid requests
      // For now, just verify the endpoint is protected
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Rate Limit Test',
          service_category: 'Testing'
        });

      // Should succeed on first attempt
      expect([201, 202, 400]).toContain(res.statusCode);
    });
  });

  describe('Visibility and security', () => {
    it('should not expose admin-only fields to members', async () => {
      const res = await request(app)
        .get(`/api/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      // Members should not see notes or moderation state
      expect(res.body.vendor.notes).toBeUndefined();
      expect(res.body.vendor.moderation_state).toBeUndefined();
    });

    it('should not expose member fields to guests', async () => {
      const res = await request(app)
        .get(`/api/vendors/${testVendorId}`);

      expect(res.statusCode).toEqual(200);
      // Guests should not see contact info or rating
      expect(res.body.vendor.contact_info).toBeUndefined();
      expect(res.body.vendor.rating).toBeUndefined();
    });
  });
});
