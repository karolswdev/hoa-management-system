'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const configs = [
      {
        key: 'polls.binding-enabled',
        value: 'true',
        description: 'Enable binding (official) polls that require user authentication'
      },
      {
        key: 'polls.anonymous-enabled',
        value: 'true',
        description: 'Enable anonymous voting for informal polls'
      },
      {
        key: 'polls.notify-members-enabled',
        value: 'true',
        description: 'Enable email notifications when new polls are created'
      },
      {
        key: 'polls.default-duration-days',
        value: '7',
        description: 'Default poll duration in days when creating new polls'
      },
      {
        key: 'polls.receipt-generation-enabled',
        value: 'true',
        description: 'Generate cryptographic receipts for vote verification'
      },
      {
        key: 'polls.hash-chain-enabled',
        value: 'true',
        description: 'Enable vote hash chain for tamper-proof vote recording'
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
        console.log(`Config key ${config.key} already exists. Skipping poll config seed for this key.`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const configKeys = [
      'polls.binding-enabled',
      'polls.anonymous-enabled',
      'polls.notify-members-enabled',
      'polls.default-duration-days',
      'polls.receipt-generation-enabled',
      'polls.hash-chain-enabled'
    ];

    await queryInterface.bulkDelete('config', {
      key: { [Sequelize.Op.in]: configKeys }
    }, {});
  }
};
