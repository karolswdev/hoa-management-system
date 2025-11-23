const request = require('supertest');
const app = require('../../src/app');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../../models');

const TEST_DB_PATH = path.join(__dirname, '../../database/test.db');

const run = (command) => {
  try {
    execSync(command, {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error(`Failed to execute command: ${command}`, error);
    throw error;
  }
};

const ensureCleanDbFile = () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.rmSync(TEST_DB_PATH);
  }
};

const setupTestDB = async () => {
  console.log('--- Setting up test database ---');
  ensureCleanDbFile();
  // Run migrations to create the tables
  run('NODE_ENV=test npx sequelize-cli db:migrate');
  // Run seeders to populate the tables
  run('NODE_ENV=test npx sequelize-cli db:seed:all --seeders-path test/seeders');
  console.log('--- Test database setup complete ---');
};

const teardownTestDB = async () => {
  console.log('--- Tearing down test database ---');
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Failed to close sequelize connection cleanly:', error);
  }
  ensureCleanDbFile();
  console.log('--- Test database teardown complete ---');
};

const seedTestDB = () => {
  try {
    execSync('NODE_ENV=test npm run db:seed:test', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Failed to seed test database:', error);
    throw error;
  }
};

const cleanTestDB = () => {
  try {
    execSync('NODE_ENV=test npm run db:seed:undo:test:all', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Failed to clean test database:', error);
    throw error;
  }
};

const resetTestDB = async () => {
  try {
    await teardownTestDB();
    await setupTestDB();
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
};

/**
 * Creates a new user, approves them with an admin token, and returns the new user's token.
 * @param {object} userDetails - The user's details { name, email, password }.
 * @param {string} adminToken - A valid admin JWT for approving the user.
 * @returns {Promise<string>} The JWT for the newly created and approved user.
 */
const createAndApproveUser = async (userDetails, adminToken) => {
  // 1. Register the user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send(userDetails);
  
  let newUserId = registerRes.body?.user?.id;

  // If the user already exists (seeded), align credentials and continue
  if (registerRes.statusCode === 409) {
    const existingUser = await User.findOne({ where: { email: userDetails.email } });
    if (!existingUser) {
      console.error('Registration conflict but user not found in DB:', registerRes.body);
      throw new Error(`User registration failed for ${userDetails.email}`);
    }
    existingUser.password = await bcrypt.hash(userDetails.password, 10);
    existingUser.status = 'approved';
    existingUser.email_verified = true;
    await existingUser.save();
    newUserId = existingUser.id;
  } else if (registerRes.statusCode !== 201) {
    console.error('Failed to register user in helper:', registerRes.body);
    throw new Error(`User registration failed for ${userDetails.email}`);
  }

  // 2. Approve the user
  const approvalRes = await request(app)
    .put(`/api/admin/users/${newUserId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' });

  if (![200, 409].includes(approvalRes.statusCode)) {
    console.error('Failed to approve user in helper:', approvalRes.body);
    throw new Error(`User approval failed for ${userDetails.email}`);
  }

  await User.update({ email_verified: true }, { where: { id: newUserId } });

  // 3. Log the user in
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: userDetails.email,
      password: userDetails.password,
    });
  
  if (loginRes.statusCode !== 200) {
    console.error('Failed to log in new user in helper:', loginRes.body);
    throw new Error(`User login failed for ${userDetails.email}`);
  }

  // 4. Return the token
  return loginRes.body.token;
};

const createAndApproveUserForUserManagement = async (userDetails, adminToken) => {
  // 1. Register the user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send(userDetails);
  
  let newUserId = registerRes.body?.user?.id;

  if (registerRes.statusCode === 409) {
    const existingUser = await User.findOne({ where: { email: userDetails.email } });
    if (!existingUser) {
      console.error('Registration conflict but user not found in DB:', registerRes.body);
      throw new Error(`User registration failed for ${userDetails.email}`);
    }
    existingUser.password = await bcrypt.hash(userDetails.password, 10);
    existingUser.status = 'approved';
    existingUser.email_verified = true;
    await existingUser.save();
    newUserId = existingUser.id;
  } else if (registerRes.statusCode !== 201) {
    console.error('Failed to register user in helper:', registerRes.body);
    throw new Error(`User registration failed for ${userDetails.email}`);
  }

  // 2. Approve the user
  const approvalRes = await request(app)
    .put(`/api/admin/users/${newUserId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' });

  if (![200, 409].includes(approvalRes.statusCode)) {
    console.error('Failed to approve user in helper:', approvalRes.body);
    throw new Error(`User approval failed for ${userDetails.email}`);
  }

  await User.update({ email_verified: true }, { where: { id: newUserId } });

  // 3. Log the user in
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: userDetails.email,
      password: userDetails.password,
    });
  
  if (loginRes.statusCode !== 200) {
    console.error('Failed to log in new user in helper:', loginRes.body);
    throw new Error(`User login failed for ${userDetails.email}`);
  }

  // 4. Return both the token and the user object
  return { token: loginRes.body.token, user: loginRes.body.user };
};

module.exports = {
  seedTestDB,
  cleanTestDB, 
  resetTestDB,
  setupTestDB,
  teardownTestDB,
  createAndApproveUser,
  createAndApproveUserForUserManagement,
};
