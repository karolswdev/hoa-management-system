const express = require('express');
const arcRequestController = require('../controllers/arcRequest.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const isMember = authorizeRoles('member', 'admin');

// List ARC requests (filtered by role)
router.get('/', verifyToken, isMember, arcRequestController.listArcRequestsController);

// Get ARC request detail
router.get('/:id', verifyToken, isMember, arcRequestController.getArcRequestController);

// Create ARC request
router.post('/', verifyToken, isMember, arcRequestController.createArcRequestController);

// Update ARC request (draft only, submitter only)
router.put('/:id', verifyToken, isMember, arcRequestController.updateArcRequestController);

module.exports = router;
