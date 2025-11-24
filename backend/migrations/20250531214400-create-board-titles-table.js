'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('board_titles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Determines display order; lower numbers appear first'
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

    // Add index on rank for efficient sorting
    await queryInterface.addIndex('board_titles', ['rank'], {
      name: 'idx_board_titles_rank'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('board_titles');
  }
};
