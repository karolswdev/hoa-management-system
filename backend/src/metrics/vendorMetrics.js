const promClient = require('prom-client');
const { register } = require('../config/metrics');

/**
 * Vendor-specific Prometheus metrics
 *
 * Tracks vendor moderation actions, queue length, and directory freshness
 * to support KPIs outlined in operational architecture.
 *
 * Metrics align with:
 * - Vendor Directory Freshness: days since last vendor update
 * - Admin moderation workflow tracking
 * - Vendor submission and approval rates
 */

// Vendor moderation actions counter
// Tracks approve, deny, and pending state transitions
const vendorModerationsTotal = new promClient.Counter({
  name: 'hoa_vendor_moderations_total',
  help: 'Total number of vendor moderation actions',
  labelNames: ['action', 'from_state', 'to_state'],
  registers: [register],
});

// Pending vendors gauge
// Tracks current queue length for admin dashboard
const vendorsPending = new promClient.Gauge({
  name: 'hoa_vendors_pending',
  help: 'Number of vendors awaiting moderation',
  registers: [register],
});

// Total vendors by state gauge
const vendorsByState = new promClient.Gauge({
  name: 'hoa_vendors_by_state',
  help: 'Number of vendors by moderation state',
  labelNames: ['state'],
  registers: [register],
});

// Vendor submissions counter
const vendorSubmissionsTotal = new promClient.Counter({
  name: 'hoa_vendor_submissions_total',
  help: 'Total number of vendor submissions',
  labelNames: ['submitted_by_role'],
  registers: [register],
});

// Vendor updates counter
const vendorUpdatesTotal = new promClient.Counter({
  name: 'hoa_vendor_updates_total',
  help: 'Total number of vendor updates',
  labelNames: ['update_type'],
  registers: [register],
});

// Vendor deletions counter
const vendorDeletionsTotal = new promClient.Counter({
  name: 'hoa_vendor_deletions_total',
  help: 'Total number of vendor deletions',
  registers: [register],
});

/**
 * Helper functions to increment metrics
 */

/**
 * Record a vendor moderation action
 * @param {string} action - Action type (approve, deny, revert)
 * @param {string} fromState - Previous moderation state
 * @param {string} toState - New moderation state
 */
function recordModeration(action, fromState, toState) {
  vendorModerationsTotal.inc({ action, from_state: fromState, to_state: toState });
}

/**
 * Record a vendor submission
 * @param {string} submitterRole - Role of user submitting (member, admin)
 */
function recordSubmission(submitterRole) {
  vendorSubmissionsTotal.inc({ submitted_by_role: submitterRole });
}

/**
 * Record a vendor update
 * @param {string} updateType - Type of update (info, visibility, rating)
 */
function recordUpdate(updateType = 'general') {
  vendorUpdatesTotal.inc({ update_type: updateType });
}

/**
 * Record a vendor deletion
 */
function recordDeletion() {
  vendorDeletionsTotal.inc();
}

/**
 * Update gauge metrics for vendor states
 * Should be called periodically or after state changes
 * @param {Object} counts - State counts { pending, approved, denied }
 */
function updateVendorStateGauges(counts) {
  vendorsPending.set(counts.pending || 0);
  vendorsByState.set({ state: 'pending' }, counts.pending || 0);
  vendorsByState.set({ state: 'approved' }, counts.approved || 0);
  vendorsByState.set({ state: 'denied' }, counts.denied || 0);
}

module.exports = {
  // Metric objects (for testing/inspection)
  metrics: {
    vendorModerationsTotal,
    vendorsPending,
    vendorsByState,
    vendorSubmissionsTotal,
    vendorUpdatesTotal,
    vendorDeletionsTotal,
  },

  // Helper functions
  recordModeration,
  recordSubmission,
  recordUpdate,
  recordDeletion,
  updateVendorStateGauges,
};
