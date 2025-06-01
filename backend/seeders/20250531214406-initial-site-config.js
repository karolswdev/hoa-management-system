'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const configs = [
      { key: 'hoa_name', value: process.env.DEFAULT_HOA_NAME || 'Sanderson Creek HOA' },
      { key: 'hoa_description', value: process.env.DEFAULT_HOA_DESCRIPTION || 'Sanderson Creek HOA Community Management System' },
      { key: 'hoa_logo', value: process.env.DEFAULT_HOA_LOGO || '/images/logo.png' }
    ];

    for (const config of configs) {
      const existingConfig = await queryInterface.rawSelect('config', {
        where: { key: config.key },
      }, ['key']);

      if (!existingConfig) {
        await queryInterface.bulkInsert('config', [config], {});
      } else {
        // Optionally update if it exists, or just skip
        console.log(`Config key ${config.key} already exists. Skipping config seed for this key.`);
        // await queryInterface.bulkUpdate('config', { value: config.value }, { key: config.key });
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const configKeys = ['hoa_name', 'hoa_description', 'hoa_logo'];
    await queryInterface.bulkDelete('config', { key: { [Sequelize.Op.in]: configKeys } }, {});
  }
};
