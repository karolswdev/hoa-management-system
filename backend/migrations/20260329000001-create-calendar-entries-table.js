'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendar_entries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true
      },
      all_day: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      start_time: {
        type: Sequelize.STRING(5),
        allowNull: true
      },
      end_time: {
        type: Sequelize.STRING(5),
        allowNull: true
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      frequency: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      week_of_month: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      month_of_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      day_of_month: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      recurrence_end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      seasonal_start: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      seasonal_end: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('calendar_entries');
  }
};
