'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_attachments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      workflow_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'workflow_instances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Workflow instance this attachment belongs to'
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who uploaded this file'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Stored unique filename on disk'
      },
      original_file_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Original filename from user upload'
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Server filesystem path to the file'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME type of the uploaded file'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'File size in bytes'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Attachments for a workflow
    await queryInterface.addIndex('workflow_attachments', ['workflow_id'], {
      name: 'idx_workflow_attachments_workflow'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflow_attachments');
  }
};
