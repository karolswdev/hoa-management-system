'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Vendor business name'
      },
      service_category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Category of service provided (e.g., Landscaping, Security, Pool Maintenance)'
      },
      contact_info: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Consolidated contact information including phone, email, address'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Internal rating (1-5 scale), managed by admins'
      },
      notes: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        comment: 'Internal notes about vendor, service quality, or history'
      },
      visibility_scope: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'members',
        comment: 'Visibility level: public (guests), members (authenticated), admins (privileged only)'
      },
      moderation_state: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Moderation status: pending (under review), approved (published), denied (rejected)'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who created this vendor entry; NULL if created by system or user deleted'
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

    // Composite index for filtering vendors by visibility and category
    await queryInterface.addIndex('vendors', ['visibility_scope', 'service_category'], {
      name: 'idx_vendors_visibility_category'
    });

    // Index for moderation queue queries
    await queryInterface.addIndex('vendors', ['moderation_state'], {
      name: 'idx_vendors_moderation_state'
    });

    // Index for tracking vendor submissions by user
    await queryInterface.addIndex('vendors', ['created_by'], {
      name: 'idx_vendors_created_by'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vendors');
  }
};
