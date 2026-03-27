/**
 * Unit tests for workflowEmail.service.js
 *
 * We mock the email.service (sendMail) and the Sequelize models so we can
 * exercise the notification logic without hitting a real DB or SMTP server.
 */

// ---- mocks must be set up before requiring the module under test ----
const mockSendMail = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/services/email.service', () => ({
  sendMail: mockSendMail,
}));

// Minimal Sequelize-like stubs
const mockFindAll = jest.fn();
const mockFindByPk = jest.fn();
const mockFindOne = jest.fn();

jest.mock('../../models', () => ({
  CommitteeMember: { findAll: mockFindAll, findOne: mockFindOne },
  User: { findByPk: mockFindByPk },
}));

// Suppress logger noise in tests
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const {
  notifyRequestSubmitted,
  notifyStatusChanged,
  notifyCommentAdded,
  notifyAppealFiled,
  notifyRequestWithdrawn,
  getCommitteeRecipients,
  getSubmitterInfo,
} = require('../../src/services/workflowEmail.service');

// ---- helpers ----
function makeRecipients(count) {
  return Array.from({ length: count }, (_, i) => ({
    user: { id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com` },
  }));
}

// ---- tests ----

beforeEach(() => {
  jest.clearAllMocks();
});

describe('workflowEmail.service', () => {
  // ================================================================
  // getCommitteeRecipients
  // ================================================================
  describe('getCommitteeRecipients', () => {
    it('should return mapped recipients from CommitteeMember.findAll', async () => {
      const raw = makeRecipients(2);
      mockFindAll.mockResolvedValue(raw);

      const result = await getCommitteeRecipients(42);

      expect(mockFindAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { committee_id: 42 },
      }));
      expect(result).toEqual([
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' },
      ]);
    });

    it('should return empty array when no members', async () => {
      mockFindAll.mockResolvedValue([]);
      const result = await getCommitteeRecipients(99);
      expect(result).toEqual([]);
    });
  });

  // ================================================================
  // getSubmitterInfo
  // ================================================================
  describe('getSubmitterInfo', () => {
    it('should return submitter info when user exists', async () => {
      mockFindByPk.mockResolvedValue({ id: 10, name: 'Alice', email: 'alice@example.com' });
      const result = await getSubmitterInfo(10);
      expect(result).toEqual({ id: 10, name: 'Alice', email: 'alice@example.com' });
    });

    it('should return null when user does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);
      const result = await getSubmitterInfo(999);
      expect(result).toBeNull();
    });
  });

  // ================================================================
  // notifyRequestSubmitted
  // ================================================================
  describe('notifyRequestSubmitted', () => {
    it('should send emails to all committee recipients', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(2));

      await notifyRequestSubmitted({
        workflowId: 1,
        committeeId: 42,
        requestType: 'arc_request',
        submitterName: 'Bob',
        summary: 'New fence',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com',
          subject: expect.stringContaining('Arc Request'),
          html: expect.stringContaining('Bob'),
        })
      );
      // Summary should appear in html
      expect(mockSendMail.mock.calls[0][0].html).toContain('New fence');
    });

    it('should handle request type formatting (underscores -> title case)', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(1));
      await notifyRequestSubmitted({
        workflowId: 1,
        committeeId: 42,
        requestType: 'building_permit',
        submitterName: 'Carol',
      });
      expect(mockSendMail.mock.calls[0][0].subject).toContain('Building Permit');
    });

    it('should skip sending when no recipients', async () => {
      mockFindAll.mockResolvedValue([]);
      await notifyRequestSubmitted({
        workflowId: 1,
        committeeId: 42,
        requestType: 'arc_request',
        submitterName: 'Nobody',
      });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not throw when sendMail fails (logs error)', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(1));
      mockSendMail.mockRejectedValueOnce(new Error('SMTP down'));

      // Should not throw
      await expect(
        notifyRequestSubmitted({
          workflowId: 1,
          committeeId: 42,
          requestType: 'arc_request',
          submitterName: 'Test',
        })
      ).resolves.toBeUndefined();
    });

    it('should omit summary block when summary is not provided', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(1));
      await notifyRequestSubmitted({
        workflowId: 1,
        committeeId: 42,
        requestType: 'arc_request',
        submitterName: 'Test',
        summary: undefined,
      });
      expect(mockSendMail.mock.calls[0][0].html).not.toContain('<strong>Summary:</strong>');
    });
  });

  // ================================================================
  // notifyStatusChanged
  // ================================================================
  describe('notifyStatusChanged', () => {
    it('should send email to submitter with formatted statuses', async () => {
      mockFindByPk.mockResolvedValue({ id: 5, name: 'Dave', email: 'dave@example.com' });

      await notifyStatusChanged({
        workflowId: 10,
        submitterId: 5,
        fromStatus: 'under_review',
        toStatus: 'approved',
        comment: 'Looks good!',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('dave@example.com');
      expect(call.subject).toContain('Approved');
      expect(call.html).toContain('Under Review');
      expect(call.html).toContain('Approved');
      expect(call.html).toContain('Looks good!');
    });

    it('should skip when submitter not found', async () => {
      mockFindByPk.mockResolvedValue(null);
      await notifyStatusChanged({
        workflowId: 10,
        submitterId: 999,
        fromStatus: 'submitted',
        toStatus: 'under_review',
      });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should omit comment block when comment is not provided', async () => {
      mockFindByPk.mockResolvedValue({ id: 5, name: 'Dave', email: 'dave@example.com' });
      await notifyStatusChanged({
        workflowId: 10,
        submitterId: 5,
        fromStatus: 'submitted',
        toStatus: 'under_review',
        comment: undefined,
      });
      expect(mockSendMail.mock.calls[0][0].html).not.toContain('Reviewer Note');
    });

    it('should not throw when sendMail fails', async () => {
      mockFindByPk.mockResolvedValue({ id: 5, name: 'Dave', email: 'dave@example.com' });
      mockSendMail.mockRejectedValueOnce(new Error('boom'));
      await expect(
        notifyStatusChanged({
          workflowId: 10,
          submitterId: 5,
          fromStatus: 'submitted',
          toStatus: 'denied',
        })
      ).resolves.toBeUndefined();
    });
  });

  // ================================================================
  // notifyCommentAdded
  // ================================================================
  describe('notifyCommentAdded', () => {
    it('should skip notification for internal comments', async () => {
      await notifyCommentAdded({
        workflowId: 1,
        committeeId: 42,
        submitterId: 5,
        commentAuthorId: 1,
        isInternal: true,
      });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should notify submitter when comment is from committee member', async () => {
      // commentAuthorId is a committee member
      mockFindByPk
        .mockResolvedValueOnce({ id: 1, name: 'Chair Person', email: 'chair@example.com' }) // author lookup
        .mockResolvedValueOnce({ id: 5, name: 'Submitter', email: 'submitter@example.com' }); // submitter lookup
      mockFindOne.mockResolvedValue({ id: 1 }); // isMember = truthy

      await notifyCommentAdded({
        workflowId: 1,
        committeeId: 42,
        submitterId: 5,
        commentAuthorId: 1,
        isInternal: false,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'submitter@example.com',
          subject: 'New Comment on Your Request',
        })
      );
    });

    it('should not send to submitter when submitter not found (member comment)', async () => {
      mockFindByPk
        .mockResolvedValueOnce({ id: 1, name: 'Chair', email: 'chair@example.com' })
        .mockResolvedValueOnce(null); // submitter not found
      mockFindOne.mockResolvedValue({ id: 1 }); // isMember

      await notifyCommentAdded({
        workflowId: 1,
        committeeId: 42,
        submitterId: 999,
        commentAuthorId: 1,
        isInternal: false,
      });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should notify committee when comment is from non-member (submitter)', async () => {
      mockFindByPk.mockResolvedValueOnce({ id: 5, name: 'Submitter', email: 'sub@example.com' }); // author lookup
      mockFindOne.mockResolvedValue(null); // not a member
      mockFindAll.mockResolvedValue(makeRecipients(2));

      await notifyCommentAdded({
        workflowId: 1,
        committeeId: 42,
        submitterId: 5,
        commentAuthorId: 5,
        isInternal: false,
      });

      // Should send to 2 recipients, minus author (commentAuthorId=5 != any recipient id 1,2)
      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockSendMail.mock.calls[0][0].subject).toContain('Request Under Review');
    });

    it('should skip the comment author when notifying committee', async () => {
      // Author id = 1, same as first recipient
      mockFindByPk.mockResolvedValueOnce({ id: 1, name: 'User 1', email: 'user1@example.com' });
      mockFindOne.mockResolvedValue(null);
      mockFindAll.mockResolvedValue(makeRecipients(2));

      await notifyCommentAdded({
        workflowId: 1,
        committeeId: 42,
        submitterId: 5,
        commentAuthorId: 1,
        isInternal: false,
      });

      // Only user2 should receive (user1 is the author)
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user2@example.com' })
      );
    });

    it('should handle author lookup returning null gracefully', async () => {
      mockFindByPk.mockResolvedValueOnce(null); // author not found
      mockFindOne.mockResolvedValue(null);
      mockFindAll.mockResolvedValue(makeRecipients(1));

      await notifyCommentAdded({
        workflowId: 1,
        committeeId: 42,
        submitterId: 5,
        commentAuthorId: 99,
        isInternal: false,
      });

      // Should still send, using 'Someone' as name
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0].html).toContain('Someone');
    });

    it('should not throw when sendMail fails', async () => {
      mockFindByPk.mockResolvedValueOnce({ id: 1, name: 'A', email: 'a@x.com' });
      mockFindOne.mockResolvedValue(null);
      mockFindAll.mockResolvedValue(makeRecipients(1));
      mockSendMail.mockRejectedValueOnce(new Error('fail'));

      await expect(
        notifyCommentAdded({
          workflowId: 1,
          committeeId: 42,
          submitterId: 5,
          commentAuthorId: 99,
          isInternal: false,
        })
      ).resolves.toBeUndefined();
    });
  });

  // ================================================================
  // notifyAppealFiled
  // ================================================================
  describe('notifyAppealFiled', () => {
    it('should send appeal notifications to all committee members', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(3));

      await notifyAppealFiled({
        workflowId: 7,
        committeeId: 42,
        submitterName: 'Eve',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(3);
      expect(mockSendMail.mock.calls[0][0].subject).toContain('Appeal Filed');
      expect(mockSendMail.mock.calls[0][0].html).toContain('Eve');
    });

    it('should skip when no recipients', async () => {
      mockFindAll.mockResolvedValue([]);
      await notifyAppealFiled({ workflowId: 7, committeeId: 42, submitterName: 'Eve' });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not throw when sendMail fails', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(1));
      mockSendMail.mockRejectedValueOnce(new Error('boom'));
      await expect(
        notifyAppealFiled({ workflowId: 7, committeeId: 42, submitterName: 'Eve' })
      ).resolves.toBeUndefined();
    });
  });

  // ================================================================
  // notifyRequestWithdrawn
  // ================================================================
  describe('notifyRequestWithdrawn', () => {
    it('should send withdrawal notifications to all committee members', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(2));

      await notifyRequestWithdrawn({
        workflowId: 8,
        committeeId: 42,
        submitterName: 'Frank',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockSendMail.mock.calls[0][0].subject).toContain('Request Withdrawn');
      expect(mockSendMail.mock.calls[0][0].html).toContain('Frank');
    });

    it('should skip when no recipients', async () => {
      mockFindAll.mockResolvedValue([]);
      await notifyRequestWithdrawn({ workflowId: 8, committeeId: 42, submitterName: 'Frank' });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not throw when sendMail fails', async () => {
      mockFindAll.mockResolvedValue(makeRecipients(1));
      mockSendMail.mockRejectedValueOnce(new Error('boom'));
      await expect(
        notifyRequestWithdrawn({ workflowId: 8, committeeId: 42, submitterName: 'Frank' })
      ).resolves.toBeUndefined();
    });
  });
});
