const { CommitteeMember, WorkflowInstance } = require('../../models');

/**
 * Middleware factory to authorize committee members.
 * Checks that the authenticated user has an explicit committee_members record.
 * NO admin bypass — admins must be explicitly appointed to a committee.
 *
 * Usage:
 *   - authorizeCommitteeMember() — gets committee_id from workflow lookup (req.params.id = workflow ID)
 *   - authorizeCommitteeMember({ fromParam: 'id' }) — gets committee_id directly from req.params.id
 */
function authorizeCommitteeMember({ fromParam = null } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      let committeeId;

      if (fromParam) {
        // Committee ID comes directly from route param
        committeeId = parseInt(req.params[fromParam], 10);
      } else {
        // Look up committee from workflow instance
        const workflowId = parseInt(req.params.id, 10);
        const workflow = await WorkflowInstance.findByPk(workflowId, {
          attributes: ['id', 'committee_id']
        });

        if (!workflow) {
          return res.status(404).json({ error: 'Workflow not found.' });
        }

        committeeId = workflow.committee_id;

        // Attach workflow info for downstream use
        req.workflowCommitteeId = committeeId;
      }

      if (!committeeId || isNaN(committeeId)) {
        return res.status(400).json({ error: 'Invalid committee reference.' });
      }

      // Check explicit committee membership — no admin bypass
      const membership = await CommitteeMember.findOne({
        where: {
          committee_id: committeeId,
          user_id: req.user.id
        }
      });

      if (!membership) {
        return res.status(403).json({
          error: 'You are not a member of this committee. Contact an admin to be appointed.'
        });
      }

      // Attach membership info for downstream use
      req.committeeMembership = {
        committeeId,
        role: membership.role,
        userId: req.user.id
      };

      next();
    } catch (error) {
      console.error('Committee authorization error:', error);
      return res.status(500).json({ error: 'Authorization check failed.' });
    }
  };
}

/**
 * Middleware that checks if a user is either the submitter OR a committee member.
 * Used for endpoints where both roles have access (e.g., viewing, commenting).
 */
function authorizeSubmitterOrCommitteeMember() {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const workflowId = parseInt(req.params.id, 10);
      const workflow = await WorkflowInstance.findByPk(workflowId, {
        attributes: ['id', 'committee_id', 'submitted_by', 'status']
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found.' });
      }

      const isSubmitter = workflow.submitted_by === req.user.id;

      // Check committee membership
      const membership = await CommitteeMember.findOne({
        where: {
          committee_id: workflow.committee_id,
          user_id: req.user.id
        }
      });
      const isMember = !!membership;

      // Admin can view all (read-only), but check is done here for access
      const isAdmin = req.user.role === 'admin';

      if (!isSubmitter && !isMember && !isAdmin) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      req.workflowAuth = {
        isSubmitter,
        isCommitteeMember: isMember,
        isAdmin,
        committeeId: workflow.committee_id,
        committeeMemberRole: membership?.role || null
      };

      next();
    } catch (error) {
      console.error('Workflow authorization error:', error);
      return res.status(500).json({ error: 'Authorization check failed.' });
    }
  };
}

module.exports = {
  authorizeCommitteeMember,
  authorizeSubmitterOrCommitteeMember
};
