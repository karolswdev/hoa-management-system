'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('votes', {
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
        comment: 'Poll this vote belongs to'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who cast the vote; NULL for anonymous polls'
      },
      option_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'poll_options',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Selected poll option'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the vote was cast'
      },
      prev_hash: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Hash of the previous vote in the chain (NULL for first vote)'
      },
      vote_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Cryptographic hash of this vote (poll_id + option_id + timestamp + prev_hash)'
      },
      receipt_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique receipt code provided to voter for verification'
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

    // Composite index for retrieving votes for a poll ordered by timestamp (hash chain order)
    await queryInterface.addIndex('votes', ['poll_id', 'timestamp'], {
      name: 'idx_votes_poll_timestamp'
    });

    // Index on vote_hash for hash chain verification and integrity checks
    await queryInterface.addIndex('votes', ['vote_hash'], {
      name: 'idx_votes_vote_hash'
    });

    // Index on receipt_code for voter receipt verification lookups
    await queryInterface.addIndex('votes', ['receipt_code'], {
      name: 'idx_votes_receipt_code'
    });

    // Index for user's voting history (when not anonymous)
    await queryInterface.addIndex('votes', ['user_id', 'poll_id'], {
      name: 'idx_votes_user_poll'
    });

    // Index for counting votes per option
    await queryInterface.addIndex('votes', ['option_id'], {
      name: 'idx_votes_option'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('votes');
  }
};
