'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('config', {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      value: {
        type: Sequelize.TEXT
      }
      // No timestamps for config table
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('config');
  }
};
