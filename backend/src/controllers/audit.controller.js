'use strict';

const auditService = require('../services/audit.service');

async function getAuditLogsController(req, res, next) {
  try {
    // FIX: Provide default values for page and limit using '||'
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const result = await auditService.getAuditLogs({ page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogsController,
};