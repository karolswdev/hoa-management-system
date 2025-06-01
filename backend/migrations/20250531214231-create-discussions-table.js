'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discussions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true // Nullable for replies
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Table name should be 'Users' if model name is User
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Or 'CASCADE' if discussions should be deleted with user
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Null for main threads
        references: {
          model: 'discussions', // Self-reference
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If parent thread is deleted, replies are also deleted
      },
      document_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Null if not linked to a document
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('discussions');
  }
};
