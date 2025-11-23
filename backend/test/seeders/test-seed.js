'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if test admin already exists
    const existingAdmin = await queryInterface.rawSelect('users', {
      where: { email: 'testadmin@example.com' },
    }, ['id']);

    if (!existingAdmin) {
      // Test admin user
      await queryInterface.bulkInsert('users', [{
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password: await bcrypt.hash('testadmin123', 10),
        role: 'admin',
        status: 'approved',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    }

    // Check if test member users already exist
    const existingMember = await queryInterface.rawSelect('users', {
      where: { email: 'testmember@example.com' },
    }, ['id']);

    if (!existingMember) {
      // Test member users with different statuses
      await queryInterface.bulkInsert('users', [
        {
          name: 'Test Member',
          email: 'testmember@example.com',
          password: await bcrypt.hash('testmember123', 10),
          role: 'member',
          status: 'approved',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Active Member',
          email: 'active@example.com',
          password: await bcrypt.hash('member123', 10),
          role: 'member',
          status: 'approved',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Pending Member',
          email: 'pending@example.com',
          password: await bcrypt.hash('member123', 10),
          role: 'member',
          status: 'pending',
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Rejected Member',
          email: 'rejected@example.com',
          password: await bcrypt.hash('member123', 10),
          role: 'member',
          status: 'rejected',
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});
    }

    // Check if config already exists
    const existingConfig = await queryInterface.rawSelect('config', {
      where: { key: 'hoa_name' },
    }, ['key']);

    if (!existingConfig) {
      // Basic site configuration
      await queryInterface.bulkInsert('config', [
        {
          key: 'hoa_name',
          value: 'Test HOA'
        },
        {
          key: 'hoa_description',
          value: 'Test HOA Description'
        }
        // You could add hoa_logo here too if needed for other tests
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: [
        'testadmin@example.com',
        'testmember@example.com',
        'active@example.com',
        'pending@example.com',
        'rejected@example.com'
      ]
    }, {});

    await queryInterface.bulkDelete('config', {
      key: ['hoa_name', 'hoa_description']
    }, {});
  }
};
