#!/usr/bin/env node

/**
 * tools/test.cjs
 *
 * Cross-platform testing script for HOA Management System.
 * Runs tests for both backend and frontend.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}ERROR: ${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Ensure dependencies are installed
 */
function ensureDependencies() {
  try {
    info('Checking and installing dependencies...');
    const installScript = path.join(__dirname, 'install.cjs');

    execSync(`node "${installScript}"`, {
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    success('Dependencies ready');
    return true;
  } catch (err) {
    error('Failed to install dependencies');
    return false;
  }
}

/**
 * Execute tests for a project directory
 */
function runTests(projectName, projectPath, testCommand) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    info(`No package.json found in ${projectName}, skipping tests...`);
    return true;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.scripts || !packageJson.scripts.test) {
    info(`No test script defined for ${projectName}, skipping tests...`);
    return true;
  }

  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`Running ${projectName} tests...`, colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    // Use provided test command or default to 'npm test'
    const command = testCommand || `${npmCmd} test`;

    execSync(command, {
      cwd: projectPath,
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    success(`${projectName} tests passed`);
    return true;
  } catch (err) {
    error(`${projectName} tests failed`);
    return false;
  }
}

/**
 * Main testing function
 */
function main() {
  try {
    const rootDir = path.resolve(__dirname, '..');

    log('\n=== HOA Management System - Running Tests ===\n', colors.cyan);

    // Ensure dependencies are installed
    if (!ensureDependencies()) {
      error('Cannot run tests without dependencies');
      process.exit(1);
    }

    const args = process.argv.slice(2);
    const component = args[0] || 'both';

    let backendSuccess = true;
    let frontendSuccess = true;

    // Run backend tests
    if (component === 'backend' || component === 'both') {
      const backendPath = path.join(rootDir, 'backend');
      backendSuccess = runTests('Backend', backendPath);
    }

    // Run frontend tests
    if (component === 'frontend' || component === 'both') {
      const frontendPath = path.join(rootDir, 'frontend');
      frontendSuccess = runTests('Frontend', frontendPath);
    }

    if (component !== 'backend' && component !== 'frontend' && component !== 'both') {
      error('Invalid component specified. Use: backend, frontend, or both');
      console.log('\nUsage:');
      console.log('  node tools/test.cjs [component]');
      console.log('\nComponents:');
      console.log('  backend   - Run only backend tests');
      console.log('  frontend  - Run only frontend tests');
      console.log('  both      - Run both backend and frontend tests (default)');
      process.exit(1);
    }

    // Final summary
    log('\n' + '='.repeat(60), colors.cyan);

    if (backendSuccess && frontendSuccess) {
      success('All tests passed!');
      log('='.repeat(60) + '\n', colors.cyan);
      process.exit(0);
    } else {
      error('Some tests failed');
      log('='.repeat(60) + '\n', colors.cyan);
      process.exit(1);
    }

  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runTests
};
