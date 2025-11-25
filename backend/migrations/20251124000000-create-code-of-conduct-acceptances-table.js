'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('code_of_conduct_acceptances', {
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
        onDelete: 'CASCADE',
        comment: 'User who accepted the Code of Conduct'
      },
      version: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Version of the Code of Conduct accepted (e.g., "1", "2023-11-24", etc.)'
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the user accepted this version'
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

    // Composite unique index: each user can only have one acceptance record per version
    await queryInterface.addIndex('code_of_conduct_acceptances', ['user_id', 'version'], {
      name: 'idx_coc_user_version',
      unique: true
    });

    // Index for finding user's latest acceptance
    await queryInterface.addIndex('code_of_conduct_acceptances', ['user_id', 'accepted_at'], {
      name: 'idx_coc_user_accepted_at'
    });

    // Index for version lookups (e.g., finding all users who accepted a specific version)
    await queryInterface.addIndex('code_of_conduct_acceptances', ['version'], {
      name: 'idx_coc_version'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('code_of_conduct_acceptances');
  }
};
