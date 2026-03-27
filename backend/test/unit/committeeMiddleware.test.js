/**
 * Unit tests for committee.middleware.js
 *
 * Tests both authorizeCommitteeMember and authorizeSubmitterOrCommitteeMember
 * middleware factories, covering edge-case branches that integration tests miss.
 */

const mockFindByPk = jest.fn();
const mockFindOne = jest.fn();

jest.mock('../../models', () => ({
  CommitteeMember: { findOne: mockFindOne },
  WorkflowInstance: { findByPk: mockFindByPk },
}));

const {
  authorizeCommitteeMember,
  authorizeSubmitterOrCommitteeMember,
} = require('../../src/middlewares/committee.middleware');

// ---- helpers ----
function mockReqResNext(overrides = {}) {
  const req = {
    user: { id: 1, role: 'member' },
    params: {},
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ================================================================
// authorizeCommitteeMember
// ================================================================
describe('authorizeCommitteeMember', () => {
  describe('authentication checks', () => {
    it('should return 401 when req.user is missing', async () => {
      const middleware = authorizeCommitteeMember();
      const { req, res, next } = mockReqResNext({ user: null });

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Authentication') }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user.id is missing', async () => {
      const middleware = authorizeCommitteeMember();
      const { req, res, next } = mockReqResNext({ user: {} });

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('fromParam mode (committee ID from route param)', () => {
    it('should use committee_id directly from req.params when fromParam is set', async () => {
      const middleware = authorizeCommitteeMember({ fromParam: 'id' });
      const { req, res, next } = mockReqResNext({ params: { id: '42' } });
      mockFindOne.mockResolvedValue({ role: 'member' });

      await middleware(req, res, next);

      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { committee_id: 42, user_id: 1 } })
      );
      expect(next).toHaveBeenCalled();
      expect(req.committeeMembership).toEqual({ committeeId: 42, role: 'member', userId: 1 });
    });

    it('should return 400 for invalid (NaN) committee ID from param', async () => {
      const middleware = authorizeCommitteeMember({ fromParam: 'id' });
      const { req, res, next } = mockReqResNext({ params: { id: 'abc' } });

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid committee') }));
    });
  });

  describe('workflow lookup mode (default, no fromParam)', () => {
    it('should look up committee from workflow instance', async () => {
      const middleware = authorizeCommitteeMember();
      const { req, res, next } = mockReqResNext({ params: { id: '10' } });
      mockFindByPk.mockResolvedValue({ id: 10, committee_id: 42 });
      mockFindOne.mockResolvedValue({ role: 'chair' });

      await middleware(req, res, next);

      expect(mockFindByPk).toHaveBeenCalledWith(10, expect.any(Object));
      expect(req.workflowCommitteeId).toBe(42);
      expect(req.committeeMembership.committeeId).toBe(42);
      expect(req.committeeMembership.role).toBe('chair');
      expect(next).toHaveBeenCalled();
    });

    it('should return 404 when workflow not found', async () => {
      const middleware = authorizeCommitteeMember();
      const { req, res, next } = mockReqResNext({ params: { id: '999' } });
      mockFindByPk.mockResolvedValue(null);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Workflow not found') }));
    });

    it('should return 403 when user is not a committee member', async () => {
      const middleware = authorizeCommitteeMember();
      const { req, res, next } = mockReqResNext({ params: { id: '10' } });
      mockFindByPk.mockResolvedValue({ id: 10, committee_id: 42 });
      mockFindOne.mockResolvedValue(null);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('not a member') }));
    });
  });

  describe('error handling', () => {
    it('should return 500 when an unexpected error occurs', async () => {
      const middleware = authorizeCommitteeMember();
      const { req, res, next } = mockReqResNext({ params: { id: '10' } });
      mockFindByPk.mockRejectedValue(new Error('DB connection lost'));

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Authorization check failed') }));
    });
  });
});

// ================================================================
// authorizeSubmitterOrCommitteeMember
// ================================================================
describe('authorizeSubmitterOrCommitteeMember', () => {
  describe('authentication checks', () => {
    it('should return 401 when req.user is missing', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({ user: null });

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('workflow lookup', () => {
    it('should return 404 when workflow not found', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({ params: { id: '999' } });
      mockFindByPk.mockResolvedValue(null);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('authorization logic', () => {
    it('should grant access to the submitter', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({
        user: { id: 5, role: 'member' },
        params: { id: '10' },
      });
      mockFindByPk.mockResolvedValue({ id: 10, committee_id: 42, submitted_by: 5, status: 'submitted' });
      mockFindOne.mockResolvedValue(null); // not a committee member

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.workflowAuth.isSubmitter).toBe(true);
      expect(req.workflowAuth.isCommitteeMember).toBe(false);
    });

    it('should grant access to a committee member who is not the submitter', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({
        user: { id: 1, role: 'member' },
        params: { id: '10' },
      });
      mockFindByPk.mockResolvedValue({ id: 10, committee_id: 42, submitted_by: 5, status: 'submitted' });
      mockFindOne.mockResolvedValue({ role: 'member' });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.workflowAuth.isSubmitter).toBe(false);
      expect(req.workflowAuth.isCommitteeMember).toBe(true);
      expect(req.workflowAuth.committeeMemberRole).toBe('member');
    });

    it('should grant access to an admin who is neither submitter nor member', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({
        user: { id: 99, role: 'admin' },
        params: { id: '10' },
      });
      mockFindByPk.mockResolvedValue({ id: 10, committee_id: 42, submitted_by: 5, status: 'submitted' });
      mockFindOne.mockResolvedValue(null);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.workflowAuth.isAdmin).toBe(true);
      expect(req.workflowAuth.isSubmitter).toBe(false);
      expect(req.workflowAuth.isCommitteeMember).toBe(false);
      expect(req.workflowAuth.committeeMemberRole).toBeNull();
    });

    it('should return 403 when user is neither submitter, member, nor admin', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({
        user: { id: 99, role: 'member' },
        params: { id: '10' },
      });
      mockFindByPk.mockResolvedValue({ id: 10, committee_id: 42, submitted_by: 5, status: 'submitted' });
      mockFindOne.mockResolvedValue(null);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Access denied.' }));
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected errors', async () => {
      const middleware = authorizeSubmitterOrCommitteeMember();
      const { req, res, next } = mockReqResNext({ params: { id: '10' } });
      mockFindByPk.mockRejectedValue(new Error('DB crashed'));

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Authorization check failed') }));
    });
  });
});
