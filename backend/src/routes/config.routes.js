const express = require('express');
const configController = require('../controllers/config.controller');
const validate = require('../middlewares/validate.middleware');
const { updateConfigSchema } = require('../validators/config.validator');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware'); // Assuming auth middlewares
const isAdmin = authorizeRoles('admin');

const router = express.Router();

// GET /api/admin/config - Get all configurations
router.get(
  '/',
  verifyToken,
  isAdmin,
  configController.getAllConfigsController
);

// PUT /api/admin/config/:key - Upsert a configuration key-value
router.put(
  '/:key',
  verifyToken,
  isAdmin,
  validate(updateConfigSchema),
  configController.updateConfigController
);

module.exports = router;