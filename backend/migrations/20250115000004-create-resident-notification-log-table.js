'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resident_notification_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Resident who received the notification'
      },
      email_audit_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'email_audit',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Link to email_audit batch record (if sent via email)'
      },
      notification_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of notification: poll_created, poll_reminder, vote_receipt, etc.'
      },
      channel: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Delivery channel: email, in_app, sms (future)'
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Related entity type: poll, vote, announcement, etc.'
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (e.g., poll_id, vote_id)'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When notification was sent to this specific user'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Delivery status: sent, failed, bounced, opened (if tracked)'
      },
      metadata_json: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional JSON metadata (error details, delivery confirmation, etc.)'
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

    // Index for retrieving notification history for a specific user
    await queryInterface.addIndex('resident_notification_log', ['user_id', 'sent_at'], {
      name: 'idx_notification_log_user_sent'
    });

    // Index for filtering by notification type
    await queryInterface.addIndex('resident_notification_log', ['notification_type'], {
      name: 'idx_notification_log_type'
    });

    // Composite index for finding notifications related to specific entities
    await queryInterface.addIndex('resident_notification_log', ['entity_type', 'entity_id'], {
      name: 'idx_notification_log_entity'
    });

    // Index for email audit batch lookups
    await queryInterface.addIndex('resident_notification_log', ['email_audit_id'], {
      name: 'idx_notification_log_email_audit'
    });

    // Index for delivery status reporting
    await queryInterface.addIndex('resident_notification_log', ['status'], {
      name: 'idx_notification_log_status'
    });

    // Index for channel-based queries
    await queryInterface.addIndex('resident_notification_log', ['channel'], {
      name: 'idx_notification_log_channel'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('resident_notification_log');
  }
};
