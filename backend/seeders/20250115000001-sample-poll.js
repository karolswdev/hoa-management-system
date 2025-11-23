'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const startAt = new Date();
    const endAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Check if sample poll already exists
    const existingPoll = await queryInterface.rawSelect('polls', {
      where: { title: 'HOA Community Survey - Pool Hours' },
    }, ['id']);

    if (existingPoll) {
      console.log('Sample poll "HOA Community Survey - Pool Hours" already exists. Skipping poll seed.');
      return;
    }

    // Get the first admin user to be the poll creator
    const adminUser = await queryInterface.rawSelect('users', {
      where: { role: 'admin' },
    }, ['id']);

    if (!adminUser) {
      console.log('No admin user found. Cannot seed sample poll. Please create an admin user first.');
      return;
    }

    // Insert sample poll
    await queryInterface.bulkInsert('polls', [
      {
        title: 'HOA Community Survey - Pool Hours',
        description: 'Help us decide the community pool operating hours for the summer season. This is an informal poll to gauge resident preferences.',
        type: 'informal',
        is_anonymous: false,
        notify_members: false,
        start_at: startAt,
        end_at: endAt,
        created_by: adminUser,
        created_at: now,
        updated_at: now
      }
    ], {});

    // Retrieve the newly created poll ID
    const pollId = await queryInterface.rawSelect('polls', {
      where: { title: 'HOA Community Survey - Pool Hours' },
    }, ['id']);

    if (!pollId) {
      console.log('Failed to retrieve sample poll ID. Skipping poll options seed.');
      return;
    }

    // Insert poll options
    await queryInterface.bulkInsert('poll_options', [
      {
        poll_id: pollId,
        text: '9 AM - 6 PM (Standard Hours)',
        order_index: 1,
        created_at: now,
        updated_at: now
      },
      {
        poll_id: pollId,
        text: '8 AM - 8 PM (Extended Hours)',
        order_index: 2,
        created_at: now,
        updated_at: now
      },
      {
        poll_id: pollId,
        text: '10 AM - 7 PM (Weekend Only Extended)',
        order_index: 3,
        created_at: now,
        updated_at: now
      },
      {
        poll_id: pollId,
        text: 'Keep Current Schedule',
        order_index: 4,
        created_at: now,
        updated_at: now
      }
    ], {});

    console.log(`Sample poll created with ID ${pollId} and 4 options.`);
  },

  async down (queryInterface, Sequelize) {
    // Delete poll options first (due to FK constraints)
    const pollId = await queryInterface.rawSelect('polls', {
      where: { title: 'HOA Community Survey - Pool Hours' },
    }, ['id']);

    if (pollId) {
      await queryInterface.bulkDelete('poll_options', {
        poll_id: pollId
      }, {});

      // Then delete the poll
      await queryInterface.bulkDelete('polls', {
        title: 'HOA Community Survey - Pool Hours'
      }, {});
    }
  }
};
