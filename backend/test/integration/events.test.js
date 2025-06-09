const request = require('supertest');
const app = require('../../../backend/src/app');
const { seedTestDB, cleanTestDB, setupTestDB, teardownTestDB, createAndApproveUser } = require('../utils/dbHelpers');
const { sequelize } = require('../../../backend/models');

describe('Event API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testEventId;

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

    memberToken = await createAndApproveUser( {name: 'Test Member', email: 'testmember@example.com', password: 'Testmember123!'}, adminToken);
    expect(memberToken).toBeDefined();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /events', () => {
    beforeAll(async () => {
      // Create a test event
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Event',
          description: 'This is a test event',
          event_date: '2025-12-31T18:00:00Z',
          location: 'Test Location'
        });
      testEventId = res.body.id;
    });

    it('should list upcoming events for member', async () => {
      const res = await request(app)
        .get('/api/events?status=upcoming')
        .set('Authorization', `Bearer ${memberToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('should list events for admin', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('should filter past events', async () => {
      const queryInterface = sequelize.getQueryInterface();
      await queryInterface.bulkInsert('events', [{
        title: 'Past Event',
        description: 'This is a past event',
        start_date: new Date('2020-01-01T18:00:00Z'), // Use start_date for the column name
        end_date: new Date('2020-01-01T19:00:00Z'),   // Use end_date
        location: 'Past Location',
        created_by: 1, // Assuming admin user ID is 1
        created_at: new Date(),
        updated_at: new Date(),
      }]);

      const res = await request(app)
        .get('/api/events?status=past')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.some(e => e.title === 'Past Event')).toBeTruthy();
    });
  });

  describe('Admin Event Management', () => {
    describe('POST /events', () => {
      it('should create event as admin', async () => {
        const res = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'New Event',
            description: 'Important event',
            event_date: '2025-12-31T18:00:00Z',
            location: 'Event Location'
          });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual('New Event');
      });

      it('should fail with missing required fields', async () => {
        const res = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Missing title'
          });
        
        expect(res.statusCode).toEqual(400);
      });

      it('should fail with past event date', async () => {
        const res = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Past Event',
            description: 'Should fail',
            event_date: '2020-01-01T00:00:00Z',
            location: 'Past'
          });
        
        expect(res.statusCode).toEqual(400);
      });

      it('should fail for non-admin user', async () => {
        const res = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            title: 'Unauthorized',
            description: 'Should fail'
          });
        
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /events/{id}', () => {
      it('should update event as admin', async () => {
        const res = await request(app)
          .put(`/api/events/${testEventId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Updated Event',
            description: 'Updated content'
          });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual('Updated Event');
      });

      it('should fail with end_date before start_date', async () => {
        const res = await request(app)
          .put(`/api/events/${testEventId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            start_date: '2025-12-31T18:00:00Z',
            end_date: '2025-12-30T18:00:00Z'
          });
        
        expect(res.statusCode).toEqual(400);
      });

      it('should fail for non-admin user', async () => {
        const res = await request(app)
          .put(`/api/events/${testEventId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            title: 'Unauthorized Update'
          });
        
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /events/{id}', () => {
      it('should delete event as admin', async () => {
        const res = await request(app)
          .delete(`/api/events/${testEventId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(204);
      });

      it('should fail for non-admin user', async () => {
        // First create a new event to delete
        const createRes = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'To Delete',
            description: 'Will try to delete',
            event_date: '2025-12-31T18:00:00Z',
            location: 'Test'
          });
        
        const res = await request(app)
          .delete(`/api/events/${createRes.body.id}`)
          .set('Authorization', `Bearer ${memberToken}`);
        
        expect(res.statusCode).toEqual(403);
      });
    });
  });
});