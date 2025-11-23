#!/usr/bin/env node

/**
 * tools/install.cjs
 *
 * Cross-platform dependency installation script for HOA Management System.
 * Handles both backend and frontend Node.js dependencies.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
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
 * Execute a command with proper error handling
 */
function exec(command, cwd, options = {}) {
  try {
    const defaultOptions = {
      cwd,
      stdio: 'inherit',
      encoding: 'utf-8',
      ...options
    };

    execSync(command, defaultOptions);
    return true;
  } catch (err) {
    error(`Command failed: ${command}`);
    if (err.stderr) {
      console.error(err.stderr.toString());
    }
    return false;
  }
}

/**
 * Check if dependencies need to be installed
 */
function needsInstall(projectPath) {
  const nodeModulesPath = path.join(projectPath, 'node_modules');
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageLockPath = path.join(projectPath, 'package-lock.json');

  // If node_modules doesn't exist, definitely need to install
  if (!fs.existsSync(nodeModulesPath)) {
    return true;
  }

  // If package.json doesn't exist, no need to install
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJsonStat = fs.statSync(packageJsonPath);
    const nodeModulesStat = fs.statSync(nodeModulesPath);

    // If package.json is newer than node_modules, need to reinstall
    if (packageJsonStat.mtimeMs > nodeModulesStat.mtimeMs) {
      return true;
    }

    // If package-lock.json exists and is newer than node_modules, need to reinstall
    if (fs.existsSync(packageLockPath)) {
      const packageLockStat = fs.statSync(packageLockPath);
      if (packageLockStat.mtimeMs > nodeModulesStat.mtimeMs) {
        return true;
      }
    }
  } catch (err) {
    // If we can't stat, assume we need to install
    return true;
  }

  return false;
}

/**
 * Install dependencies for a project directory
 */
function installDependencies(projectName, projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    info(`No package.json found in ${projectName}, skipping...`);
    return true;
  }

  info(`Checking ${projectName} dependencies...`);

  if (!needsInstall(projectPath)) {
    success(`${projectName} dependencies are up to date`);
    return true;
  }

  info(`Installing ${projectName} dependencies...`);

  // Determine npm command based on platform
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  // Use npm ci if package-lock.json exists, otherwise npm install
  const packageLockPath = path.join(projectPath, 'package-lock.json');
  const installCmd = fs.existsSync(packageLockPath) ? 'ci' : 'install';

  const result = exec(`${npmCmd} ${installCmd}`, projectPath);

  if (result) {
    success(`${projectName} dependencies installed successfully`);
  } else {
    error(`Failed to install ${projectName} dependencies`);
  }

  return result;
}

/**
 * Main installation process
 */
function main() {
  try {
    const rootDir = path.resolve(__dirname, '..');

    log('\n=== HOA Management System - Dependency Installation ===\n', colors.blue);

    // Install backend dependencies
    const backendPath = path.join(rootDir, 'backend');
    const backendSuccess = installDependencies('Backend', backendPath);

    if (!backendSuccess) {
      error('Backend installation failed');
      process.exit(1);
    }

    // Install frontend dependencies
    const frontendPath = path.join(rootDir, 'frontend');
    const frontendSuccess = installDependencies('Frontend', frontendPath);

    if (!frontendSuccess) {
      error('Frontend installation failed');
      process.exit(1);
    }

    log('\n' + '='.repeat(60), colors.blue);
    success('All dependencies installed successfully!');
    log('='.repeat(60) + '\n', colors.blue);

    process.exit(0);
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
  installDependencies,
  needsInstall
};
