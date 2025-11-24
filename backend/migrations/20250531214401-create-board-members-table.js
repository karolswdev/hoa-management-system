'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('board_members', {
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
        onDelete: 'CASCADE'
      },
      title_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'board_titles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'RESTRICT prevents deletion of titles still in use'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date when member assumed this position'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Null indicates current active position'
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional biography or message from board member'
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

    // Composite index for sorting current members by title rank
    await queryInterface.addIndex('board_members', ['title_id', 'start_date'], {
      name: 'idx_board_members_title_start'
    });

    // Composite index for finding user's position history
    await queryInterface.addIndex('board_members', ['user_id', 'end_date'], {
      name: 'idx_board_members_user_end'
    });

    // Index for efficiently querying current board members (where end_date IS NULL)
    await queryInterface.addIndex('board_members', ['end_date'], {
      name: 'idx_board_members_end_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('board_members');
  }
};
