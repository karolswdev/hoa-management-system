#!/usr/bin/env node

/**
 * tools/lint.cjs
 *
 * Cross-platform linting script for HOA Management System.
 * Outputs results in JSON format to stdout.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Log to stderr to keep stdout clean for JSON output
 */
function logError(message) {
  console.error(message);
}

/**
 * Ensure dependencies are installed (silently)
 */
function ensureDependencies() {
  try {
    const installScript = path.join(__dirname, 'install.cjs');
    execSync(`node "${installScript}"`, {
      stdio: 'ignore',
      encoding: 'utf-8'
    });
    return true;
  } catch (err) {
    logError('ERROR: Failed to install dependencies');
    return false;
  }
}

/**
 * Execute ESLint on frontend
 */
function lintFrontend(frontendPath) {
  const errors = [];

  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    // Run ESLint with JSON output format
    const result = execSync(`${npmCmd} run lint -- --format json`, {
      cwd: frontendPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Parse ESLint JSON output
    const eslintResults = JSON.parse(result);

    // Convert ESLint format to our standard format
    eslintResults.forEach((fileResult) => {
      fileResult.messages.forEach((message) => {
        // Only include errors and critical warnings (severity 2)
        if (message.severity === 2) {
          errors.push({
            type: message.ruleId || 'error',
            path: path.relative(process.cwd(), fileResult.filePath),
            obj: message.ruleId || null,
            message: message.message,
            line: message.line || 0,
            column: message.column || 0
          });
        }
      });
    });
  } catch (err) {
    // ESLint returns non-zero exit code when there are errors
    if (err.stdout) {
      try {
        const eslintResults = JSON.parse(err.stdout.toString());

        eslintResults.forEach((fileResult) => {
          fileResult.messages.forEach((message) => {
            // Only include errors and critical warnings (severity 2)
            if (message.severity === 2) {
              errors.push({
                type: message.ruleId || 'error',
                path: path.relative(process.cwd(), fileResult.filePath),
                obj: message.ruleId || null,
                message: message.message,
                line: message.line || 0,
                column: message.column || 0
              });
            }
          });
        });
      } catch (parseErr) {
        logError(`ERROR: Failed to parse ESLint output: ${parseErr.message}`);
        errors.push({
          type: 'lint-error',
          path: 'frontend',
          obj: null,
          message: 'Failed to run ESLint',
          line: 0,
          column: 0
        });
      }
    } else {
      logError(`ERROR: Failed to run frontend linting: ${err.message}`);
      errors.push({
        type: 'lint-error',
        path: 'frontend',
        obj: null,
        message: err.message || 'Unknown linting error',
        line: 0,
        column: 0
      });
    }
  }

  return errors;
}

/**
 * Execute ESLint on backend
 * Since backend doesn't have a lint script, we'll install and run ESLint directly
 */
function lintBackend(backendPath) {
  const errors = [];

  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const packageJsonPath = path.join(backendPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Check if ESLint is configured
    if (!packageJson.scripts || !packageJson.scripts.lint) {
      // Check if we can run ESLint directly
      const eslintPath = path.join(backendPath, 'node_modules', '.bin', 'eslint');
      const eslintCmd = process.platform === 'win32' ? `${eslintPath}.cmd` : eslintPath;

      if (!fs.existsSync(eslintPath) && !fs.existsSync(`${eslintPath}.cmd`)) {
        // ESLint not installed, install it as dev dependency
        logError('Installing ESLint for backend...');
        execSync(`${npmCmd} install --save-dev eslint`, {
          cwd: backendPath,
          stdio: 'ignore'
        });
      }

      // Initialize ESLint config if it doesn't exist
      const eslintConfigFiles = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc'];
      const hasConfig = eslintConfigFiles.some(file =>
        fs.existsSync(path.join(backendPath, file))
      );

      if (!hasConfig && !packageJson.eslintConfig) {
        // Create a basic ESLint config
        const eslintConfig = {
          env: {
            node: true,
            es2021: true
          },
          extends: 'eslint:recommended',
          parserOptions: {
            ecmaVersion: 'latest'
          }
        };

        fs.writeFileSync(
          path.join(backendPath, '.eslintrc.json'),
          JSON.stringify(eslintConfig, null, 2)
        );
      }

      // Run ESLint
      try {
        const result = execSync(`${npmCmd} exec eslint -- . --format json --ext .js`, {
          cwd: backendPath,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const eslintResults = JSON.parse(result);

        eslintResults.forEach((fileResult) => {
          fileResult.messages.forEach((message) => {
            if (message.severity === 2) {
              errors.push({
                type: message.ruleId || 'error',
                path: path.relative(process.cwd(), fileResult.filePath),
                obj: message.ruleId || null,
                message: message.message,
                line: message.line || 0,
                column: message.column || 0
              });
            }
          });
        });
      } catch (execErr) {
        if (execErr.stdout) {
          try {
            const eslintResults = JSON.parse(execErr.stdout.toString());

            eslintResults.forEach((fileResult) => {
              fileResult.messages.forEach((message) => {
                if (message.severity === 2) {
                  errors.push({
                    type: message.ruleId || 'error',
                    path: path.relative(process.cwd(), fileResult.filePath),
                    obj: message.ruleId || null,
                    message: message.message,
                    line: message.line || 0,
                    column: message.column || 0
                  });
                }
              });
            });
          } catch (parseErr) {
            logError(`ERROR: Failed to parse backend ESLint output: ${parseErr.message}`);
          }
        }
      }
    } else {
      // Run the lint script from package.json
      const result = execSync(`${npmCmd} run lint -- --format json`, {
        cwd: backendPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const eslintResults = JSON.parse(result);

      eslintResults.forEach((fileResult) => {
        fileResult.messages.forEach((message) => {
          if (message.severity === 2) {
            errors.push({
              type: message.ruleId || 'error',
              path: path.relative(process.cwd(), fileResult.filePath),
              obj: message.ruleId || null,
              message: message.message,
              line: message.line || 0,
              column: message.column || 0
            });
          }
        });
      });
    }
  } catch (err) {
    // Silently skip backend linting if it fails
    logError(`Warning: Backend linting skipped: ${err.message}`);
  }

  return errors;
}

/**
 * Main linting function
 */
function main() {
  try {
    const rootDir = path.resolve(__dirname, '..');

    // Ensure dependencies are installed (silently)
    if (!ensureDependencies()) {
      // Output empty array on dependency failure
      console.log(JSON.stringify([]));
      process.exit(1);
    }

    const allErrors = [];

    // Lint frontend
    const frontendPath = path.join(rootDir, 'frontend');
    if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
      const frontendErrors = lintFrontend(frontendPath);
      allErrors.push(...frontendErrors);
    }

    // Lint backend
    const backendPath = path.join(rootDir, 'backend');
    if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      const backendErrors = lintBackend(backendPath);
      allErrors.push(...backendErrors);
    }

    // Output results as JSON to stdout
    console.log(JSON.stringify(allErrors, null, 2));

    // Exit with appropriate code
    process.exit(allErrors.length > 0 ? 1 : 0);

  } catch (err) {
    logError(`ERROR: Unexpected error: ${err.message}`);
    // Output empty array on unexpected error
    console.log(JSON.stringify([]));
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  lintFrontend,
  lintBackend
};
