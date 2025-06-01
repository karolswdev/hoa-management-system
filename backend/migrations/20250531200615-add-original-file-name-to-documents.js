'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'original_file_name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'original_file_name');
  }
};