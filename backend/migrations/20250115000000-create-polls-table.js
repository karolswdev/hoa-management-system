'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('polls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Poll title/question displayed to voters'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional detailed description or context for the poll'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Poll type: informal, binding, or straw-poll'
      },
      is_anonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'If true, votes are not linked to user_id (anonymous voting)'
      },
      notify_members: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'If true, send email notifications to eligible voters'
      },
      start_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Poll open timestamp'
      },
      end_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Poll close timestamp'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who created the poll (admin/board member)'
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

    // Index for filtering active/upcoming polls by time range
    await queryInterface.addIndex('polls', ['start_at', 'end_at'], {
      name: 'idx_polls_time_range'
    });

    // Index for finding polls by creator
    await queryInterface.addIndex('polls', ['created_by'], {
      name: 'idx_polls_created_by'
    });

    // Index for filtering by poll type
    await queryInterface.addIndex('polls', ['type'], {
      name: 'idx_polls_type'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('polls');
  }
};
