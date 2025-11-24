'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('poll_options', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      poll_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'polls',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Poll this option belongs to'
      },
      text: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Option text displayed to voters (e.g., "Yes", "No", "Approve Budget")'
      },
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Display order for options (lower numbers appear first)'
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

    // Composite index for retrieving options for a poll in display order
    await queryInterface.addIndex('poll_options', ['poll_id', 'order_index'], {
      name: 'idx_poll_options_poll_order'
    });

    // Unique constraint to prevent duplicate order_index within same poll
    await queryInterface.addIndex('poll_options', ['poll_id', 'order_index'], {
      name: 'idx_poll_options_unique_order',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('poll_options');
  }
};
