'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      requestor_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      captcha_token: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Stored for audit purposes'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending, sent, failed'
      },
      submitted_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add index on status for admin queries
    await queryInterface.addIndex('contact_requests', ['status'], {
      name: 'idx_contact_requests_status'
    });

    // Add index on submitted_at for chronological listing
    await queryInterface.addIndex('contact_requests', ['submitted_at'], {
      name: 'idx_contact_requests_submitted_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contact_requests');
  }
};
