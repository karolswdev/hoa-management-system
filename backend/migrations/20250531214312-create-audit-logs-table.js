'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // As admin user might be deleted
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT // Can store JSON string or plain text
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
      // No updated_at for audit logs
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};
