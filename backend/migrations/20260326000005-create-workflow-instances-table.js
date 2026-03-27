'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_instances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      committee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'committees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Committee assigned to review this request'
      },
      request_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Polymorphic discriminator (e.g., arc_request)'
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'FK to the domain-specific request table'
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Current workflow status'
      },
      submitted_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who created this workflow request'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional expiration date for approved requests'
      },
      appeal_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of appeals filed (max 1)'
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

    // Polymorphic lookup
    await queryInterface.addIndex('workflow_instances', ['request_type', 'request_id'], {
      name: 'idx_workflow_instances_request'
    });

    // Committee queue
    await queryInterface.addIndex('workflow_instances', ['committee_id', 'status'], {
      name: 'idx_workflow_instances_committee_status'
    });

    // User's requests
    await queryInterface.addIndex('workflow_instances', ['submitted_by'], {
      name: 'idx_workflow_instances_submitter'
    });

    // Expiration check
    await queryInterface.addIndex('workflow_instances', ['status', 'expires_at'], {
      name: 'idx_workflow_instances_expiration'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflow_instances');
  }
};
