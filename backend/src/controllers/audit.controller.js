'use strict';

const auditService = require('../services/audit.service');

async function getAuditLogsController(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await auditService.getAuditLogs({ page: parseInt(page, 10), limit: parseInt(limit, 10) });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogsController,
};