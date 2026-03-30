'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendar_entry_exceptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      calendar_entry_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'calendar_entries',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exception_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      is_cancelled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      override_title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      override_time: {
        type: Sequelize.STRING(5),
        allowNull: true
      },
      note: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('calendar_entry_exceptions');
  }
};
