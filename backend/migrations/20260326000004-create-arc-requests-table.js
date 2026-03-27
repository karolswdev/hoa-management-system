'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('arc_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      submitter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who submitted this ARC request'
      },
      property_address: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Free-text property address for the modification'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'arc_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'ARC category for this request'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Detailed description of the proposed modification'
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

    // Index for user's requests
    await queryInterface.addIndex('arc_requests', ['submitter_id'], {
      name: 'idx_arc_requests_submitter'
    });

    // Index for category filtering
    await queryInterface.addIndex('arc_requests', ['category_id'], {
      name: 'idx_arc_requests_category'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('arc_requests');
  }
};
