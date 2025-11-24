// Mock dependencies BEFORE requiring modules
jest.mock('../../src/config/logger');

// Mock SendGrid provider
const mockSend = jest.fn();
const mockInit = jest.fn();
jest.mock('../../src/services/providers/sendgrid.provider', () => ({
  init: mockInit,
  send: mockSend
}));

// Mock models
jest.mock('../../models', () => {
  const actualSequelize = jest.requireActual('sequelize');
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    finished: false
  };

  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction)
    },
    EmailAudit: {
      create: jest.fn()
    },
    ResidentNotificationLog: {
      create: jest.fn()
    },
    Sequelize: actualSequelize.Sequelize
  };
});

const emailService = require('../../src/services/email.service');
const { EmailAudit, ResidentNotificationLog, sequelize } = require('../../models');
const logger = require('../../src/config/logger');

describe('Email Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Helper Functions', () => {
    describe('computePayloadHash', () => {
      it('should generate consistent hash for same payload', () => {
        const payload1 = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' };
        const payload2 = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' };

        const hash1 = emailService.computePayloadHash(payload1);
        const hash2 = emailService.computePayloadHash(payload2);

        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
      });

      it('should generate different hash for different payload', () => {
        const payload1 = { to: 'test1@example.com', subject: 'Test' };
        const payload2 = { to: 'test2@example.com', subject: 'Test' };

        const hash1 = emailService.computePayloadHash(payload1);
        const hash2 = emailService.computePayloadHash(payload2);

        expect(hash1).not.toBe(hash2);
      });

      it('should normalize key order for hashing', () => {
        const payload1 = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' };
        const payload2 = { html: '<p>Test</p>', subject: 'Test', to: 'test@example.com' };

        const hash1 = emailService.computePayloadHash(payload1);
        const hash2 = emailService.computePayloadHash(payload2);

        expect(hash1).toBe(hash2);
      });
    });

    describe('chunkArray', () => {
      it('should split array into correct batch sizes', () => {
        const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const chunks = emailService.chunkArray(array, 3);

        expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
      });

      it('should handle empty array', () => {
        const chunks = emailService.chunkArray([], 5);
        expect(chunks).toEqual([]);
      });

      it('should handle array smaller than batch size', () => {
        const array = [1, 2, 3];
        const chunks = emailService.chunkArray(array, 10);

        expect(chunks).toEqual([[1, 2, 3]]);
      });

      it('should handle array exactly divisible by batch size', () => {
        const array = [1, 2, 3, 4, 5, 6];
        const chunks = emailService.chunkArray(array, 3);

        expect(chunks).toEqual([[1, 2, 3], [4, 5, 6]]);
      });
    });
  });

  describe('sendWithRetry', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.EMAIL_FROM = 'test@example.com';
    });

    afterEach(() => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_FROM;
    });

    it('should send email successfully on first attempt', async () => {
      const mockResponse = { messageId: 'test-message-id' };
      mockSend.mockResolvedValueOnce(mockResponse);

      const payload = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      const result = await emailService.sendWithRetry(payload);

      expect(result).toEqual(mockResponse);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Email sent successfully', expect.any(Object));
    });

    it('should retry on failure with exponential backoff', async () => {
      const error = new Error('SendGrid API error');
      mockSend
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ messageId: 'success' });

      const payload = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      const result = await emailService.sendWithRetry(payload);

      expect(result).toEqual({ messageId: 'success' });
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries exceeded', async () => {
      const error = new Error('SendGrid API error');
      mockSend.mockRejectedValue(error);

      const payload = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      await expect(emailService.sendWithRetry(payload)).rejects.toThrow('SendGrid API error');
      expect(mockSend).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(logger.error).toHaveBeenCalledWith('Email send failed after all retries', expect.any(Object));
    });

    it('should simulate email send in log-only mode', async () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;

      const payload = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      const result = await emailService.sendWithRetry(payload);

      expect(result.simulated).toBe(true);
      expect(result.messageId).toMatch(/^log-only-/);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('sendPollNotificationEmail', () => {
    let mockTransaction;

    beforeEach(async () => {
      // Reset mock transaction
      mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        finished: false
      };

      // Mock environment
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.EMAIL_FROM = 'test@example.com';

      // Mock successful send
      mockSend.mockResolvedValue({ messageId: 'test-message-id' });

      // Mock sequelize.transaction
      sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    afterEach(async () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_FROM;
    });

    it('should send poll notification emails in batches', async () => {
      // Create mock recipients (60 recipients to test batching)
      const recipients = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`
      }));

      const mockEmailAudit = {
        id: 1,
        template: 'poll-notify',
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      const result = await emailService.sendPollNotificationEmail({
        pollTitle: 'Test Poll',
        pollDescription: 'Test Description',
        startAt: new Date(),
        endAt: new Date(Date.now() + 86400000),
        pollType: 'informal',
        recipients,
        correlationId: 'test-correlation-id'
      });

      expect(result.successCount).toBe(60);
      expect(result.failureCount).toBe(0);
      expect(result.totalRecipients).toBe(60);

      // Should batch into 2 batches (50 + 10)
      expect(mockSend).toHaveBeenCalledTimes(2);

      // Verify EmailAudit was created
      expect(EmailAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'poll-notify',
          recipient_count: 60,
          request_payload_hash: 'test-correlation-id',
          status: 'pending'
        }),
        { transaction: mockTransaction }
      );

      // Verify EmailAudit was updated to 'sent'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'sent' },
        { transaction: mockTransaction }
      );

      // Verify ResidentNotificationLog entries (60 recipients)
      expect(ResidentNotificationLog.create).toHaveBeenCalledTimes(60);

      // Verify transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle partial batch failures', async () => {
      const recipients = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`
      }));

      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      // First batch succeeds, second batch fails (with retries)
      mockSend
        .mockResolvedValueOnce({ messageId: 'batch-1' }) // First batch succeeds
        .mockRejectedValueOnce(new Error('Batch 2 failed')) // Second batch attempt 1 fails
        .mockRejectedValueOnce(new Error('Batch 2 failed')) // Second batch attempt 2 fails
        .mockRejectedValueOnce(new Error('Batch 2 failed')); // Second batch attempt 3 fails

      const result = await emailService.sendPollNotificationEmail({
        pollTitle: 'Test Poll',
        pollDescription: 'Test Description',
        startAt: new Date(),
        endAt: new Date(Date.now() + 86400000),
        pollType: 'binding',
        recipients
      });

      expect(result.successCount).toBe(50);
      expect(result.failureCount).toBe(50);
      expect(result.totalRecipients).toBe(100);

      // Verify status was set to 'partial'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'partial' },
        { transaction: mockTransaction }
      );

      // Verify all recipients were logged (success + failure)
      expect(ResidentNotificationLog.create).toHaveBeenCalledTimes(100);
    });

    it('should rollback transaction on critical error', async () => {
      const recipients = [
        { id: 1, email: 'user1@example.com', name: 'User 1' }
      ];

      EmailAudit.create.mockRejectedValue(new Error('Database error'));

      await expect(
        emailService.sendPollNotificationEmail({
          pollTitle: 'Test Poll',
          pollDescription: 'Test Description',
          startAt: new Date(),
          endAt: new Date(Date.now() + 86400000),
          pollType: 'informal',
          recipients
        })
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Poll notification email failed', expect.any(Object));
    });
  });

  describe('sendPollReceiptEmail', () => {
    let mockTransaction;

    beforeEach(async () => {
      mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        finished: false
      };

      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.EMAIL_FROM = 'test@example.com';

      mockSend.mockResolvedValue({ messageId: 'test-message-id' });
      sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    afterEach(async () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_FROM;
    });

    it('should send poll receipt email successfully', async () => {
      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      const result = await emailService.sendPollReceiptEmail({
        userId: 1,
        userEmail: 'voter@example.com',
        userName: 'John Doe',
        pollTitle: 'Test Poll',
        receiptCode: 'RECEIPT-123',
        voteHash: 'abc123def456',
        timestamp: new Date(),
        correlationId: 'vote-correlation-id'
      });

      expect(result.status).toBe('sent');
      expect(result.emailAuditId).toBe(1);

      // Verify EmailAudit was created
      expect(EmailAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'poll-receipt',
          recipient_count: 1,
          request_payload_hash: 'vote-correlation-id',
          status: 'pending'
        }),
        { transaction: mockTransaction }
      );

      // Verify email was sent
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'voter@example.com',
          subject: expect.stringContaining('Vote Receipt')
        })
      );

      // Verify status was updated to 'sent'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'sent' },
        { transaction: mockTransaction }
      );

      // Verify ResidentNotificationLog entry
      expect(ResidentNotificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          email_audit_id: 1,
          status: 'sent'
        }),
        { transaction: mockTransaction }
      );

      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle email send failure gracefully', async () => {
      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      mockSend.mockRejectedValue(new Error('SendGrid API error'));

      await expect(
        emailService.sendPollReceiptEmail({
          userId: 1,
          userEmail: 'voter@example.com',
          userName: 'John Doe',
          pollTitle: 'Test Poll',
          receiptCode: 'RECEIPT-123',
          voteHash: 'abc123def456',
          timestamp: new Date()
        })
      ).rejects.toThrow('SendGrid API error');

      // Verify status was updated to 'failed'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'failed' },
        { transaction: mockTransaction }
      );

      // Verify failure was logged
      expect(ResidentNotificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          status: 'failed'
        }),
        { transaction: mockTransaction }
      );

      // Transaction should still commit (graceful failure logging)
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on critical error', async () => {
      EmailAudit.create.mockRejectedValue(new Error('Database error'));

      await expect(
        emailService.sendPollReceiptEmail({
          userId: 1,
          userEmail: 'voter@example.com',
          userName: 'John Doe',
          pollTitle: 'Test Poll',
          receiptCode: 'RECEIPT-123',
          voteHash: 'abc123def456',
          timestamp: new Date()
        })
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Poll receipt email transaction failed',
        expect.any(Object)
      );
    });
  });

  describe('sendVendorSubmissionAlert', () => {
    let mockTransaction;

    beforeEach(async () => {
      mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        finished: false
      };

      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.EMAIL_FROM = 'admin@example.com';

      mockSend.mockResolvedValue({ messageId: 'test-message-id' });
      sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    afterEach(async () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_FROM;
    });

    it('should send vendor submission alert to admins successfully', async () => {
      const adminRecipients = [
        { id: 1, email: 'admin1@example.com', name: 'Admin One' },
        { id: 2, email: 'admin2@example.com', name: 'Admin Two' }
      ];

      const mockEmailAudit = {
        id: 1,
        template: 'vendor-submission-alert',
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      const result = await emailService.sendVendorSubmissionAlert({
        vendorId: 123,
        vendorName: 'Best Landscaping Co.',
        serviceCategory: 'Landscaping',
        submitterName: 'John Doe',
        adminRecipients,
        correlationId: 'vendor-123-submission'
      });

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.totalRecipients).toBe(2);

      // Verify EmailAudit was created
      expect(EmailAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'vendor-submission-alert',
          recipient_count: 2,
          request_payload_hash: 'vendor-123-submission',
          status: 'pending'
        }),
        { transaction: mockTransaction }
      );

      // Verify email was sent with proper content
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          bcc: ['admin1@example.com', 'admin2@example.com'],
          subject: 'New Vendor Submission Requires Review'
        })
      );

      // Verify EmailAudit was updated to 'sent'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'sent' },
        { transaction: mockTransaction }
      );

      // Verify ResidentNotificationLog entries
      expect(ResidentNotificationLog.create).toHaveBeenCalledTimes(2);

      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle email send failure gracefully', async () => {
      const adminRecipients = [
        { id: 1, email: 'admin@example.com', name: 'Admin' }
      ];

      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      mockSend.mockRejectedValue(new Error('SendGrid API error'));

      const result = await emailService.sendVendorSubmissionAlert({
        vendorId: 123,
        vendorName: 'Test Vendor',
        serviceCategory: 'Testing',
        submitterName: 'User',
        adminRecipients
      });

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);

      // Verify status was set to 'failed'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'failed' },
        { transaction: mockTransaction }
      );

      // Verify failure was logged
      expect(ResidentNotificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          status: 'failed'
        }),
        { transaction: mockTransaction }
      );
    });

    it('should rollback transaction on critical error', async () => {
      const adminRecipients = [
        { id: 1, email: 'admin@example.com', name: 'Admin' }
      ];

      EmailAudit.create.mockRejectedValue(new Error('Database error'));

      await expect(
        emailService.sendVendorSubmissionAlert({
          vendorId: 123,
          vendorName: 'Test',
          serviceCategory: 'Test',
          submitterName: 'User',
          adminRecipients
        })
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Vendor submission alert failed',
        expect.any(Object)
      );
    });
  });

  describe('sendVendorApprovalBroadcast', () => {
    let mockTransaction;

    beforeEach(async () => {
      mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        finished: false
      };

      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.EMAIL_FROM = 'noreply@example.com';

      mockSend.mockResolvedValue({ messageId: 'test-message-id' });
      sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    afterEach(async () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_FROM;
    });

    it('should send vendor approval broadcast to residents successfully', async () => {
      const recipients = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        email: `resident${i + 1}@example.com`,
        name: `Resident ${i + 1}`
      }));

      const mockEmailAudit = {
        id: 1,
        template: 'vendor-approval-broadcast',
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      const result = await emailService.sendVendorApprovalBroadcast({
        vendorId: 456,
        vendorName: 'Premium Pool Service',
        serviceCategory: 'Pool Maintenance',
        contactInfo: 'info@premiumpool.com',
        recipients,
        correlationId: 'vendor-456-approval'
      });

      expect(result.successCount).toBe(25);
      expect(result.failureCount).toBe(0);
      expect(result.totalRecipients).toBe(25);

      // Verify EmailAudit was created
      expect(EmailAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'vendor-approval-broadcast',
          recipient_count: 25,
          request_payload_hash: 'vendor-456-approval',
          status: 'pending'
        }),
        { transaction: mockTransaction }
      );

      // Verify email was sent with proper content
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'noreply@example.com',
          subject: 'New Vendor Approved: Premium Pool Service'
        })
      );

      // Verify subject includes vendor name
      const sendCall = mockSend.mock.calls[0][0];
      expect(sendCall.html).toContain('Premium Pool Service');
      expect(sendCall.html).toContain('Pool Maintenance');
      expect(sendCall.html).toContain('info@premiumpool.com');
      expect(sendCall.html).toContain('Section 4.7 of the HOA bylaws');

      // Verify EmailAudit was updated to 'sent'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'sent' },
        { transaction: mockTransaction }
      );

      // Verify ResidentNotificationLog entries
      expect(ResidentNotificationLog.create).toHaveBeenCalledTimes(25);

      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should batch large recipient lists correctly', async () => {
      const recipients = Array.from({ length: 120 }, (_, i) => ({
        id: i + 1,
        email: `resident${i + 1}@example.com`,
        name: `Resident ${i + 1}`
      }));

      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      const result = await emailService.sendVendorApprovalBroadcast({
        vendorId: 789,
        vendorName: 'Elite Security',
        serviceCategory: 'Security',
        contactInfo: null,
        recipients
      });

      expect(result.successCount).toBe(120);
      expect(result.failureCount).toBe(0);

      // Should batch into 3 batches (50 + 50 + 20)
      expect(mockSend).toHaveBeenCalledTimes(3);

      // Verify ResidentNotificationLog entries for all recipients
      expect(ResidentNotificationLog.create).toHaveBeenCalledTimes(120);
    });

    it('should handle partial batch failures', async () => {
      const recipients = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        email: `resident${i + 1}@example.com`,
        name: `Resident ${i + 1}`
      }));

      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      // First batch succeeds, second batch fails
      mockSend
        .mockResolvedValueOnce({ messageId: 'batch-1' })
        .mockRejectedValueOnce(new Error('Batch 2 failed'))
        .mockRejectedValueOnce(new Error('Batch 2 failed'))
        .mockRejectedValueOnce(new Error('Batch 2 failed'));

      const result = await emailService.sendVendorApprovalBroadcast({
        vendorId: 999,
        vendorName: 'Test Vendor',
        serviceCategory: 'Testing',
        contactInfo: 'test@example.com',
        recipients
      });

      expect(result.successCount).toBe(50);
      expect(result.failureCount).toBe(25);

      // Verify status was set to 'partial'
      expect(mockEmailAudit.update).toHaveBeenCalledWith(
        { status: 'partial' },
        { transaction: mockTransaction }
      );

      // Verify all recipients were logged
      expect(ResidentNotificationLog.create).toHaveBeenCalledTimes(75);
    });

    it('should include unsubscribe instructions in email', async () => {
      const recipients = [
        { id: 1, email: 'resident@example.com', name: 'Resident' }
      ];

      const mockEmailAudit = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      EmailAudit.create.mockResolvedValue(mockEmailAudit);
      ResidentNotificationLog.create.mockResolvedValue({});

      await emailService.sendVendorApprovalBroadcast({
        vendorId: 111,
        vendorName: 'Compliance Test Vendor',
        serviceCategory: 'Testing',
        contactInfo: null,
        recipients
      });

      const sendCall = mockSend.mock.calls[0][0];

      // Check HTML version
      expect(sendCall.html).toContain('unsubscribe');
      expect(sendCall.html).toContain('Section 4.7 of the HOA bylaws');
      expect(sendCall.html).toContain('notification preferences');

      // Check text version
      expect(sendCall.text).toContain('unsubscribe');
      expect(sendCall.text).toContain('Section 4.7 of the HOA bylaws');
    });
  });

  describe('Legacy sendMail', () => {
    beforeEach(() => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.EMAIL_FROM = 'test@example.com';
    });

    afterEach(() => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_FROM;
    });

    it('should maintain backward compatibility', async () => {
      mockSend.mockResolvedValue({ messageId: 'legacy-test' });

      const payload = {
        to: 'recipient@example.com',
        subject: 'Legacy Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      await emailService.sendMail(payload);

      expect(mockSend).toHaveBeenCalledWith(payload);
    });

    it('should log when not configured', async () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_API_KEY;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const payload = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      await emailService.sendMail(payload);

      expect(consoleSpy).toHaveBeenCalledWith('[email:log-only]', expect.any(String));
      expect(mockSend).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
