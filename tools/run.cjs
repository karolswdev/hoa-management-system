#!/usr/bin/env node

/**
 * tools/run.cjs
 *
 * Cross-platform script to run the HOA Management System.
 * Ensures dependencies are installed before starting the application.
 */

const { execSync, spawn } = require('child_process');
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
 * Start a process and return the child process object
 */
function startProcess(name, command, args, cwd) {
  info(`Starting ${name}...`);

  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    error(`${name} failed to start: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      log(`${name} was killed with signal ${signal}`, colors.yellow);
    } else if (code !== 0) {
      error(`${name} exited with code ${code}`);
    }
  });

  return child;
}

/**
 * Main execution function
 */
function main() {
  try {
    const rootDir = path.resolve(__dirname, '..');

    log('\n=== HOA Management System - Starting Application ===\n', colors.cyan);

    // Ensure dependencies are installed
    if (!ensureDependencies()) {
      error('Cannot start application without dependencies');
      process.exit(1);
    }

    log('\n' + '='.repeat(60) + '\n', colors.cyan);

    // Determine which component to run based on arguments
    const args = process.argv.slice(2);
    const component = args[0] || 'both';

    const backendPath = path.join(rootDir, 'backend');
    const frontendPath = path.join(rootDir, 'frontend');

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const processes = [];

    // Start backend
    if (component === 'backend' || component === 'both') {
      if (!fs.existsSync(path.join(backendPath, 'package.json'))) {
        error('Backend package.json not found');
        process.exit(1);
      }

      const backendProcess = startProcess(
        'Backend',
        npmCmd,
        ['start'],
        backendPath
      );

      processes.push({ name: 'Backend', process: backendProcess });
    }

    // Start frontend
    if (component === 'frontend' || component === 'both') {
      if (!fs.existsSync(path.join(frontendPath, 'package.json'))) {
        error('Frontend package.json not found');
        process.exit(1);
      }

      const frontendProcess = startProcess(
        'Frontend',
        npmCmd,
        ['run', 'dev'],
        frontendPath
      );

      processes.push({ name: 'Frontend', process: frontendProcess });
    }

    if (processes.length === 0) {
      error('Invalid component specified. Use: backend, frontend, or both');
      console.log('\nUsage:');
      console.log('  node tools/run.cjs [component]');
      console.log('\nComponents:');
      console.log('  backend   - Run only the backend server');
      console.log('  frontend  - Run only the frontend dev server');
      console.log('  both      - Run both backend and frontend (default)');
      process.exit(1);
    }

    // Handle cleanup on exit
    const cleanup = () => {
      log('\nShutting down...', colors.yellow);
      processes.forEach(({ name, process: proc }) => {
        if (!proc.killed) {
          info(`Stopping ${name}...`);
          proc.kill('SIGTERM');
        }
      });
    };

    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });

    // Wait for all processes to exit
    let exitCode = 0;
    let processesRemaining = processes.length;

    processes.forEach(({ name, process: proc }) => {
      proc.on('exit', (code) => {
        processesRemaining--;
        if (code !== 0 && code !== null) {
          exitCode = code;
        }

        if (processesRemaining === 0) {
          process.exit(exitCode);
        }
      });
    });

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
  startProcess
};
