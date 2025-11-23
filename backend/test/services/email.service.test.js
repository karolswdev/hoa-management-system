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
