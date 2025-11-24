'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_audit', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      template: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Email template identifier (e.g., "poll_notification", "vote_receipt")'
      },
      recipient_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Number of recipients for this batch send'
      },
      request_payload_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'SHA-256 hash of request payload for audit trail integrity'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when email batch was sent'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Send status: success, failed, partial'
      },
      metadata_json: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional JSON metadata (error details, SendGrid response, etc.)'
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

    // Index for filtering email audits by template type
    await queryInterface.addIndex('email_audit', ['template'], {
      name: 'idx_email_audit_template'
    });

    // Index for time-based queries (recent sends, reporting)
    await queryInterface.addIndex('email_audit', ['sent_at'], {
      name: 'idx_email_audit_sent_at'
    });

    // Index for filtering by status (finding failures)
    await queryInterface.addIndex('email_audit', ['status'], {
      name: 'idx_email_audit_status'
    });

    // Composite index for template-specific reporting over time
    await queryInterface.addIndex('email_audit', ['template', 'sent_at'], {
      name: 'idx_email_audit_template_sent'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_audit');
  }
};
