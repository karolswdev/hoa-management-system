'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('calendar_entry_exceptions', 'override_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('calendar_entry_exceptions', 'override_date');
  }
};
