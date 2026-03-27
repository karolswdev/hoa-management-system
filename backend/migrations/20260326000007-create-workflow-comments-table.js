'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_comments', {
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
        comment: 'Workflow instance this comment belongs to'
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
        comment: 'User who posted this comment'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Comment text (sanitized)'
      },
      is_internal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Internal comments are visible only to committee members'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Comments for a workflow
    await queryInterface.addIndex('workflow_comments', ['workflow_id', 'created_at'], {
      name: 'idx_workflow_comments_timeline'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflow_comments');
  }
};
