const express = require('express');
const workflowController = require('../controllers/workflow.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { authorizeSubmitterOrCommitteeMember } = require('../middlewares/committee.middleware');
const workflowUpload = require('../middlewares/workflowUpload.middleware');

const router = express.Router();
const isMember = authorizeRoles('member', 'admin');

// List workflows (filtered by role)
router.get('/', verifyToken, isMember, workflowController.listWorkflowsController);

// Get workflow detail (submitter, committee member, or admin)
router.get('/:id', verifyToken, isMember, authorizeSubmitterOrCommitteeMember(), workflowController.getWorkflowController);

// Perform status transition (authorization checked in service layer based on transition type)
router.post('/:id/transitions', verifyToken, isMember, workflowController.performTransitionController);

// Add comment (submitter or committee member)
router.post('/:id/comments', verifyToken, isMember, authorizeSubmitterOrCommitteeMember(), workflowController.addCommentController);

// Upload attachment(s) (submitter or committee member)
router.post('/:id/attachments', verifyToken, isMember, authorizeSubmitterOrCommitteeMember(), workflowUpload.array('files', 5), workflowController.addAttachmentController);

// Download attachment (submitter, committee member, or admin)
router.get('/:id/attachments/:attachmentId/download', verifyToken, isMember, authorizeSubmitterOrCommitteeMember(), workflowController.downloadAttachmentController);

module.exports = router;
