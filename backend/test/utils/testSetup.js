const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  // Setup test database
  try {
    execSync('npm run db:migrate:undo:all', { 
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
    execSync('npm run db:migrate', {
      cwd: path.join(__dirname, '../../'), 
      stdio: 'inherit'
    });
    execSync('npm run db:seed:undo:test:all', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'  
    });
    execSync('npm run db:seed:test', {
      cwd: path.join(__dirname, '../../'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }
};