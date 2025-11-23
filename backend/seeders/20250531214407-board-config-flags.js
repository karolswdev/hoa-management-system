'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const configs = [
      {
        key: 'board.visibility',
        value: 'public',
        description: 'Controls whether current board roster is visible to guests (public) or members only (members_only)'
      },
      {
        key: 'board.history-visibility',
        value: 'members_only',
        description: 'Controls access to historical board member records - always members_only per security requirements'
      }
    ];

    for (const config of configs) {
      const existingConfig = await queryInterface.rawSelect('config', {
        where: { key: config.key },
      }, ['key']);

      if (!existingConfig) {
        // Only insert key and value - description is for documentation purposes
        await queryInterface.bulkInsert('config', [
          { key: config.key, value: config.value }
        ], {});
      } else {
        console.log(`Config key ${config.key} already exists. Skipping board config seed for this key.`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const configKeys = ['board.visibility', 'board.history-visibility'];
    await queryInterface.bulkDelete('config', {
      key: { [Sequelize.Op.in]: configKeys }
    }, {});
  }
};
