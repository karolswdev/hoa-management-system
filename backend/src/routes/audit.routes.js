'use strict';

const express = require('express');
const auditController = require('../controllers/audit.controller');
const validate = require('../middlewares/validate.middleware');
const { getAuditLogsSchema } = require('../validators/audit.validator');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const isAdmin = authorizeRoles('admin');

const router = express.Router();

router.get(
  '/',
  verifyToken,
  isAdmin,
  validate(getAuditLogsSchema),
  auditController.getAuditLogsController
);

module.exports = router;