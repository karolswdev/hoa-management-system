const configService = require('../services/config.service');
const ApiError = require('../utils/ApiError'); // Assuming ApiError utility for error handling

const getAllConfigsController = async (req, res, next) => {
  try {
    const configs = await configService.getAllConfigs();
    res.status(200).json(configs);
  } catch (error) {
    // Assuming a centralized error handler or ApiError can be caught by it
    next(error instanceof ApiError ? error : new ApiError(500, 'Failed to retrieve configurations'));
  }
};

const updateConfigController = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const adminUserId = req.user.id; // Assuming verifyToken and isAdmin middlewares populate req.user

    if (!adminUserId) {
        // This check is more for robustness, as isAdmin should ensure req.user.id exists
        return next(new ApiError(403, 'User ID not found, authorization issue.'));
    }

    const updatedConfig = await configService.upsertConfig(key, value, adminUserId);
    res.status(200).json(updatedConfig);
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, `Failed to update configuration for key: ${req.params.key}`));
  }
};

module.exports = {
  getAllConfigsController,
  updateConfigController,
};