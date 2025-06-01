'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123'; // Fallback for local dev if not set

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn('ADMIN_EMAIL or ADMIN_PASSWORD environment variables not set. Using default credentials for seeder.');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await queryInterface.rawSelect('users', {
      where: { email: adminEmail },
    }, ['id']);

    if (!existingAdmin) {
      await queryInterface.bulkInsert('users', [{
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        email_verified: true, // Admin email is considered verified
        is_system_user: true,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    } else {
      console.log(`Admin user with email ${adminEmail} already exists. Skipping admin user seed.`);
    }
  },

  async down (queryInterface, Sequelize) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await queryInterface.bulkDelete('users', { email: adminEmail }, {});
  }
};
