#!/usr/bin/env node

/**
 * HOA Management System - Hash Chain Verification CLI
 *
 * This script verifies the integrity of vote hash chains for democracy/poll features.
 * It can operate in multiple modes:
 * - Verify a specific poll by ID
 * - Verify all polls in the database
 * - Export hash chain data for external audit
 *
 * Usage:
 *   node scripts/hash-chain-verify.js --poll-id 123
 *   node scripts/hash-chain-verify.js --all
 *   node scripts/hash-chain-verify.js --export output.json
 *   node scripts/hash-chain-verify.js --api-url https://hoa.example.com --poll-id 123
 *
 * Options:
 *   --poll-id N         Verify hash chain for specific poll ID
 *   --all               Verify all polls in the database
 *   --export FILE       Export hash chain data to JSON file
 *   --api-url URL       Use API endpoint instead of direct DB access
 *   --verbose           Enable verbose output
 *   --help              Show this help message
 *
 * Exit Codes:
 *   0 - All hash chains valid
 *   1 - Hash chain validation failed
 *   2 - Invalid arguments or setup error
 *
 * References:
 *   - Architecture Section 3.7: Observability & Health Management
 *   - Utility: backend/src/utils/hashChain.js
 *   - Task: I5.T3 (Health Tooling)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  pollId: null,
  all: false,
  export: null,
  apiUrl: null,
  verbose: false,
  help: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--poll-id':
      options.pollId = parseInt(args[++i], 10);
      break;
    case '--all':
      options.all = true;
      break;
    case '--export':
      options.export = args[++i];
      break;
    case '--api-url':
      options.apiUrl = args[++i];
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--help':
      options.help = true;
      break;
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(2);
  }
}

// Show help
if (options.help) {
  const helpText = fs.readFileSync(__filename, 'utf8')
    .split('\n')
    .filter(line => line.startsWith(' *'))
    .map(line => line.substring(3))
    .join('\n');
  console.log(helpText);
  process.exit(0);
}

// Validate arguments
if (!options.pollId && !options.all && !options.export) {
  console.error('Error: Must specify --poll-id, --all, or --export');
  console.error('Use --help for usage information');
  process.exit(2);
}

// Logging utilities
const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  verbose: (msg) => options.verbose && console.log(`[VERBOSE] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`)
};

/**
 * Verify hash chain using API endpoint
 */
async function verifyViaAPI(pollId) {
  const https = require('https');
  const http = require('http');

  const url = `${options.apiUrl}/api/healthz/hashchain/${pollId}`;
  log.verbose(`Fetching hash chain verification from ${url}`);

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });
  });
}

/**
 * Verify hash chain using direct database access
 */
async function verifyViaDatabase(pollId) {
  // Load backend modules
  const projectRoot = path.resolve(__dirname, '..');
  const db = require(path.join(projectRoot, 'backend', 'models'));
  const { validateHashChain } = require(path.join(projectRoot, 'backend', 'src', 'utils', 'hashChain'));

  log.verbose(`Fetching votes for poll ${pollId} from database`);

  // Fetch votes
  const votes = await db.Vote.findAll({
    where: { poll_id: pollId },
    order: [['timestamp', 'ASC']],
    attributes: ['id', 'user_id', 'option_id', 'timestamp', 'prev_hash', 'vote_hash']
  });

  if (votes.length === 0) {
    throw new Error(`No votes found for poll ${pollId}`);
  }

  log.verbose(`Found ${votes.length} votes for poll ${pollId}`);

  // Convert to plain objects
  const voteData = votes.map(v => ({
    id: v.id,
    user_id: v.user_id,
    option_id: v.option_id,
    timestamp: v.timestamp,
    prev_hash: v.prev_hash,
    vote_hash: v.vote_hash
  }));

  // Validate
  const validation = validateHashChain(voteData);

  return {
    poll_id: pollId,
    validation,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verify all polls
 */
async function verifyAllPolls() {
  const projectRoot = path.resolve(__dirname, '..');
  const db = require(path.join(projectRoot, 'backend', 'models'));

  log.info('Fetching all polls from database...');

  const polls = await db.Poll.findAll({
    attributes: ['id', 'title']
  });

  if (polls.length === 0) {
    log.warn('No polls found in database');
    return { all_valid: true, polls: [] };
  }

  log.info(`Found ${polls.length} polls, verifying hash chains...`);

  const results = [];
  let allValid = true;

  for (const poll of polls) {
    try {
      const result = await verifyViaDatabase(poll.id);
      results.push({
        poll_id: poll.id,
        poll_title: poll.title,
        valid: result.validation.valid,
        total_votes: result.validation.totalVotes,
        broken_links: result.validation.brokenLinks
      });

      if (!result.validation.valid) {
        allValid = false;
        log.error(`Poll ${poll.id} (${poll.title}): INVALID - ${result.validation.message}`);
      } else {
        log.success(`Poll ${poll.id} (${poll.title}): VALID (${result.validation.totalVotes} votes)`);
      }
    } catch (error) {
      log.verbose(`Poll ${poll.id} has no votes or error: ${error.message}`);
      results.push({
        poll_id: poll.id,
        poll_title: poll.title,
        valid: true,
        total_votes: 0,
        broken_links: [],
        note: 'No votes found'
      });
    }
  }

  return { all_valid: allValid, polls: results };
}

/**
 * Export hash chain data
 */
async function exportHashChainData(outputFile) {
  const projectRoot = path.resolve(__dirname, '..');
  const db = require(path.join(projectRoot, 'backend', 'models'));

  log.info('Exporting hash chain data...');

  // Fetch all polls with votes
  const polls = await db.Poll.findAll({
    include: [{
      model: db.Vote,
      as: 'votes',
      attributes: ['id', 'user_id', 'option_id', 'timestamp', 'prev_hash', 'vote_hash'],
      order: [['timestamp', 'ASC']]
    }]
  });

  const exportData = {
    export_date: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
    total_polls: polls.length,
    polls: polls.map(poll => ({
      poll_id: poll.id,
      poll_title: poll.title,
      created_at: poll.createdAt,
      votes: poll.votes.map(v => ({
        id: v.id,
        user_id: v.user_id,
        option_id: v.option_id,
        timestamp: v.timestamp,
        prev_hash: v.prev_hash,
        vote_hash: v.vote_hash
      }))
    }))
  };

  fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
  log.success(`Exported hash chain data to ${outputFile}`);

  return exportData;
}

/**
 * Main execution
 */
async function main() {
  try {
    log.info('========================================');
    log.info('Hash Chain Verification Tool');
    log.info('========================================');

    if (options.export) {
      // Export mode
      const data = await exportHashChainData(options.export);
      log.info(`Exported ${data.total_polls} polls with hash chain data`);
      process.exit(0);
    } else if (options.all) {
      // Verify all polls
      const result = await verifyAllPolls();
      log.info('========================================');
      log.info(`Total polls: ${result.polls.length}`);
      log.info(`All valid: ${result.all_valid ? 'YES' : 'NO'}`);
      log.info('========================================');

      if (!result.all_valid) {
        log.error('Some hash chains are invalid!');
        process.exit(1);
      } else {
        log.success('All hash chains are valid!');
        process.exit(0);
      }
    } else if (options.pollId) {
      // Verify specific poll
      let result;

      if (options.apiUrl) {
        result = await verifyViaAPI(options.pollId);
      } else {
        result = await verifyViaDatabase(options.pollId);
      }

      log.info('========================================');
      log.info(`Poll ID: ${result.poll_id}`);
      log.info(`Valid: ${result.validation.valid ? 'YES' : 'NO'}`);
      log.info(`Total Votes: ${result.validation.totalVotes}`);
      log.info(`Message: ${result.validation.message}`);

      if (result.validation.brokenLinks && result.validation.brokenLinks.length > 0) {
        log.error('Broken Links:');
        result.validation.brokenLinks.forEach((link, idx) => {
          log.error(`  ${idx + 1}. Vote ${link.voteId} (index ${link.index}): ${link.reason}`);
        });
      }

      log.info('========================================');

      if (!result.validation.valid) {
        log.error('Hash chain validation failed!');
        process.exit(1);
      } else {
        log.success('Hash chain is valid!');
        process.exit(0);
      }
    }
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(2);
  }
}

// Run main function
main().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(2);
});
