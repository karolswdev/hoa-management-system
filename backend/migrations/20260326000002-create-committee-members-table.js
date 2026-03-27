'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('committee_members', {
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
        onDelete: 'CASCADE',
        comment: 'Committee this membership belongs to'
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
        comment: 'User appointed to the committee'
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'member',
        comment: 'member or chair'
      },
      appointed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the user was appointed'
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

    // Prevent duplicate membership
    await queryInterface.addIndex('committee_members', ['committee_id', 'user_id'], {
      unique: true,
      name: 'idx_committee_members_unique'
    });

    // Fast lookup by user
    await queryInterface.addIndex('committee_members', ['user_id'], {
      name: 'idx_committee_members_user'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('committee_members');
  }
};
