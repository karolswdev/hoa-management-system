const request = require('supertest');
const app = require('../../src/app');
const { execSync } = require('child_process');
const path = require('path');

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

const setupTestDB = () => {
  console.log('--- Setting up test database ---');
  // Run migrations to create the tables
  run('NODE_ENV=test npx sequelize-cli db:migrate');
  // Run seeders to populate the tables
  run('NODE_ENV=test npx sequelize-cli db:seed:all --seeders-path test/seeders');
  console.log('--- Test database setup complete ---');
};

const teardownTestDB = () => {
  console.log('--- Tearing down test database ---');
  // Undo all migrations to leave a clean state
  run('NODE_ENV=test npx sequelize-cli db:migrate:undo:all');
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
    execSync('NODE_ENV=test npm run db:migrate:undo:all', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
    execSync('NODE_ENV=test npm run db:migrate', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
    execSync('NODE_ENV=test npm run db:seed:undotest:all', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
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
  
  // A simple check to ensure registration worked before proceeding
  if (registerRes.statusCode !== 201) {
    console.error('Failed to register user in helper:', registerRes.body);
    throw new Error(`User registration failed for ${userDetails.email}`);
  }
  const newUserId = registerRes.body.user.id;

  // 2. Approve the user
  const approvalRes = await request(app)
    .put(`/api/admin/users/${newUserId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' });

  if (approvalRes.statusCode !== 200) {
    console.error('Failed to approve user in helper:', approvalRes.body);
    throw new Error(`User approval failed for ${userDetails.email}`);
  }

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
  
  if (registerRes.statusCode !== 201) {
    console.error('Failed to register user in helper:', registerRes.body);
    throw new Error(`User registration failed for ${userDetails.email}`);
  }
  const newUserId = registerRes.body.user.id;

  // 2. Approve the user
  const approvalRes = await request(app)
    .put(`/api/admin/users/${newUserId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' });

  if (approvalRes.statusCode !== 200) {
    console.error('Failed to approve user in helper:', approvalRes.body);
    throw new Error(`User approval failed for ${userDetails.email}`);
  }

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