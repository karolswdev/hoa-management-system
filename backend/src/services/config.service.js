const { Config } = require('../../models'); // Assuming index.js in models exports Config
const auditService = require('./audit.service');
// const ApiError = require('../utils/ApiError'); // Not strictly needed for this service based on current plan

const getAllConfigs = async () => {
  const configs = await Config.findAll();
  const configObject = {};
  configs.forEach(item => {
    configObject[item.key] = item.value;
  });
  return configObject;
};

const upsertConfig = async (key, value, adminUserId) => {
  const [configItem, created] = await Config.upsert({ key, value });
  // In Sequelize, 'upsert' might not return the instance directly in all dialects or versions.
  // It often returns [instance, created] or just a boolean indicating creation.
  // For simplicity and consistency, we'll return the input key/value.
  // If the actual instance data (like timestamps) is needed, a findOrCreate or separate find would be better.

  try {
    await auditService.logAdminAction(adminUserId, 'config_update', { configKey: key, newValue: value });
  } catch (auditError) {
    console.error('Failed to log admin action for config_update:', auditError);
  }
  
  // Return the data that was upserted, as the direct return from upsert can vary.
  return { key, value };
};

module.exports = {
  getAllConfigs,
  upsertConfig,
};