'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_transitions', {
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
        comment: 'Workflow instance this transition belongs to'
      },
      from_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'Status before transition'
      },
      to_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'Status after transition'
      },
      performed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who performed this transition'
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional reason or note for the transition'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Immutable timestamp of transition'
      }
    });

    // Timeline for a workflow
    await queryInterface.addIndex('workflow_transitions', ['workflow_id', 'created_at'], {
      name: 'idx_workflow_transitions_timeline'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflow_transitions');
  }
};
