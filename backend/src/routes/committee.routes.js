const express = require('express');
const committeeController = require('../controllers/committee.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const isAdmin = authorizeRoles('admin');
const isMember = authorizeRoles('member', 'admin');

// Member routes - view committees
router.get('/', verifyToken, isMember, committeeController.listCommitteesController);
router.get('/:id', verifyToken, isMember, committeeController.getCommitteeController);

// Admin routes - manage committees
router.post('/', verifyToken, isAdmin, committeeController.createCommitteeController);
router.put('/:id', verifyToken, isAdmin, committeeController.updateCommitteeController);
router.delete('/:id', verifyToken, isAdmin, committeeController.deactivateCommitteeController);

// Admin routes - manage committee membership
router.post('/:id/members', verifyToken, isAdmin, committeeController.addMemberController);
router.delete('/:id/members/:userId', verifyToken, isAdmin, committeeController.removeMemberController);

module.exports = router;
